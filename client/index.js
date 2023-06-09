const {app, BrowserWindow, globalShortcut, ipcMain, screen} = require('electron')
const path = require('path')
const url = require('url')
const fs = require('fs')
const StreamZip = require('node-stream-zip')
const ejse = require('ejs-electron')
const jsonc = require('jsonc-parser')
const FileType = require('file-type')
const windowStateKeeper = require('electron-window-state')
const colorParse = require('color-parse')
const colorConvert = require('color-convert')
const chokidar = require('chokidar')
const Store = require('electron-store');
const {autoUpdater} = require('electron-updater')

const store = new Store()
const errorNames = {
  INVALID_CONFIG: 'Invalid Live Visualizer Configuration',
  INVALID_VISUALIZER: 'Invalid Live Visualizer'
}

const fileArgumentIndex = app.isPackaged ? 1 : 2
const globalFiles = []
const globalErrors = []
const args = process.argv
let spectrumWindow
let loadedConfig = {
  content: '',
  path: '',
  unlinked: true,
  valid: false,
  properties: {}
}
let pauseFileWatch = false
let update = {
  available: false,
  downloaded: false
}

let uiWindow

app.on('ready', () => {
  if (checkForConfig(args)) {
    openSpectrumWindow()
  }
  else {
    openUIWindow()
  }
})

function openSpectrumWindow() {
  const configPath = getConfigPath(args)
  const config = readConfig(configPath)
  const images = config?.content?.images
  const properties = getSpectrumProperties(config?.content?.properties || {})
  loadedConfig.properties = properties

  if (config instanceof Error || properties instanceof Error) {
    const error = config instanceof Error ? config : properties;
    const templateData = {
      error: error
    }

    createSpectrumWindow(config, templateData)
  }
  else {
    importVisualizerContent(config.visualizerPath, images)
      .then(templateData => {
        loadedConfig.path = configPath
        createSpectrumWindow(config, templateData)
        watchSpectrumConfigChanges()
      })
      .catch(error => {
        const templateData = {
          error: error
        }
        createSpectrumWindow(config, templateData)
      })
  }

  ipcMain.on('spectrum.global.files.get', (event, arg) => {
    event.returnValue = getGlobalFile(arg)
  })

  ipcMain.on('spectrum.global.errors.get', event => {
    event.returnValue = globalErrors
  })

  ipcMain.on('spectrum.properties.get', event => {
    event.returnValue = loadedConfig.properties
  })

  ipcMain.on('spectrum.colors.rgb', (event, arg) => {
    event.returnValue = convertoToRGB(arg)
  })

  for (let i = 1; i <= 9; i++) {
    globalShortcut.register(`CommandOrControl+${i}`, () => {
      moveWindowToScreen(i - 1)
    })
  }
}

function isMac() {
  return process.platform === 'darwin'
}

function checkForConfig(args) {
  if (!args[fileArgumentIndex]) return false
  const configPath = getConfigPath(args)
  if (!isFilePath(configPath)) return false
  return getFileExtension(configPath) === '.lvc'
}

function readConfig(configPath) {
  try {
    const fileContent = fs.readFileSync(configPath, 'utf-8')
    const config = jsonc.parse(fileContent)
    if (!config.visualizer_path) {
      const error = new Error('The Visualizer path is missing in the configuration file')
      error.name = errorNames.INVALID_CONFIG
      throw error
    }
    const visualizerPath = path.resolve(path.dirname(configPath), config.visualizer_path)
    if (!isFilePath(visualizerPath)) {
      const error = new Error('The Visualizer path is invalid or not a file')
      error.name = errorNames.INVALID_CONFIG
      throw error
    }
    return {content: config, visualizerPath: visualizerPath}
  } catch (err) {
    return err
  }
}


function moveWindowToScreen(index) {
  const screens = screen.getAllDisplays()

  if (index >= 0 && index < screens.length) {
    const screen = screens[index]

    if (isMac()) {
      spectrumWindow.setFullScreen(false)

      setTimeout(() => {
        spectrumWindow.setBounds(screen.bounds)
        spectrumWindow.setFullScreen(true)
      }, 1000)
    }
    else {
      spectrumWindow.setBounds(screen.bounds)
    }
  }
}

