import os from 'os'
import path from 'path'
import fs from 'fs'

export const ROOT_CACHE_PATH = path.join(os.homedir(), '.mod-tool')

fs.mkdirSync(ROOT_CACHE_PATH, { recursive: true })
