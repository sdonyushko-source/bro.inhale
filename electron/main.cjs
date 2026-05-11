const { app, BrowserWindow } = require('electron')
const path = require('path')

function createWindow() {
  const win = new BrowserWindow({
    width: 208,
    height: 248,
    useContentSize: true,
    minWidth: 208,
    maxWidth: 208,
    minHeight: 248,
    maxHeight: 248,
    resizable: false,
    maximizable: false,
    fullscreenable: false,
    backgroundColor: '#181A2C',
    title: 'bro.inhale',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  })

  win.loadFile(path.join(__dirname, '../dist/index.html'))
}

app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
