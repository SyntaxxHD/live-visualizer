const { app, BrowserWindow, globalShortcut } = require('electron');

app.on('ready', () => {
  let visualizerWindow = new BrowserWindow({
    fullscreen: true
  })


  visualizerWindow.setMenuBarVisibility(false)
  visualizerWindow.loadFile('index.html')

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