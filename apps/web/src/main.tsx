import { createRoot } from 'react-dom/client'
import { App } from './App.tsx'
import '@proma/ui/theme.css'
import './workbench.css'

const root = document.getElementById('root')
if (!root) throw new Error('缺少 Web 挂载点')
createRoot(root).render(<App/> )
