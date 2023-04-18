const {app, BrowserWindow, globalShortcut, ipcMain, screen} = require('electron')
const path = require('path')
const url = require('url')
const fs = require('fs')
const StreamZip = require('node-stream-zip')
const ejse = require('ejs-electron')
const jsonc = require('jsonc-parser')
const FileType = require('file-type')
const windowStateKeeper = require('electron-window-state')
const {get} = require('http')

const fileArgumentIndex = app.isPackaged ? 1 : 2
const globalFiles = []
const globalErrors = []
const args = process.argv
let spectrumWindow
let spectrumProperties = {}
let uiProperties = {}

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
  spectrumProperties = getSpectrumProperties(config?.content?.properties)
  uiProperties = config?.content?.properties

  if (config instanceof Error) {
    const templateData = {
      error: config
    }

    spectrumWindow = createSpectrumWindow(config)
    spectrumWindow.setMenuBarVisibility(false)
    ejse.data('data', templateData)
    spectrumWindow.loadURL(`file://${__dirname}/spectrum/spectrum.ejs`)
  }
  else {
    importVisualizerContent(config.visualizerPath, images)
      .then(templateData => {
        spectrumWindow = createSpectrumWindow(config)
        spectrumWindow.setMenuBarVisibility(false)
        ejse.data('data', templateData)
        spectrumWindow.loadURL(`file://${__dirname}/spectrum/spectrum.ejs`)
      })
      .catch(error => {
        const templateData = {
          error: error
        }

        spectrumWindow = createSpectrumWindow(config)
        spectrumWindow.setMenuBarVisibility(false)
        ejse.data('data', templateData)
        spectrumWindow.loadURL(`file://${__dirname}/spectrum/spectrum.ejs`)
      })
  }

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
      error.name = 'Invalid Live Visualizer Configuration'
      throw error
    }
    const visualizerPath = path.resolve(path.dirname(configPath), config.visualizer_path)
    if (!isFilePath(visualizerPath)) {
      const error = new Error('The Visualizer path is invalid or not a file')
      error.name = 'Invalid Live Visualizer Configuration.'
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

ipcMain.on('get-global-file', (event, arg) => {
  event.returnValue = getGlobalFile(arg)
})

ipcMain.on('get-global-errors', event => {
  event.returnValue = globalErrors
})

ipcMain.on('get-properties', event => {
  event.returnValue = spectrumProperties
})

ipcMain.on('get-ui-properties', event => {
  event.returnValue = uiProperties
})

ipcMain.on('open-config', (event, arg) => {
  uiWindow.webContents.send('ui-properties-update', getUIProperties(arg))
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
    error.name = 'Invalid Live Visualizer'
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
    const error = new Error(`Can't find this file. No file with the name ${filename} was imported.`)
    triggerError(error, spectrumWindow)
    return null
  }
  return file.data
}

function triggerError(error, window) {
  return spectrumWindow.webContents.send('error-message', error)
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
      devTools: !app.isPackaged,
      contextIsolation: false,
      preload: path.join(__dirname, 'preload.js')
    }
  })

  uiWindow.loadURL(url.format({
    pathname: path.join(__dirname, 'ui/index.html'),
    protocol: 'file:',
    slashes: true
  }))
}

function getSpectrumProperties(properties) {
  let values = {}
  const subProperties = getCategoryProperties(properties)
  Object.assign(properties, properties, subProperties)

  for (let key in properties) {
    values[key] = properties[key].value
    delete properties[key].value
  }

  return values
}

function getCategoryProperties(properties) {
  let categoryProperties = {}

  function getSubProperties(propertiesObject) {
    for (let prop in propertiesObject) {
      if (propertiesObject.hasOwnProperty(prop)) {
        if (typeof propertiesObject[prop] === "object") {
          if (propertiesObject[prop].type === "category") {
            getSubProperties(propertiesObject[prop].properties)
          } else {
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
        categoryProperties[prop] = properties[prop]
      }
    }
  }

  return categoryProperties
}

function createSpectrumWindow(config) {
  return new BrowserWindow({
    fullscreen: false,
    backgroundColor: '#000',
    webPreferences: {
      devTools: config?.content?.dev || true,
      contextIsolation: false,
      preload: path.join(__dirname, 'preload.js')
    }
  })
}

function getUIProperties(path) {
  const config = readUploadedConfig(path)
  return validateProperties(config.properties)
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
  for (const key in properties) {
    const property = properties[key]
    switch (property?.type) {
      case "slider":
        isSliderPropertyValid(property) || delete properties[key]
        break
      case "checkbox":
        isCheckboxPropertyValid(property) || delete properties[key]
        break
      case "select":
        isSelectPropertyValid(property) || delete properties[key]
        break
      case "color":
        isColorPropertyValid(property) || delete properties[key]
        break
      case "file":
        isFilePropertyValid(property) || delete properties[key]
        break
      case "text":
        isTextPropertyValid(property) || delete properties[key]
        break
      case "category":
        if (isCategoryPropertyValid(property)) {
          properties[key].properties = validateProperties(property.properties)
        } else {
          delete properties[key]
        }
        break;
      default:
        delete properties[key]
        break
    }
  }
  return properties
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
