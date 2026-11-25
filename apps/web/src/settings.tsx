import { Check } from 'lucide-react'
import { defaultAppearance } from './appearance.ts'
import type { Appearance } from './appearance.ts'
interface SettingsProps {
  appearance: Appearance
  change: (value: Appearance) => void
  connectionLabel: string
  openConnection: () => void
  disconnect: () => void
  saveError: string
}
export function SettingsPage({ appearance, change, connectionLabel, openConnection, disconnect, saveError }: SettingsProps) {
  const update = (patch: Partial<Appearance>) => change({ ...appearance, ...patch })
  return <main id="main-content" tabIndex={-1} className="page-content settings-page">
    <div className="eyebrow">工作台偏好</div>
    <h1>外观与连接</h1>
    <p className="muted">让工作台适合你的阅读与工作习惯。</p>
    <section className="settings-section">
      <h2>主题</h2>
      <div className="button-row">{(['system', 'light', 'dark'] as const).map(theme => <button
        aria-pressed={appearance.theme === theme}
        className={appearance.theme === theme ? 'selected' : ''}
        key={theme}
        onClick={() => update({ theme })}>{appearance.theme === theme && <Check size={14} aria-hidden="true" />}{{ system: '跟随系统', light: '浅色', dark: '深色' }[theme]}
      </button>)}</div>
    </section>
    <section className="settings-section">
      <h2>阅读与密度</h2>
      <p className="muted">紧凑模式只减少间距，保留正文字号。</p>
      <div className="button-row">{(['comfortable', 'compact'] as const).map(density => <button
        key={density}
        aria-pressed={appearance.density === density}
        className={appearance.density === density ? 'selected' : ''}
        onClick={() => update({ density })}>{density === 'compact' ? '紧凑' : '舒适'}</button>)}</div>
      <div className="setting-grid">
        <label>界面缩放
          <select value={appearance.uiScale} onChange={event => update({ uiScale: Number(event.target.value) })}>{[90, 100, 125, 150].map(value => <option key={value} value={value}>{value}%
          </option>)}</select>
        </label>
        <label>会话正文
          <select value={appearance.bodySize} onChange={event => update({ bodySize: Number(event.target.value) })}>{[16, 18, 20, 22].map(value => <option key={value} value={value}>{value} px
          </option>)}</select>
        </label>
        <label>代码字号
          <select value={appearance.codeSize} onChange={event => update({ codeSize: Number(event.target.value) })}>{[13, 14, 16, 18, 20].map(value => <option key={value} value={value}>{value} px
          </option>)}</select>
        </label>
      </div>
    </section>
    <section className="settings-section">
      <h2>布局</h2>
      <p className="muted">宽屏并排显示，窄屏通过顶部入口打开。专注模式可随时恢复。</p>
      <div className="setting-grid">
        <label>导航宽度
          <input
            type="range"
            min={220}
            max={280}
            step={4}
            value={appearance.sidebarWidth}
            onChange={event => update({ sidebarWidth: Number(event.target.value) })} />
          <output>{appearance.sidebarWidth} px
          </output>
        </label>
        <label>工作区宽度
          <input
            type="range"
            min={320}
            max={420}
            step={4}
            value={appearance.panelWidth}
            onChange={event => update({ panelWidth: Number(event.target.value) })} />
          <output>{appearance.panelWidth} px
          </output>
        </label>
      </div>
      <button onClick={() => change({ ...defaultAppearance, theme: appearance.theme })}>恢复默认阅读与布局</button>
    </section>
    <section className="settings-section">
      <h2>电脑连接</h2>
      <p>{connectionLabel}</p>
      <p className="muted">连接凭据仅保留在本次页面内存中。断开连接会清空页面中的会话与草稿。</p>
      <div className="button-row">
        <button onClick={openConnection}>连接电脑</button>
        <button onClick={disconnect}>断开连接</button>
      </div>
    </section>
    {saveError && <p role="status">{saveError}</p>}
  </main>
}