ipcMain.on('all.settings.audiosource.get', event => {
  event.returnValue = getAudiosource()
})

ipcMain.on('all.platform.mac', event => {
  event.returnValue = isMac()
})

app.on('will-quit', () => {
  globalShortcut.unregisterAll()
})

function isFilePath(string) {
  try {
    return fs.statSync(string).isFile()
  } catch (error) {
    return false
  }
}

function getFileExtension(filename) {
  return path.extname(filename).toLowerCase()
}

function getConfigPath(args) {
  return path.resolve(__dirname, args[fileArgumentIndex])
}

const allowedFolders = [
  'images'
]

async function importVisualizerContent(visualizerPath, images) {
  try {
    const zip = new StreamZip.async({
      file: visualizerPath,
      storeEntries: true
    })

    let files = {
      html: false,
      css: false,
      js: false
    }

    const entries = await zip.entries()
    for (const entry of Object.values(entries)) {
      if (entry.isDirectory) continue

      if (images instanceof Array && isInFolder(entry.name)) {
        for (const element of images) {
          if (entry.name != `${allowedFolders[0]}/${element}`) continue

          const image = await zip.entryData(entry.name)
          if (!(await isImage(image))) {
            addGlobalError(new Error(`Invalid File: ${entry.name} is not a valid image file. Please check allowed image files.`))
            continue
          }
          await addToGlobalFiles(element, image)
        }
      }

      if (entry.name == 'visualizer.html') files.html = true
      if (entry.name == 'visualizer.css') files.css = true
      if (entry.name == 'visualizer.js') files.js = true
    }
    if (!files.html) throw new Error('The Visualizer is missing a html file.')

    const [htmlData, cssData, jsData] = await Promise.all([
      files.html ? zip.entryData('visualizer.html') : null,
      files.css ? zip.entryData('visualizer.css') : null,
      files.js ? zip.entryData('visualizer.js') : null,
    ])

    zip.close()

    return createViewBlob(files, htmlData, cssData, jsData)
  } catch (err) {
    const error = new Error(err.message)
    error.name = errorNames.INVALID_VISUALIZER
    throw error
  }
}

function createViewBlob(files, htmlData, cssData, jsData) {
  const cssBase64 = files.css ? Buffer.from(cssData).toString('base64') : null
  const jsBase64 = files.js ? Buffer.from(jsData).toString('base64') : null

  const templateData = {
    files: files,
    import: {
      html: htmlData,
      css: cssBase64,
      js: jsBase64
    }
  }

  return templateData
}

function isInFolder(pathString) {
  const folder = path.dirname(pathString)
  return !!(folder)
}

async function isImage(buffer) {
  const safeImageMimeTypes = [
    'image/bmp',
    'image/gif',
    'image/jpeg',
    'image/png',
    'image/svg+xml',
    'image/webp'
  ]

  const file = await FileType.fromBuffer(buffer)
  return safeImageMimeTypes.includes(file?.mime)
}

async function addToGlobalFiles(name, buffer) {
  const file = await FileType.fromBuffer(buffer)
  const base64 = `data:${file.mime};base64,${buffer.toString('base64')}`
  return globalFiles.push({
    name: name,
    data: base64
  })
}

function addGlobalError(error) {
  return globalErrors.push(error)
}

function getGlobalFile(filename) {
  const file = globalFiles.find((f) => f.name === filename)
  if (!file) {
    const error = new Error(`Can't find this file. No file with the name ${filename} was imported. Make sure you specify them in the configuration.`)
    triggerErrorSpectrum(error)
    return null
  }
  return file.data
}

function triggerErrorSpectrum(error) {
  return spectrumWindow.webContents.send('spectrum.errors.message', error)
}

