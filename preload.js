const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    onRequestSave: (callback) => ipcRenderer.on('request-save', callback),
    onFileOpened: (callback) => ipcRenderer.on('file-opened', callback),
    onFormat: (callback) => ipcRenderer.on('format', callback),
    saveFile: (content, filePath) => ipcRenderer.invoke('save-file', content, filePath),
    fileDropped: (filePath) => ipcRenderer.send('file-dropped', filePath),
    removeListeners: () => {
        ipcRenderer.removeAllListeners('request-save');
        ipcRenderer.removeAllListeners('file-opened');
        ipcRenderer.removeAllListeners('format');
    }
});
