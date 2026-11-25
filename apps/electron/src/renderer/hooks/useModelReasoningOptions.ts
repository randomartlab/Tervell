import * as React from 'react'

export function useModelReasoningOptions(channelId:string|undefined,model:string|undefined):{options:string[];loading:boolean;error:string;refresh:()=>void}{
 const key=`${channelId??''}:${model??''}`
 const [state,setState]=React.useState({key:'',options:[] as string[],loading:false,error:''}),[revision,setRevision]=React.useState(0)
 React.useEffect(()=>{
  let active=true
  if(!channelId||!model){setState({key,options:[],loading:false,error:''});return}
  setState({key,options:[],loading:true,error:''})
  void window.electronAPI.modelReasoningOptions(channelId,model).then(value=>{if(active)setState({key,options:value.efforts,loading:false,error:''});if(channelId==='tervell-routing')void window.electronAPI.refreshRoutingModels().catch(()=>{})},error=>{if(active)setState({key,options:[],loading:false,error:error instanceof Error?error.message:String(error)})})
  return()=>{active=false}
 },[key,channelId,model,revision])
 return {options:state.key===key?state.options:[],loading:state.key===key?state.loading:!!model,error:state.key===key?state.error:'',refresh:()=>setRevision(value=>value+1)}
}
