const { app, BrowserWindow, dialog, Tray, Menu, nativeImage, ipcMain } = require('electron')
const { autoUpdater } = require('electron-updater')
const path = require('path')

let mainWindow = null
let tray = null
let sessionState = 'idle'

function getTrayIconPath() {
  if (app.isPackaged) {
    return path.join(app.getAppPath(), 'build/tray-icon.png')
  }
  return path.join(__dirname, '../build/tray-icon.png')
}

function refreshTrayMenu() {
  if (tray) {
    tray.setContextMenu(buildTrayMenu())
  }
}

function buildTrayMenu() {
  const pauseLabel = sessionState === 'paused' ? 'Продолжить' : 'Пауза'

  return Menu.buildFromTemplate([
    {
      label: 'Показать окно',
      click: () => {
        if (!mainWindow) return
        mainWindow.show()
        mainWindow.focus()
        mainWindow.setAlwaysOnTop(true, 'floating')
      },
    },
    {
      label: 'Скрыть окно',
      click: () => {
        if (!mainWindow) return
        mainWindow.hide()
      },
    },
    {
      label: 'Начать заново',
      click: () => {
        if (!mainWindow?.webContents) return
        mainWindow.webContents.send('tray:restart')
      },
    },
    {
      label: pauseLabel,
      click: () => {
        if (!mainWindow?.webContents) return
        mainWindow.webContents.send('tray:pause')
      },
    },
    { type: 'separator' },
    {
      label: 'Выйти',
      click: () => app.quit(),
    },
  ])
}

function createTray() {
  if (tray) {
    refreshTrayMenu()
    return
  }

  const trayImage = nativeImage.createFromPath(getTrayIconPath()).resize({
    width: 18,
    height: 18,
  })
  trayImage.setTemplateImage(true)
  tray = new Tray(trayImage)
  tray.setToolTip('bro.inhale')
  tray.setTitle('bro.inhale')
  tray.setContextMenu(buildTrayMenu())
}

ipcMain.on('tray:update-status', (_event, statusText) => {
  if (tray) {
    tray.setTitle(statusText || '')
  }
})

ipcMain.on('tray:update-session-state', (_event, state) => {
  sessionState = state || 'idle'
  refreshTrayMenu()
})

function createWindow() {
  mainWindow = new BrowserWindow({
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
    alwaysOnTop: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.cjs'),
      backgroundThrottling: false,
    },
  })

  mainWindow.setAlwaysOnTop(true, 'floating')

  mainWindow.on('closed', () => {
    mainWindow = null
  })

  mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))

  createTray()
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
    } else if (mainWindow) {
      mainWindow.show()
      mainWindow.focus()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
