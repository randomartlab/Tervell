export interface ProjectFileDraft {file:string;content:string;original:string;expected:string}
export interface ProjectDraftStorage {getItem:(key:string)=>string|null;setItem:(key:string,value:string)=>void;removeItem:(key:string)=>void}
const key=(host:string,workspace:string)=>'tervell-project-drafts:'+host+':'+workspace;
export function readProjectDrafts(storage:ProjectDraftStorage,host:string,workspace:string):ProjectFileDraft[] {
 const value:unknown=JSON.parse(storage.getItem(key(host,workspace))??'[]');
 if(!Array.isArray(value))throw Error('文件草稿格式损坏，请先导出本机草稿');
 return value.filter((row):row is ProjectFileDraft=>!!row&&typeof row==='object'&&['file','content','original','expected'].every(k=>typeof Reflect.get(row,k)==='string'));
}
export function writeProjectDraft(storage:ProjectDraftStorage,host:string,workspace:string,draft:ProjectFileDraft):ProjectFileDraft[] {
 const rows=readProjectDrafts(storage,host,workspace).filter(row=>row.file!==draft.file);
 if(draft.content!==draft.original||draft.expected==='new')rows.unshift(draft);
 if(rows.length)storage.setItem(key(host,workspace),JSON.stringify(rows));else storage.removeItem(key(host,workspace));
 return rows;
}
export function removeProjectDraft(storage:ProjectDraftStorage,host:string,workspace:string,file:string):ProjectFileDraft[] {
 const rows=readProjectDrafts(storage,host,workspace).filter(row=>row.file!==file);
 if(rows.length)storage.setItem(key(host,workspace),JSON.stringify(rows));else storage.removeItem(key(host,workspace));return rows;
}
