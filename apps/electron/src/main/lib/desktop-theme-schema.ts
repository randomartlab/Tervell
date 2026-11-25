import {z} from 'zod'
import {validThemeImage,validThemeGradient} from '@proma/shared/utils'
export const ThemeHex=z.string().regex(/^#[0-9a-fA-F]{6}$/)
export const DesktopThemePresetSchema=z.strictObject({
 background:z.object({image:z.string().refine(validThemeImage).optional(),gradient:z.string().refine(validThemeGradient).optional(),position:z.string().max(60).regex(/^[\d.% a-z-]+$/i).optional(),fit:z.enum(['cover','contain']).optional(),opacity:z.number().min(0).max(1).optional(),surfaceOpacity:z.number().min(0.3).max(1).optional(),blur:z.number().min(0).max(40).optional(),brightness:z.number().min(0.3).max(2).optional()}).optional(),
 typography:z.object({uiFont:z.string().max(300).regex(/^[a-zA-Z0-9 _.,'"\-]+$/).optional(),codeFont:z.string().max(300).regex(/^[a-zA-Z0-9 _.,'"\-]+$/).optional(),uiFontSize:z.number().min(12).max(20).optional(),codeFontSize:z.number().min(10).max(20).optional()}).optional(),
 id:z.string().min(1).max(160),name:z.string().min(1).max(120),appearance:z.enum(['light','dark']),format:z.enum(['paseo','codex','dsh','tervell','vscode']),warnings:z.array(z.string().max(500)).max(50),codeThemeId:z.string().max(100).optional(),
 colors:z.strictObject({background:ThemeHex,foreground:ThemeHex,raised:ThemeHex,control:ThemeHex,border:ThemeHex,accent:ThemeHex,mutedForeground:ThemeHex,ring:ThemeHex,sidebar:ThemeHex.optional(),success:ThemeHex.optional(),danger:ThemeHex.optional(),warning:ThemeHex.optional(),codeBackground:ThemeHex.optional(),selection:ThemeHex.optional()}),
})
