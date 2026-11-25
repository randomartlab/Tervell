magpie.ready.then(() => {
 document.querySelector('#status').textContent = '桥接就绪 · ' + (magpie.theme.dark ? '深色主题' : '浅色主题')
 magpie.onTheme(theme => { document.querySelector('#status').textContent = '桥接就绪 · ' + (theme.dark ? '深色主题' : '浅色主题') })
 document.querySelector('#read').onclick = async () => {
  try { const result = await magpie.read('providers:list'); document.querySelector('#result').textContent = JSON.stringify(result) }
  catch (error) { document.querySelector('#result').textContent = String(error) }
 }
})
