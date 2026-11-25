export interface DesktopThemePalette {
 background:string;foreground:string;raised:string;control:string;border:string;accent:string;mutedForeground:string;ring:string
 sidebar?:string;success?:string;danger?:string;warning?:string;codeBackground?:string;selection?:string
}
export interface DesktopThemePreset {
 id:string;name:string;appearance:'light'|'dark';colors:DesktopThemePalette
 typography?:{uiFont?:string;codeFont?:string;uiFontSize?:number;codeFontSize?:number}
 format:'paseo'|'codex'|'dsh'|'tervell'|'vscode';warnings:string[];codeThemeId?:string
 background?:{image?:string;gradient?:string;position?:string;fit?:'cover'|'contain';opacity?:number;surfaceOpacity?:number;blur?:number;brightness?:number}
}
export interface DesktopThemeSelection {id:string|null}
export interface DesktopMarketEntry {
 id:string;name:string;description:string;version:string;author:string;license?:string;categories:string[];repository:string
 marketId?:string;marketName?:string;engines?:string
 artifact:{kind:'npm';package:string;version:string;resolved:string;integrity:string}|{kind:'git';remote:string;commit:string;pluginPath?:string}|{kind:'npm-version';package:string;version:string;registry:string}
}
export interface DesktopMarketSource {id:string;name:string;url:string;format:'paseo'|'dsh';builtin?:boolean}
export interface DesktopMarketState {entries:DesktopMarketEntry[];fetchedAt:number;stale:boolean;error?:string;source:string;sources?:Array<DesktopMarketSource&{count?:number;error?:string}>}
