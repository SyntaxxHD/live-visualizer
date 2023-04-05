const { app, BrowserWindow, globalShortcut, ipcMain, screen } = require('electron');
const path = require('path')
const fs = require('fs');
const StreamZip = require('node-stream-zip')
const ejse = require('ejs-electron')
const jsonc = require('jsonc-parser')
const FileType = require('file-type')

const fileArgumentIndex = app.isPackaged ? 1 : 2
const globalFiles = []
const globalErrors = []
const args = process.argv
let spectrumWindow
let properties = {}

app.on('ready', () => {
  if (checkForConfig(args)) {
    openSpectrumWindow()
  }
  else {
    console.log('No config file found. To be implemented.')
  }
})

function openSpectrumWindow() {
  const configPath = getConfigPath(args)
  const config = readConfig(configPath)
  const images = config?.content?.images
  properties = config?.content?.properties

  spectrumWindow = new BrowserWindow({
    fullscreen: true,
    backgroundColor: '#000',
    webPreferences: {
      devTools: config?.content?.dev,
      contextIsolation: false,
      preload: path.join(__dirname, 'preload.js')
    }
  })
  spectrumWindow.setMenuBarVisibility(false)

  if (config instanceof Error) {
    const templateData = {
      error: config
    }

    ejse.data('data', templateData)
    spectrumWindow.loadURL(`file://${__dirname}/spectrum.ejs`)
  }
  else {
    importVisualizerContent(config.visualizerPath, images)
      .then(templateData => {
        ejse.data('data', templateData)
        spectrumWindow.loadURL(`file://${__dirname}/spectrum.ejs`)
      })
      .catch(error => {
        const templateData = {
          error: error
        }

        ejse.data('data', templateData)
        spectrumWindow.loadURL(`file://${__dirname}/spectrum.ejs`)
      })
  }

  for (let i = 1; i <= 9; i++) {
    globalShortcut.register(`CommandOrControl+${i}`, () => {
      moveWindowToScreen(i - 1)
    })
  }
}

function isMac() {
  return process.platform === 'darwin';
}

function checkForConfig(args) {
  if (!args[fileArgumentIndex]) return false
  const configPath = getConfigPath(args)
  if (!isFilePath(configPath)) return false
  return getFileExtension(configPath) === '.lvc';
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
    return { content: config, visualizerPath: visualizerPath }
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
  event.returnValue = properties
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
  return path.extname(filename).toLowerCase();
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
          if (entry.name != `images/${element}`) continue

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
  return window.webContents.send('error-message', error)
}