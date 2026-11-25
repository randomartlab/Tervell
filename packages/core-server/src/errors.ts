export class ServiceError extends Error {
 constructor(readonly status:number,readonly code:string,message:string,readonly data?:unknown){super(message)}
}
export function fail(status:number,code:string,message:string,data?:unknown):never{throw new ServiceError(status,code,message,data)}
