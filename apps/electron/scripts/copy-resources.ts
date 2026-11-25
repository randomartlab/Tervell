import { cpSync, existsSync, mkdirSync, rmSync } from 'node:fs'
import { resolve } from 'node:path'

const source = resolve(import.meta.dir, '../resources'), destination = resolve(import.meta.dir, '../dist/resources')
if (!existsSync(source)) throw new Error('缺少应用资源目录。')
mkdirSync(resolve(destination, '..'), { recursive: true })
rmSync(destination, { force: true, recursive: true })
cpSync(source, destination, { recursive: true, errorOnExist: true })
console.log('应用资源复制完成。')
