const {app, BrowserWindow, globalShortcut, desktopCapturer, ipcMain} = require('electron');
const path = require('path')
const fs = require('fs');
const StreamZip = require('node-stream-zip')
const ejse = require('ejs-electron')
const jsonc = require('jsonc-parser')

const fileArgumentIndex = app.isPackaged ? 1 : 2

app.on('ready', () => {
  const args = process.argv

  const spectrumWindow = new BrowserWindow({
    fullscreen: false,
    backgroundColor: '#000',
    webPreferences: {
      webSecurity: false,
      allowNavigationToBlobURLs: true,
      preload: path.join(__dirname, 'preload.js')
    }
  })

  let properties

  if (checkForConfig(args)) {
    spectrumWindow.setMenuBarVisibility(false)

    const configPath = getConfigPath(args)
    const config = readConfig(configPath)
    properties = config.properties

    if (config instanceof Error) {
      const templateData = {
        error: config
      }

      ejse.data('data', templateData)
      spectrumWindow.loadURL(`file://${__dirname}/spectrum.ejs`)
    }
    else {
      importVisualizerContent(config.visualizerPath)
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

    app.on('will-quit', () => {
      globalShortcut.unregisterAll()
    })

    function moveWindowToScreen(index) {
      const screens = require('electron').screen.getAllDisplays();

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
  }
  else {
    console.error('Invalid Config')
  }
})

function isMac() {
  if (process.platform === 'darwin') return true
  return false
}

function checkForConfig(args) {
  if (!args[fileArgumentIndex]) return false
  const configPath = getConfigPath(args)
  if (!isFilePath(configPath)) return false
  if (getFileExtension(configPath) !== '.lvc') return false

  return true
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

async function importVisualizerContent(visualizerPath) {
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

      if (entry.name == 'visualizer.html') files.html = true
      if (entry.name == 'visualizer.css') files.css = true
      if (entry.name == 'visualizer.js') files.js = true
    }

    const htmlData = files.html ? await zip.entryData('visualizer.html') : null
    const cssData = files.css ? await zip.entryData('visualizer.css') : null
    const jsData = files.js ? await zip.entryData('visualizer.js') : null

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