import type {DesktopThemePalette,DesktopThemePreset} from '../types/desktop-theme'
export function hexRgb(value:string):number[]{const s=value.replace('#','');const hex=s.length===3?s.split('').map(c=>c+c).join(''):s;return [0,2,4].map(i=>parseInt(hex.slice(i,i+2),16))}
export function rgbHex(values:number[]):string{return '#'+values.map(v=>Math.round(Math.min(255,Math.max(0,v))).toString(16).padStart(2,'0')).join('')}
export function mixColor(a:string,b:string,t:number):string{const x=hexRgb(a),y=hexRgb(b);return rgbHex(x.map((v,i)=>v+(y[i]!-v)*t))}
export function contrastRatio(a:string,b:string):number{const lum=(s:string)=>hexRgb(s).map(v=>{const c=v/255;return c<=0.04045?c/12.92:((c+0.055)/1.055)**2.4}).reduce((a,v,i)=>a+v*[0.2126,0.7152,0.0722][i]!,0);const x=lum(a),y=lum(b);return (Math.max(x,y)+0.05)/(Math.min(x,y)+0.05)}
export function readableColor(color:string,background:string,min=4.5):string{if(contrastRatio(color,background)>=min)return color;const target=contrastRatio('#ffffff',background)>contrastRatio('#000000',background)?'#ffffff':'#000000';for(let i=1;i<=20;i++){const next=mixColor(color,target,i/20);if(contrastRatio(next,background)>=min)return next}return target}
export function hslToken(hex:string):string{const [r,g,b]=hexRgb(hex).map(v=>v/255) as [number,number,number];const max=Math.max(r,g,b),min=Math.min(r,g,b),d=max-min,l=(max+min)/2;let h=0;if(d)h=max===r?((g-b)/d)%6:max===g?(b-r)/d+2:(r-g)/d+4;return `${((h*60+360)%360).toFixed(2)} ${(d?d/(1-Math.abs(2*l-1))*100:0).toFixed(2)}% ${(l*100).toFixed(2)}%`}
/** 全部界面token由一份色板派生；输入/侧栏/弹窗与终端不再残留旧主题背景。 */
export function themeTokens(theme:DesktopThemePreset):Record<string,string>{
 const c=theme.colors,bg=c.background,fg=readableColor(c.foreground,bg),raised=c.raised,control=c.control,sidebar=c.sidebar??bg
 const muted=[bg,raised,control,sidebar].reduce((color,surface)=>readableColor(color,surface),c.mutedForeground),accent=c.accent,primaryText=readableColor(fg,accent),surfaceText=readableColor(fg,raised)
 const tokens:Record<string,string>={
 '--background':bg,'--foreground':fg,'--content-area':bg,'--card':raised,'--card-foreground':surfaceText,'--dialog':raised,'--dialog-foreground':surfaceText,'--popover':raised,'--popover-foreground':surfaceText,
 '--primary':accent,'--primary-foreground':primaryText,'--ring':readableColor(c.ring,bg,3),'--border':c.border,'--input':c.border,'--muted':control,'--muted-foreground':muted,'--secondary':control,'--secondary-foreground':readableColor(fg,control),'--accent':control,'--accent-foreground':readableColor(fg,control),
 '--sidebar-surface':sidebar,'--sidebar-primary-foreground':readableColor(fg,sidebar),'--tabbar-surface':sidebar,'--tab-surface':raised,'--tab-indicator':accent,'--input-surface':raised,'--sidebar-control-surface':control,'--sidebar-control-surface-hover':mixColor(control,fg,.08),'--sidebar-control-stroke':c.border,
 '--tooltip':fg,'--tooltip-foreground':bg,'--tooltip-muted':mixColor(bg,fg,.25),'--code-bg':c.codeBackground??control,'--dashed-border':c.border,'--dashed-border-hover':c.ring,
 '--destructive':c.danger??(theme.appearance==='dark'?'#fb7185':'#be123c'),'--destructive-foreground':readableColor(fg,c.danger??(theme.appearance==='dark'?'#fb7185':'#be123c')),
 }
 const out=Object.fromEntries(Object.entries(tokens).map(([k,v])=>[k,hslToken(v)]))
 const success=c.success??(theme.appearance==='dark'?'#86efac':'#15803d'),danger=c.danger??(theme.appearance==='dark'?'#fb7185':'#be123c')
 Object.assign(out,{'--tervell-terminal-background':bg,'--tervell-terminal-foreground':fg,'--tervell-terminal-selection':c.selection??mixColor(bg,accent,.28),'--tervell-diff-added':success,'--tervell-diff-removed':danger,'--tervell-code-foreground':readableColor(fg,c.codeBackground??control),'--tervell-code-background':c.codeBackground??control,
 '--dsw-alias-bg-layer-1':bg,'--dsw-alias-bg-layer-2':raised,'--dsw-alias-bg-layer-3':control,'--dsw-alias-label-primary':fg,'--dsw-alias-label-secondary':muted,'--dsw-alias-brand-primary':accent,
 '--wb-bg':bg,'--wb-surface':raised,'--wb-foreground':fg,'--wb-muted':muted,'--wb-border':c.border,'--wb-primary':accent,'--wb-soft':mixColor(bg,accent,.12)})
 const typography=theme.typography
 if(typography?.uiFont)out['--tervell-ui-font']=typography.uiFont
 if(typography?.codeFont)out['--tervell-code-font']=typography.codeFont
 if(typography?.uiFontSize)out['--tervell-ui-font-size']=typography.uiFontSize+'px'
 if(typography?.codeFontSize)out['--tervell-code-font-size']=typography.codeFontSize+'px'
 return out
}
export function completePalette(input:Partial<DesktopThemePalette>&Pick<DesktopThemePalette,'background'|'foreground'>):DesktopThemePalette{const bg=input.background,fg=input.foreground;return {...input,background:bg,foreground:fg,raised:input.raised??mixColor(bg,fg,.035),control:input.control??mixColor(bg,fg,.08),border:input.border??mixColor(bg,fg,.17),accent:input.accent??fg,mutedForeground:input.mutedForeground??mixColor(bg,fg,.65),ring:input.ring??input.accent??fg}}
