const { app, BrowserWindow, Menu, ipcMain, shell } = require('electron');
const path = require('path');
const os = require('os');
const fs = require('fs');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    title: 'ibtipoint - Smart Business Management & POS',
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.cjs'),
    },
    icon: path.join(__dirname, '../dist/icon-512.png')
  });

  // Remove default menu for a clean POS look
  Menu.setApplicationMenu(null);

  // Load the built Vite web app
  const indexPath = path.join(__dirname, '../dist/index.html');
  mainWindow.loadFile(indexPath).catch(err => {
    console.error('Failed to load file:', err);
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Render the memo HTML to a PDF (page size comes from the memo's @page rule) and open it
// in the system PDF viewer, which provides print preview and printer selection.
ipcMain.handle('memo:preview-pdf', async (_event, { html, name }) => {
  const worker = new BrowserWindow({ show: false, webPreferences: { sandbox: true } });
  try {
    await worker.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(html));
    const pdf = await worker.webContents.printToPDF({ preferCSSPageSize: true, printBackground: true });
    const safe = String(name || 'memo').replace(/[^\w.-]+/g, '_');
    const file = path.join(os.tmpdir(), `ibtipoint-${safe}-${Date.now()}.pdf`);
    fs.writeFileSync(file, pdf);
    const err = await shell.openPath(file);
    if (err) throw new Error(err);
  } finally {
    worker.destroy();
  }
});

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
