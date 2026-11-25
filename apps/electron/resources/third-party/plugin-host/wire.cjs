exports.encode=value=>{
 const binary=[];const visit=(v,path)=>{if(v instanceof Uint8Array){binary.push({path,base64:Buffer.from(v.buffer,v.byteOffset,v.byteLength).toString('base64')});return null}if(Array.isArray(v))return v.map((x,i)=>visit(x,[...path,i]));if(v&&typeof v==='object')return Object.fromEntries(Object.entries(v).map(([k,x])=>[k,visit(x,[...path,k])]));return v};
 const data=visit(value,[]);return JSON.stringify({tervellPluginWire:1,data,binary});
};
exports.decode=line=>{
 const frame=JSON.parse(line);if(frame?.tervellPluginWire!==1)return frame;
 let value=frame.data;if(!Array.isArray(frame.binary)||frame.binary.length>256)throw Error('插件二进制帧无效');
 for(const part of frame.binary){if(!Array.isArray(part.path)||part.path.length>64||typeof part.base64!=='string'||part.base64.length>48*1024*1024)throw Error('插件二进制帧无效');const bytes=Uint8Array.from(Buffer.from(part.base64,'base64'));if(!part.path.length){value=bytes;continue}let target=value;for(const key of part.path.slice(0,-1)){if(['__proto__','constructor','prototype'].includes(String(key))||!Object.hasOwn(target,key))throw Error('插件二进制路径无效');target=target[key]}const key=part.path.at(-1);if(['__proto__','constructor','prototype'].includes(String(key))||!Object.hasOwn(target,key))throw Error('插件二进制路径无效');target[key]=bytes}
 return value;
};
