const {app, BrowserWindow, globalShortcut, desktopCapturer} = require('electron');

app.on('ready', () => {
  let visualizerWindow = new BrowserWindow({
    fullscreen: false
  })

  desktopCapturer.getSources({
    types: ['audio']
  })
  .then(async sources => {
    for (const source of sources) {
      console.log(source.name)
    }
  })

  visualizerWindow.setMenuBarVisibility(false)
  visualizerWindow.loadFile('visualizer.html')

  for (let i = 1; i <= 9; i++) {
    globalShortcut.register(`CommandOrControl+${i}`, () => {
      moveWindowToScreen(i - 1);
    });
  }

  app.on('will-quit', () => {
    globalShortcut.unregisterAll();
  });

  function moveWindowToScreen(index) {
    const screens = require('electron').screen.getAllDisplays();

    if (index >= 0 && index < screens.length) {
      const screen = screens[index]

      visualizerWindow.setBounds(screen.bounds)
    }
  }
})