function openUIWindow() {
  const uiWindowState = windowStateKeeper({
    defaultWidth: 1000,
    defaultHeight: 800
  })

  uiWindow = new BrowserWindow({
    x: uiWindowState.x,
    y: uiWindowState.y,
    width: uiWindowState.width,
    height: uiWindowState.height,
    webPreferences: {
      //devTools: !app.isPackaged,
      contextIsolation: false,
      preload: path.join(__dirname, 'preload.js')
    }
  })

  uiWindow.setMenuBarVisibility(false)
  uiWindow.loadURL(`file://${path.join(__dirname, 'ui/index.html')}`)
  uiWindowState.manage(uiWindow)

  autoUpdater.autoDownload = false

  ipcMain.on('ui.properties.change.input', (event, arg) => {
    if (loadedConfig.unlinked || !loadedConfig.valid) return

    pauseFileWatch = true
    updateConfig(arg)
  })

  ipcMain.on('ui.settings.audiosource.set', (event, arg) => {
    store.set('settings.audiosource', arg)
  })

  ipcMain.on('ui.config.open', (event, arg) => {
    if (!isFilePath(arg) || getFileExtension(arg) !== '.lvc') return
    const {title, properties} = getUIProperties(arg) || {}
    if (title && properties) uiWindow.webContents.send('ui.properties.change.output', {title: title, properties: properties})

    watchUIConfigChanges()
  })

  ipcMain.on('ui.colors.palette.get', event => {
    event.returnValue = getColorsPalette()
  })

  ipcMain.on('ui.colors.palette.set', (event, arg) => {
    store.set('colors.palette', arg)
  })

  uiWindow.webContents.once('did-finish-load', async () => {
    autoUpdater.checkForUpdates()

    ipcMain.on('ui.update.download.start', event => {
      if (update.available) autoUpdater.downloadUpdate()
    })

    ipcMain.on('ui.update.install', event => {
      if (update.downloaded) autoUpdater.quitAndInstall(true, true)
    })

    autoUpdater.on('update-available', () => {
      update.available = true
      uiWindow.webContents.send('ui.update.available')
    })

    autoUpdater.on('update-downloaded', () => {
      update.downloaded = true
      uiWindow.webContents.send('ui.update.finish')
    })

    autoUpdater.on('error', error => {
      triggerErrorUI(error)
      uiWindow.webContents.send('ui.update.error')
    })

    autoUpdater.on('download-progress', progress => {
      uiWindow.webContents.send('ui.update.progress', progress.percent)
    })
  })
}

function getSpectrumProperties(properties) {
  let values = {}
  const subProperties = getCategoryProperties(properties)
  if (subProperties instanceof Error) return subProperties

  Object.assign(properties, properties, subProperties)

  for (let key in properties) {
    if (!('value' in properties[key])) continue

    values[key] =  {
      value: properties[key].value
    }
  }

  return values
}

function getCategoryProperties(properties) {
  try {
    let categoryProperties = {}

    function getSubProperties(propertiesObject) {
      for (let prop in propertiesObject) {
        if (propertiesObject.hasOwnProperty(prop)) {
          if (typeof propertiesObject[prop] === "object") {
            if (propertiesObject[prop].type === "category") {
              getSubProperties(propertiesObject[prop].properties)
            } else {
              if (properties[prop]) {
                const error = new Error(`Duplicate key '${prop}' found in properties and category properties.`)
                error.name = errorNames.INVALID_CONFIG
                throw error
              }
              categoryProperties[prop] = propertiesObject[prop]
            }
          }
        }
      }
    }

    for (let prop in properties) {
      if (properties.hasOwnProperty(prop)) {
        if (properties[prop].type === "category") {
          getSubProperties(properties[prop].properties)
        } else {
          if (categoryProperties[prop]) {
            const error = new Error(`Duplicate key '${prop}' found in top  properties and category properties.`)
            error.name = errorNames.INVALID_CONFIG
            throw error
          }
          categoryProperties[prop] = properties[prop]
        }
      }
    }

    return categoryProperties
  } catch (err) {
    return err
  }
}

function createSpectrumWindow(config, templateData) {
  spectrumWindow = new BrowserWindow({
    fullscreen: true,
    backgroundColor: '#000',
    webPreferences: {
      devTools: config?.content?.dev || true,
      contextIsolation: false,
      preload: path.join(__dirname, 'preload.js'),
      backgroundThrottling: false
    }
  })

  ejse.data('data', templateData)

  spectrumWindow.setMenuBarVisibility(false)
  spectrumWindow.loadURL(`file://${__dirname}/spectrum/spectrum.ejs`)
}

