const {app, BrowserWindow, globalShortcut, desktopCapturer, ipcMain} = require('electron');
const path = require('path')

app.on('ready', () => {
  let spectrumWindow = new BrowserWindow({
    fullscreen: true,
    backgroundColor: '#000',
    webPreferences: {
      contextIsolation: false,
      nodeIntegration: false,
      preload: path.join(__dirname, 'preload.js')
    }
  })

  spectrumWindow.setMenuBarVisibility(false)
  spectrumWindow.loadFile('spectrum.html')

  for (let i = 1; i <= 9; i++) {
    globalShortcut.register(`CommandOrControl+${i}`, () => {
      moveWindowToScreen(i - 1)
    });
  }

  app.on('will-quit', () => {
    globalShortcut.unregisterAll()
  });

  function moveWindowToScreen(index) {
    const screens = require('electron').screen.getAllDisplays();

    if (index >= 0 && index < screens.length) {
      const screen = screens[index]

      if (process.platform === 'darwin') {
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

  async function getAudioSource() {
    const inputSources = await desktopCapturer.getSources({
      types: ['screen']
    });

    const constraints = {
      audio: {
        mandatory: {
          chromeMediaSource: 'desktop'
        }
      },
      video: {
        mandatory: {
          chromeMediaSource: 'desktop',
        }
      }
    }

    return constraints
  }

  ipcMain.handle('audio-source', async event => {
    const constraints = await getAudioSource()
    return constraints
  })
})