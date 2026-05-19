const {
  app,
  BrowserWindow,
  dialog,
  Tray,
  Menu,
  nativeImage,
  ipcMain,
  autoUpdater: electronAutoUpdater,
} = require('electron')
const { autoUpdater } = require('electron-updater')
const fs = require('fs')
const path = require('path')

let mainWindow = null
let tray = null
let sessionState = 'idle'
let updateDownloaded = false

function getUpdaterLogPath() {
  return path.join(app.getPath('userData'), 'updater.log')
}

function writeUpdaterLog(level, message) {
  const text = typeof message === 'string' ? message : JSON.stringify(message)
  const line = `[${new Date().toISOString()}] [${level}] ${text}\n`

  try {
    fs.appendFileSync(getUpdaterLogPath(), line)
  } catch (_error) {
    // ignore log write errors
  }

  console.log(`[updater] [${level}]`, text)
}

function setupUpdaterLogger() {
  autoUpdater.logger = {
    info: (message) => writeUpdaterLog('info', message),
    warn: (message) => writeUpdaterLog('warn', message),
    error: (message) => writeUpdaterLog('error', message),
    debug: (message) => writeUpdaterLog('debug', message),
  }
}

function installDownloadedUpdate() {
  writeUpdaterLog('info', 'installDownloadedUpdate called')

  if (process.platform === 'darwin') {
    if (tray) {
      tray.destroy()
      tray = null
    }

    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.removeAllListeners('close')
      mainWindow.close()
    }

    if (electronAutoUpdater?.once) {
      electronAutoUpdater.once('before-quit-for-update', () => {
        writeUpdaterLog('info', 'before-quit-for-update — app.exit(0)')
        app.exit(0)
      })
    }
  }

  autoUpdater.quitAndInstall(false, true)
}

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

  setupUpdaterLogger()
  autoUpdater.autoInstallOnAppQuit = true
  writeUpdaterLog('info', `initAutoUpdater app version ${app.getVersion()}`)

  autoUpdater.on('checking-for-update', () => {
    writeUpdaterLog('info', 'checking for update')
  })

  autoUpdater.on('update-available', (info) => {
    writeUpdaterLog('info', `update available ${info?.version || ''}`)
  })

  autoUpdater.on('update-not-available', (info) => {
    writeUpdaterLog('info', `update not available ${info?.version || ''}`)
  })

  autoUpdater.on('error', (error) => {
    writeUpdaterLog('error', error?.message || error)
  })

  autoUpdater.on('download-progress', (progress) => {
    writeUpdaterLog(
      'info',
      `download ${progress?.percent?.toFixed?.(1) ?? progress?.percent}%`,
    )
  })

  autoUpdater.on('update-downloaded', (info) => {
    if (updateDownloaded) {
      return
    }

    updateDownloaded = true
    writeUpdaterLog('info', `update downloaded ${info?.version || ''}`)

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
          installDownloadedUpdate()
        }
      })
      .catch((error) => {
        writeUpdaterLog('error', `update dialog error: ${error?.message || error}`)
      })
  })

  autoUpdater.checkForUpdatesAndNotify().catch((error) => {
    writeUpdaterLog('error', `check failed: ${error?.message || error}`)
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
