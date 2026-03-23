const { app, BrowserWindow, ipcMain, Menu, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js')
        }
    });

    mainWindow.loadFile('index.html');

    const template = [
        {
            label: 'Archivo',
            submenu: [
                {
                    label: 'Abrir...',
                    accelerator: 'CmdOrCtrl+O',
                    click: async () => {
                        const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
                            properties: ['openFile'],
                            filters: [{ name: 'Markdown', extensions: ['md', 'markdown'] }]
                        });
                        if (!canceled && filePaths.length > 0) {
                            openFile(filePaths[0]);
                        }
                    }
                },
                {
                    label: 'Guardar',
                    accelerator: 'CmdOrCtrl+S',
                    click: () => {
                        mainWindow.webContents.send('request-save');
                    }
                },
                { type: 'separator' },
                { role: 'quit', label: 'Salir' }
            ]
        },
        {
            label: 'Formato',
            submenu: [
                { label: 'Negrita', click: () => mainWindow.webContents.send('format', 'bold') },
                { label: 'Cursiva', click: () => mainWindow.webContents.send('format', 'italic') }
            ]
        },
        { role: 'editMenu', label: 'Edición' },
        { role: 'windowMenu', label: 'Ventana' }
    ];

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
}

function openFile(filePath) {
    fs.readFile(filePath, 'utf-8', (err, content) => {
        if (err) {
            console.error('Error reading file:', err);
            return;
        }
        mainWindow.webContents.send('file-opened', content, filePath);
    });
}

// IPC handler to save file from renderer
ipcMain.handle('save-file', async (event, content, currentFilePath) => {
    let filePath = currentFilePath;
    if (!filePath) {
        const { canceled, filePath: savePath } = await dialog.showSaveDialog(mainWindow, {
            filters: [{ name: 'Markdown', extensions: ['md', 'markdown'] }]
        });
        if (canceled) return { success: false };
        filePath = savePath;
    }

    try {
        fs.writeFileSync(filePath, content, 'utf-8');
        return { success: true, filePath };
    } catch (err) {
        console.error('Error saving file:', err);
        return { success: false, error: err.message };
    }
});

// Handle drop event from renderer
ipcMain.on('file-dropped', (event, filePath) => {
    openFile(filePath);
});

app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});
