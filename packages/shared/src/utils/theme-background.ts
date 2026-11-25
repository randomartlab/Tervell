/** 壁纸是主题的一等资源，支持包内图片、内联图片和静态渐变。 */
export function validThemeImage(value:string):boolean{
 if(value.length>12*1024*1024)return false
 if(/^data:image\/(?:png|jpeg|webp|gif|avif);base64,[A-Za-z\d+/=\s]+$/.test(value))return true
 if(value.startsWith('data:image/svg+xml')){try{const source=value.includes(';base64,')?atob(value.split(',')[1]!):decodeURIComponent(value.slice(value.indexOf(',')+1));return source.length<=500000&&/^\s*<svg\b/.test(source)&&!/<(?:script|foreignObject|iframe)\b|\bon\w+\s*=|(?:href|src)\s*=\s*["'](?!#)|@import/i.test(source)}catch{return false}}
 try{const url=new URL(value);return url.protocol==='https:'&&!url.username&&!url.password}catch{return false}
}
export function validThemeGradient(value:string):boolean{return value.length<8192&&/^(?:repeating-)?(?:linear|radial|conic)-gradient\(/.test(value)&&!/[;{}<>]|url\(|expression|@import/i.test(value)}
