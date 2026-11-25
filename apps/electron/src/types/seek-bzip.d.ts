declare module 'seek-bzip' {
  interface Input {readByte:()=>number;read:(buffer:Buffer,offset:number,length:number)=>number;eof:()=>boolean}
  interface Output {writeByte:(value:number)=>void;flush:()=>void}
  const codec:{decode:(input:Buffer|Input,output?:number|Output,multistream?:boolean)=>Buffer};
  export default codec;
}
