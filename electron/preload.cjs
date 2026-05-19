const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('broInhaleTray', {
  onPause(callback) {
    const handler = () => callback()
    ipcRenderer.on('tray:pause', handler)
    return () => ipcRenderer.removeListener('tray:pause', handler)
  },
  onRestart(callback) {
    const handler = () => callback()
    ipcRenderer.on('tray:restart', handler)
    return () => ipcRenderer.removeListener('tray:restart', handler)
  },
  updateStatus(statusText) {
    ipcRenderer.send('tray:update-status', statusText)
  },
  updateSessionState(state) {
    ipcRenderer.send('tray:update-session-state', state)
  },
})
