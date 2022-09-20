import { app, shell, BrowserWindow, ipcMain, dialog } from 'electron'
import path from 'path'
import fs from 'fs'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import spawn from 'cross-spawn'

import { ROOT_CACHE_PATH } from './path'
import { getUrl, downloadFile } from './download-cmd'

function createWindow(): void {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 960,
    height: 720,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux'
      ? {
          icon: path.join(__dirname, '../../build/icon.png')
        }
      : {}),
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js')
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'))
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

ipcMain.handle('open-directory', () => {
  return dialog.showOpenDialogSync({
    properties: ['openDirectory']
  })
})

ipcMain.handle('open-file', () => {
  return dialog.showOpenDialogSync({
    filters: [{ name: 'Images', extensions: ['jpg', 'png'] }],
    properties: ['openFile']
  })
})

fs.mkdirSync(ROOT_CACHE_PATH, { recursive: true })
const STORE_PATH = path.join(ROOT_CACHE_PATH, 'store.json')

ipcMain.handle('get-store', () => {
  if (fs.existsSync(STORE_PATH)) {
    return fs.readFileSync(STORE_PATH, 'utf8')
  }
  return ''
})

ipcMain.handle('set-store', (_event, value: string) => {
  fs.writeFileSync(STORE_PATH, value, 'utf8')
})

let VDF_PATH = ''

ipcMain.handle('write-file', (_event, value: string) => {
  try {
    const data = JSON.parse(value)
    VDF_PATH = path.join(ROOT_CACHE_PATH, `${data.title}.vdf`)
    fs.writeFileSync(VDF_PATH, '"workshopitem"\n' + value.replace(/:|,/g, ''), 'utf8')
  } catch (error) {
    console.log(error)
  }
})

const { fileName } = getUrl()
const CMD_PATH = path.join(ROOT_CACHE_PATH, fileName)

ipcMain.handle('download-file', async () => {
  if (!fs.existsSync(CMD_PATH)) {
    await downloadFile(ROOT_CACHE_PATH)
    return `Downloading file...\n`
  }
  return `File exists, run now.\n`
})

ipcMain.handle('cmd', async (event, value: string) => {
  try {
    const data = JSON.parse(value)
    const cmd = spawn(CMD_PATH, [
      '+login',
      data.loginName,
      data.password,
      data.guard,
      '+workshop_build_item',
      VDF_PATH,
      '+quit'
    ])

    cmd.stdout.on('data', (data) => {
      event.sender.send('stdout', data.toString())
    })

    cmd.on('close', () => {
      event.sender.send('close')
    })
  } catch (error) {
    console.log(error)
  }
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app"s specific main process
// code. You can also put them in separate files and require them here.
