export function createPaseoApi(driver:Record<string,unknown>,scope?:{signal?:AbortSignal}):Record<string,unknown> & {dispose:()=>Promise<void>}
