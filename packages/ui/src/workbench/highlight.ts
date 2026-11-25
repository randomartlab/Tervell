import { createHighlighterCore } from 'shiki/core'
import { createJavaScriptRegexEngine } from 'shiki/engine/javascript'
import light from 'shiki/themes/github-light.mjs'
import dark from 'shiki/themes/github-dark.mjs'
import typescript from 'shiki/langs/typescript.mjs'
import javascript from 'shiki/langs/javascript.mjs'
import json from 'shiki/langs/json.mjs'
import python from 'shiki/langs/python.mjs'
import shell from 'shiki/langs/shellscript.mjs'

/** Web 常用语法按需初始化；不将整套语言资源库塞入产物。 */
const highlighter = createHighlighterCore({ themes: [light, dark], langs: [typescript, javascript, json, python, shell], engine: createJavaScriptRegexEngine() })
const aliases: Record<string, string> = { ts: 'typescript', js: 'javascript', py: 'python', sh: 'shellscript', bash: 'shellscript', shell: 'shellscript' }
export async function highlightWorkbenchCode(code: string, language: string, theme: string): Promise<Array<Array<{ content: string; color?: string }>>> {
  const instance = await highlighter
  const candidate = aliases[language] ?? language
  const lang = instance.getLoadedLanguages().includes(candidate) ? candidate : 'text'
  return instance.codeToTokens(code, { lang, theme }).tokens.map(line => line.map(token => ({ content: token.content, color: token.color })))
}
