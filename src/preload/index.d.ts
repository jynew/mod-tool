import { ElectronAPI, IpcRenderer } from '@electron-toolkit/preload'

declare global {
  const ipcRenderer: IpcRenderer
  interface Window {
    electron: ElectronAPI
    api: unknown
    ipcRenderer: IpcRenderer
  }
}
