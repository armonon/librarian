const { app, BrowserWindow, shell } = require('electron');
const path = require('path');
const { pathToFileURL } = require('url');
const { externalURL } = require('./navigation.cjs');

function createWindow() {
  const win = new BrowserWindow({
    width: 1180,
    height: 860,
    minWidth: 380,
    minHeight: 520,
    backgroundColor: '#14110d',
    titleBarStyle: 'hiddenInset',
    webPreferences: { contextIsolation: true, nodeIntegration: false, sandbox: true },
  });
  win.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  // Open external links (target=_blank / window.open) in the system browser.
  const openExternal = (value) => {
    const url = externalURL(value);
    if (url) void shell.openExternal(url).catch(() => {});
  };
  win.webContents.setWindowOpenHandler(({ url }) => { openExternal(url); return { action: 'deny' }; });
  const documentURL = pathToFileURL(path.join(__dirname, '..', 'dist', 'index.html')).href;
  win.webContents.on('will-navigate', (event, url) => {
    if (url.split('#')[0] !== documentURL) { event.preventDefault(); openExternal(url); }
  });
  win.webContents.on('will-attach-webview', (event) => event.preventDefault());
}

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
