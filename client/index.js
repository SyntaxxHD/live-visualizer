const {app, BrowserWindow, globalShortcut, desktopCapturer} = require('electron');
const path = require('path')

app.on('ready', () => {
  let spectrumWindow = new BrowserWindow({
    fullscreen: false,
    backgroundColor: '#000',
    preload: path.join(__dirname, 'preload.js')
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

      spectrumWindow.setBounds(screen.bounds)
    }
  }

  async function selectAudioSource() {
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
          chromeMediaSourceId: inputSources[0].id
        }
      }
    }

    ipcRenderer.send('audio-spectrum', constraints)
  }

  selectAudioSource()
})