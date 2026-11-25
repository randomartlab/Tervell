if(process.argv.includes('oversized')){process.stdout.write('x'.repeat(2*1024*1024+1));await new Promise(()=>{})}
import {Server} from '@modelcontextprotocol/sdk/server/index.js'
import {StdioServerTransport} from '@modelcontextprotocol/sdk/server/stdio.js'
import {ListToolsRequestSchema,CallToolRequestSchema} from '@modelcontextprotocol/sdk/types.js'
const server=new Server({name:'w7-fixture',version:'1.0.0'},{capabilities:{tools:{}}})
server.setRequestHandler(ListToolsRequestSchema,async()=>({tools:[{name:'echo',description:'测试回显',inputSchema:{type:'object'}}]}))
server.setRequestHandler(CallToolRequestSchema,async(request)=>({content:[{type:'text',text:JSON.stringify(request.params.arguments)}]}))
await server.connect(new StdioServerTransport())
