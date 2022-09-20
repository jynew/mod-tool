import os from 'os'
import path from 'path'
import fs from 'fs'
import fetch from 'node-fetch'
import { promisify } from 'util'
import { pipeline } from 'stream'
import AdmZip from 'adm-zip'
import tar from 'tar'

export function getUrl(): Record<string, string> {
  let url = ''
  let fileName = ''
  let fileType = ''

  switch (process.platform) {
    case 'win32':
      url = 'https://steamcdn-a.akamaihd.net/client/installer/steamcmd.zip'
      fileName = 'steamcmd.exe'
      fileType = 'zip'
      break
    case 'darwin':
      url = 'https://steamcdn-a.akamaihd.net/client/installer/steamcmd_osx.tar.gz'
      fileName = 'steamcmd.sh'
      fileType = 'gzip'
      break
    case 'linux':
      url = 'https://steamcdn-a.akamaihd.net/client/installer/steamcmd_linux.tar.gz'
      fileName = 'steamcmd.sh'
      fileType = 'gzip'
      break
    default:
      throw new Error(`Platform "${process.platform}" is not supported`)
  }

  return { url, fileName, fileType }
}

export async function downloadFile(outPath: string): Promise<void> {
  const { url, fileType } = getUrl()
  const tempFile = path.join(os.tmpdir(), `mod-tool-${Date.now()}`)
  const writer = fs.createWriteStream(tempFile)

  const streamPipeline = promisify(pipeline)

  const response = await fetch(url)

  if (!response.ok) {
    throw new Error(`Unexpected response ${response.statusText}`)
  }

  await streamPipeline(response.body!, writer)

  if (fileType === 'gzip') {
    tar.extract({
      cwd: outPath,
      strict: true,
      file: tempFile
    })
  } else if (fileType === 'zip') {
    const zip = new AdmZip(tempFile)
    zip.extractAllTo(outPath)
  }
}
