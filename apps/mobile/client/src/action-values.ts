import type {Action} from './model';
interface Values {[key:string]:unknown}
/** 目录使用点号描述嵌套表单，提交时恢复对象；拒绝原型键和冲突路径。 */
export function prepareActionValues(action:Pick<Action,'fields'>,values:Values):Values {
 const result:Values={};
 for(const field of action.fields){
  const raw=values[field.key];
  if(raw===undefined||raw===''&&!field.required)continue;
  if(field.required&&raw===undefined)throw Error('请填写'+field.label);
  const value=field.type==='json'&&typeof raw==='string'?JSON.parse(raw):field.type==='number'?Number(raw):raw;
  if(field.type==='number'&&!Number.isFinite(value))throw Error(field.label+'请填写有效数字');
  const segments=field.key.split('.');let target=result;
  for(const [index,key]of segments.entries()){
   if(!key||['__proto__','constructor','prototype'].includes(key))throw Error('配置字段路径无效');
   if(index===segments.length-1){target[key]=value;break;}
   const existing=target[key];
   if(existing!==undefined&&(typeof existing!=='object'||existing===null||Array.isArray(existing)))throw Error('配置字段路径冲突');
   target=(target[key]??={}) as Values;
  }
 }
 for(const field of action.fields)if(field.required&&values[field.key]===undefined)throw Error('请填写'+field.label);
 return result;
}
