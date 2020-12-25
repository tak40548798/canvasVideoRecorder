const {app, BrowserWindow, ipcMain} = require('electron')
var paintWindow = null, win = null;

// on win action
function winIpc() {
  ipcMain.on('paintWindowControl', (event, args) => {
    if (args === '1') {
      paintWindow.show();
    } else {
      paintWindow.hide();
    }
  })
  ipcMain.on('videoConfig', (event, videoConfig) => {
    paintWindow.webContents.send("videoConfig", videoConfig)
  })
}

// on paintwindow action
function paintWindowIpc() {
  ipcMain.on('clear', (event, arg) => {
    win.webContents.send("clear")
  })
  ipcMain.on('undo', (event, arg) => {
    win.webContents.send("undo")
  })
  ipcMain.on('redo', (event, arg) => {
    win.webContents.send("redo")
  })
  ipcMain.on('color', (event, colorhex) => {
    win.webContents.send("color", colorhex)
  })
  ipcMain.on('linesize', (event, linesize) => {
    win.webContents.send("linesize", linesize)
  })
  ipcMain.on('eraser', (event, eraser) => {
    win.webContents.send("eraser", eraser)
  })
  ipcMain.on('applyConstraints', (event, opts) => {
    console.log(opts)
    win.webContents.send("applyConstraints", opts)
  });
}

function createWindow() {

  win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true
    }
  })
  paintWindow = new BrowserWindow({
    width: 400,
    maxWidth: 400,
    height: 300,
    maxHeight: 300,
    webPreferences: {
      nodeIntegration: true
    },
    frame: true,
    show: false,
    fullscreenable: false,
    maximizable: false,
    resizable: false,
    hasShadow: false,
    thickFrame: false
  })

  paintWindow.loadFile('paintwindow.html')
  paintWindow.webContents.on("did-finish-load", () => {
    paintWindowIpc();
  });

  win.loadFile('index.html')
  win.webContents.on("did-finish-load", () => {
    winIpc();
  });

  paintWindow.webContents.openDevTools({mode: "detach"})
  win.webContents.openDevTools()
}

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})