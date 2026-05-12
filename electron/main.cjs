const { app, BrowserWindow, dialog } = require('electron')
const { autoUpdater } = require('electron-updater')
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

function initAutoUpdater() {
  if (!app.isPackaged) {
    return
  }

  autoUpdater.on('checking-for-update', () => {
    console.log('[updater] checking for update')
  })

  autoUpdater.on('update-available', (info) => {
    console.log('[updater] update available', info?.version || info)
  })

  autoUpdater.on('update-not-available', (info) => {
    console.log('[updater] update not available', info?.version || info)
  })

  autoUpdater.on('error', (error) => {
    console.log('[updater] error', error?.message || error)
  })

  autoUpdater.on('download-progress', (progress) => {
    console.log('[updater] download progress', {
      percent: progress?.percent,
      transferred: progress?.transferred,
      total: progress?.total,
      bytesPerSecond: progress?.bytesPerSecond,
    })
  })

  autoUpdater.on('update-downloaded', (info) => {
    console.log('[updater] update downloaded', info?.version || info)

    dialog
      .showMessageBox({
        type: 'info',
        title: 'Update ready',
        message: 'A new version of bro.inhale has been downloaded.',
        detail: 'Restart the app to install the update.',
        buttons: ['Later', 'Restart'],
        defaultId: 1,
        cancelId: 0,
      })
      .then(({ response }) => {
        if (response === 1) {
          autoUpdater.quitAndInstall()
        }
      })
      .catch((error) => {
        console.error('[autoUpdater] update dialog error:', error)
      })
  })

  autoUpdater.checkForUpdatesAndNotify().catch((error) => {
    console.log('[updater] check failed', error?.message || error)
  })
}

app.whenReady().then(() => {
  createWindow()
  initAutoUpdater()

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
