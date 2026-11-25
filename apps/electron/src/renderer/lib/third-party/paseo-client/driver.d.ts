export function createLocalPaseoDriver(call:(method:string,input?:unknown)=>Promise<unknown>,options?:{serverId?:string;interval?:number}):Record<string,unknown> & {close:()=>Promise<void>}
