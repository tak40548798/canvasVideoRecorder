const {app, BrowserWindow} = require('electron')
var paintWindow = null;

function createWindow() {

  const win = new BrowserWindow({
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
    frame: false,
    show: false,
    fullscreenable: false,
    maximizable: false,
    resizable: false,
    hasShadow: false,
    thickFrame: false
  })

  win.loadFile('index.html')
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