function getUIProperties(path) {
  const config = readUploadedConfig(path)
  if (config instanceof Error) triggerErrorUI(config)

  loadedConfig.content = JSON.stringify(config, null, 2)
  loadedConfig.path = path
  loadedConfig.unlinked = false

  if (!config.title) {
    loadedConfig.valid = false
    return triggerErrorUI(new Error('Invalid Config. Missing title.'))
  }
  if (!config.properties) return {title: config.title, properties: {}}
  loadedConfig.valid = true

  return {title: config.title, properties: validateProperties(config.properties)}
}

function readUploadedConfig(path) {
  try {
    if (checkForUploadConfig(path)) {
      const fileContent = fs.readFileSync(path, 'utf-8')
      return jsonc.parse(fileContent)
    }
  } catch (err) {
    return err
  }
}

function checkForUploadConfig(path) {
  if (!isFilePath(path)) return false
  return getFileExtension(path) === '.lvc'
}

function validateProperties(properties) {
  const modifiedProperties = properties
  for (const key in modifiedProperties) {
    const property = modifiedProperties[key]
    switch (property?.type) {
      case "slider":
        isSliderPropertyValid(property) || delete modifiedProperties[key]
        break
      case "checkbox":
        isCheckboxPropertyValid(property) || delete modifiedProperties[key]
        break
      case "select":
        isSelectPropertyValid(property) || delete modifiedProperties[key]
        break
      case "color":
        isColorPropertyValid(property) || delete modifiedProperties[key]
        break
      case "file":
        isFilePropertyValid(property) || delete modifiedProperties[key]
        break
      case "text":
        isTextPropertyValid(property) || delete modifiedProperties[key]
        break
      case "category":
        if (isCategoryPropertyValid(property)) {
          modifiedProperties[key].properties = validateProperties(property.properties)
        } else {
          delete modifiedProperties[key]
        }
        break;
      default:
        delete modifiedProperties[key]
        break
    }
  }
  return modifiedProperties
}

function isSliderPropertyValid(property) {
  const {label, type, value, min, max, step} = property
  return (
    'label' in property &&
    'type' in property &&
    'value' in property &&
    'min' in property &&
    'max' in property &&
    'step' in property &&
    !isNaN(value) &&
    !isNaN(min) &&
    !isNaN(max) &&
    !isNaN(step) &&
    typeof label === "string" &&
    typeof type === "string" &&
    typeof value === "number" &&
    typeof min === "number" &&
    typeof max === "number" &&
    typeof step === "number" &&
    value >= min &&
    value <= max &&
    min <= max &&
    step > 0
  )
}

function isCheckboxPropertyValid(property) {
  const {label, type, value} = property
  return (
    'label' in property &&
    'type' in property &&
    'value' in property &&
    typeof label === 'string' &&
    typeof type === 'string' &&
    typeof value === 'boolean'
  )
}

function isSelectPropertyValid(property) {
  const {label, type, options} = property
  return (
    'label' in property &&
    'type' in property &&
    'value' in property &&
    'options' in property &&
    typeof label === 'string' &&
    typeof type === 'string' &&
    Array.isArray(options) &&
    options.length > 0 &&
    options.every(option => {
      return (
        'label' in option &&
        'value' in option &&
        typeof option.label === 'string'
      )
    })
  )
}

function isColorPropertyValid(property) {
  const {label, type, value} = property;
  return (
    'label' in property &&
    'type' in property &&
    'value' in property &&
    typeof label === 'string' &&
    typeof type === 'string' &&
    typeof value === 'string'
  )
}

function isFilePropertyValid(property) {
  const {label, type, value, fileType} = property

  return (
    'label' in property &&
    'type' in property &&
    'value' in property &&
    'fileType' in property &&
    typeof label === 'string' &&
    typeof type === 'string' &&
    typeof value === 'string' &&
    typeof fileType === 'string' &&
    (fileType === 'image' || fileType === 'video')
  )
}

function isTextPropertyValid(property) {
  const {label, type, value} = property

  return (
    'label' in property &&
    'type' in property &&
    'value' in property &&
    typeof label === 'string' &&
    typeof type === 'string' &&
    typeof value === 'string'
  )
}

function isCategoryPropertyValid(property) {
  const {label, type, value, properties} = property

  return (
    'label' in property &&
    'type' in property &&
    'value' in property &&
    'properties' in property &&
    typeof label === 'string' &&
    typeof type === 'string' &&
    typeof value === 'boolean' &&
    typeof properties === 'object'
  )
}

