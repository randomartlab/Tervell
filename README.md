# Tervell

**完整的 AI 工作台，从电脑延伸到手机。**

围绕项目组织模型、Agent、资料与产物，让复杂工作更容易推进。由 Random 发起与维护。

[产品站](https://tervell.randomai.art) · [下载 Alpha](https://github.com/randomartlab/Tervell/releases) · [快速上手](https://tervell.randomai.art/guide/) · [反馈问题](https://github.com/randomartlab/Tervell/issues)

![Tervell 桌面工作台](https://tervell.randomai.art/media/workspace-1280.webp)

## 当前 Alpha

桌面 **0.19.119**，Android **0.1.22**。Windows x64、macOS 14+ Apple Silicon、Android 8+。Windows 未签名，Mac 为本地签名、未公证；请先核对下载来源与校验值。Android 需要连接在线桌面端。

- 项目、会话、文件、Skills、MCP 与扩展在同一工作台组织。
- 内置 Pi，接入支持的 ACP 内核；界面管理模型、推理、权限与专属选项。
- Android 扫码配对，切换工作区、浏览结果并接续任务。
- 过程展示、分叉、批注、历史导入及 Markdown／JSON 导出。
- 完善内核安装、终端调用、续聊与取消，优化长历史恢复及缓存保留。

当前真实 CLI 流程验收覆盖 Mac 22 项、Windows 21 项，使用隔离回环模型检查工具、文件、第二轮、取消及关闭；不代表所有目录条目、厂商账号或第三方插件已经完全兼容。

专家与专家团、新工作模式、可控进化、更丰富的成果处理、观测与资源治理正在其他分支继续开发，尚不属于本版承诺。进度见产品站「更新与路线」。

## 开始使用

安装桌面版，在「Agent 内核」检测已有工具，或一键安装所需 CLI 和适配器；在全局模型路由配置渠道或支持的官方账号。新建项目与会话后开始任务。也可先使用内置 Pi。

手机安装 Android APK，在电脑开启手机连接，生成二维码，手机扫码并核对信任。不要公开配对码或密钥。内网与公网的配置条件不同，见快速上手。

## 源码与构建

本仓库 `v0.19.119` 标签对应桌面发行基线；安卓源码仍为 0.1.22。使用 Bun 1.4.4 和随仓库锁文件：

```sh
bun install --frozen-lockfile
bun run gen:check
bun run typecheck
bun test --isolate
bun run --cwd apps/electron dist:alpha:mac --dmg
# Windows 请在原生 Windows 环境运行
bun run --cwd apps/electron dist:alpha:win
```

目标平台的运行时准备、原生模块与产物检查在 `apps/electron/scripts/`；Windows 原生流水线见 `.github/workflows/alpha-windows.yml`。Android 使用 JDK 17、Android SDK 35、Gradle 8.9，执行 `apps/mobile` 的 Gradle release 任务；私有 Alpha 签名密钥不随源码分发，可使用自己的签名。

构建过程需要网络取得注明来源与摘要的运行时；签名、公证、账号和第三方模型额度不由源码提供。产品站在后续独立提交维护，不改变本标签发行包。

## 二次开发与许可

- [Proma](https://github.com/proma-ai/Proma)：桌面工作台基础，保留 **AGPL-3.0** 与上游署名。原始介绍保存在 `README.upstream.md`。
- [Paseo](https://github.com/getpaseo/paseo)：部分原始插件 SDK、客户端与运行组件；所用版本 **Apache-2.0**，来源见第三方清单。
- [Magpie](https://github.com/yetone/magpie)：模型网关基础，**MIT**，随包补丁与构建材料已记录。

Tervell 的改造包括多内核与模型接入、移动控制、交互整合、品牌、安装和可靠性改进。Conversation Exporter、Paseo Direct、Better Paseo、Codex Style Annotations、Vivid Activity 等内置扩展的原始来源、许可与版本保存在 `apps/electron/resources/third-party/`。

软件保留 Proma 的 AGPL-3.0；第三方组件遵循各自许可。名称与商标属于各自权利人；Tervell 不代表上游或供应商官方。

## Random

我希望有一个自己愿意每天打开的 AI 工作台：能认真做事，也能把资料、过程和成果安放好。Tervell 因此开始，并在实际使用中继续改进。

[Random 的 GitHub](https://github.com/randomartlab) · [Random创造集市](https://randomai.art)。集市是可选服务入口，软件可配置自己的模型与账号。
