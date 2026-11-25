/** 有界等待不能让不合作适配器拖住HTTP关闭；迟到结果只能由调用者清理，不能恢复已取消run。 */
export async function bounded<T>(operation:Promise<T>,signal:AbortSignal,timeoutMs=5000):Promise<T>{
 let timer:ReturnType<typeof setTimeout>|undefined,abort:(()=>void)|undefined
 try{return await Promise.race([operation,new Promise<never>((_resolve,reject)=>{abort=()=>reject(new Error('运行已取消'));signal.addEventListener('abort',abort,{once:true});if(signal.aborted)abort();timer=setTimeout(()=>reject(new Error('适配器操作超时')),timeoutMs)})])}
 finally{clearTimeout(timer);if(abort)signal.removeEventListener('abort',abort)}
}