function updateConfig(values) {
  const configContent = loadedConfig.content
  const configPath = loadedConfig.path

  const updatedConfigContent = updateConfigContent(values, configContent)
  loadedConfig.content = updatedConfigContent
  updateConfigFile(configPath, updatedConfigContent)
}

function updateConfigContent(formProperties, content) {
  if (!content) return

  let newConfig = JSON.parse(content)
  const configProperties = newConfig.properties

  for (const property in configProperties) {
    if (formProperties.hasOwnProperty(property)) {
      newConfig.properties[property].value = formProperties[property]
      if (configProperties[property].type == 'category' && configProperties[property].hasOwnProperty('properties')) {
        const subProperties = configProperties[property].properties
        for (const subProperty in subProperties) {
          if (formProperties.hasOwnProperty(subProperty)) {
            newConfig.properties[property].properties[subProperty].value = formProperties[subProperty]
          }
        }
      }
    }
  }

  return JSON.stringify(newConfig, null, 2)
}

function triggerErrorUI(error) {
  uiWindow.webContents.send('ui.errors.message', error)
  return null
}

function updateConfigFile(path, content) {
  fs.writeFile(path, content, 'utf8', err => {
    if (err) triggerErrorUI(err)
  })
}

function convertoToRGB(colorString) {
  if (!colorString) return {r: 0, g: 0, b: 0}
  try {
    const color = colorParse(colorString)

    if (color.space === 'hsl') {
      const rgb = colorConvert.hsl.rgb(color.values[0], color.values[1], color.values[2])
      return {r: rgb[0], g: rgb[1], b: rgb[2]}
    }
    else if (color.space === 'hex') {
      const rgb = colorConvert.hex.rgb(color.values)
      return {r: rgb[0], g: rgb[1], b: rgb[2]}
    }
    else if (color.space === 'rgb') {
      return {r: color.values[0], g: color.values[1], b: color.values[2]}
    }
    else {
      triggerErrorSpectrum(new Error(`Invalid color string: ${color}`))
      return {r: 0, g: 0, b: 0}
    }
  } catch (err) {
    triggerErrorSpectrum(err)
    return {r: 0, g: 0, b: 0}
  }
}

function watchUIConfigChanges() {
  const watcher = chokidar.watch(loadedConfig.path, {
    persistent: true,
  })

  watcher.on('change', changedFilePath => {
    if (pauseFileWatch) {
      pauseFileWatch = false
      return
    }

    if (changedFilePath === loadedConfig.path) {
      if (loadedConfig.unlinked) loadedConfig.unlinked = false

      const {title, properties} = getUIProperties(loadedConfig.path) || {}
      uiWindow.webContents.send('ui.properties.change.output', {title: title, properties: properties})
    }
  })
    .on('unlink', changedFilePath => {
      loadedConfig.unlinked = true;
      uiWindow.webContents.send('ui.properties.unlink')
    })
}

function watchSpectrumConfigChanges() {
  const watcher = chokidar.watch(loadedConfig.path, {
    persistent: true
  })

  watcher.on('change', changedFilePath => {
    if (changedFilePath === loadedConfig.path) {
      const config = readConfig(loadedConfig.path)
      const properties = getSpectrumProperties(config?.content?.properties || {})
      loadedConfig.properties = properties
      spectrumWindow.webContents.send('spectrum.properties.change.input', properties)
    }
  })
}

function getColorsPalette() {
  if (!store.has('colors.palette')) return null

  const palette = store.get('colors.palette')
  if (!isValidColorPalette(palette)) return null
  return palette
}

function isValidColorPalette(palette) {
  return (
    Array.isArray(palette) &&
    palette.length === 4 &&
    palette.every(item => {
      return typeof item === 'string'
    })
  )
}

function getAudiosource() {
  if (!store.has('settings.audiosource')) {
    if (isMac()) {
      store.set('settings.audiosource', 'default')
      return 'default'
    }
    store.set('settings.audiosource', 'desktop')
    return 'desktop'
  }
  const source = store.get('settings.audiosource')

  if (source === 'desktop' && isMac()) return 'default'
  return source
}