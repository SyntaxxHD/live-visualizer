const {app, BrowserWindow, globalShortcut, desktopCapturer, ipcMain} = require('electron');
const path = require('path')
const fs = require('fs');
const StreamZip = require('node-stream-zip')
const ejse = require('ejs-electron')

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

  if (checkForConfig(args)) {
    spectrumWindow.setMenuBarVisibility(false)

    const configPath = getConfigPath(args)

    importConfigContent(configPath)
    .then(() => {
      spectrumWindow.loadURL(`file://${__dirname}/spectrum.ejs`)
    })
  
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
})

function isMac() {
  if (process.platform === 'darwin') return true
  return false
}

function checkForConfig(args) {
  if (!args[fileArgumentIndex]) return false
  const configPath = args[fileArgumentIndex]
  if (!isFilePath(configPath)) return false
  if (getFileExtension(configPath) !== '.lvc') return false
  
  return true
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
  return args[fileArgumentIndex]
}

async function importConfigContent(configPath) {
  const zip = new StreamZip.async({
    file: configPath,
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
}

function createViewBlob(files, htmlData, cssData, jsData) {
  const cssBase64 = files.css ? Buffer.from(cssData).toString('base64') : null;
  const jsBase64 = files.js ? Buffer.from(jsData).toString('base64') : null;

  const templateData =  {
    files: files,
    import: {
      html: htmlData,
      css: cssBase64,
      js: jsBase64
    }
  }

  return ejse.data('data', templateData)
}