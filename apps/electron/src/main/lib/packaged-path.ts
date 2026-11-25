/** Node 模块可在 ASAR 中解析；子进程二进制必须使用真实解包路径。两种分隔符都处理。 */
export function unpackedResourcePath(path: string): string {
  return path.replace(/app\.asar(?=[\\/])/, 'app.asar.unpacked')
}
