const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('ibtipoint', {
  previewMemoPdf: (html, name) => ipcRenderer.invoke('memo:preview-pdf', { html, name }),
});
