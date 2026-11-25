export const primitives:Record<string,unknown>
export const slotKit:Record<string,unknown>
export class Context {provide(name:string,value:unknown):unknown;on(name:string,handler:(key:string)=>void):()=>void;plugin(plugin:unknown,config?:object):{await:()=>Promise<void>;dispose:()=>Promise<void>;_error?:unknown;state:number};fiber:{dispose:()=>Promise<void>}}
export class SlotRegistry {constructor(context:unknown);register(definition:object,component:unknown):()=>void;entries(name:string):Array<{options:{id?:string;key?:string;label?:string|(()=>string)};select?:(props:Record<string,unknown>)=>unknown}>;install(renderer:unknown):void;installLocale(locale:object):void;installScope(name:string,scope:object):void;provideRoot(value:object):()=>void;renderSlot(name:string,owner:object):import('react').ReactNode;getVersion(name:string):number}
export function createSlotRenderer():unknown
