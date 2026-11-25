/** 2026-11-20 对照 Paseo ACP目录与 Orca CLI目录；仅目录覆盖，不宣称逐项实机认证。 */
export interface DesktopCatalogDefinition {
  id:string;name:string;description:string;command:string;args:string[];env:Record<string,string>
  transport:'acp'|'pty';sources:string[];homepage:string;packages?:string[]
  hostRequirement?:string
}
export const DESKTOP_REFERENCE_CATALOG:DesktopCatalogDefinition[] = [
  {
    "id": "agoragentic-acp",
    "name": "Agoragentic",
    "description": "Agent marketplace with 174+ AI capabilities. Browse, invoke, and pay for agent services settled in USDC on Base L2.",
    "command": "agoragentic-mcp",
    "args": [
      "--acp"
    ],
    "env": {},
    "transport": "pty",
    "hostRequirement": "此发行版只实现工具服务 tools/list、tools/call，没有 ACP session/new；请作为 MCP 工具接入，不作为对话内核。",
    "sources": [
      "Paseo"
    ],
    "homepage": "https://agoragentic.com",
    "packages": [
      "agoragentic-mcp@1.3.6"
    ]
  },
  {
    "id": "amp",
    "name": "Amp",
    "description": "ACP wrapper for Amp - the frontier coding agent",
    "command": "amp-acp",
    "args": [],
    "env": {},
    "transport": "acp",
    "sources": [
      "Paseo",
      "Orca"
    ],
    "homepage": "https://github.com/tao12345666333/amp-acp"
  },
  {
    "id": "auggie",
    "name": "Auggie CLI",
    "description": "Augment Code's powerful software agent, backed by industry-leading context engine",
    "command": "auggie",
    "args": [
      "--acp"
    ],
    "env": {
      "AUGMENT_DISABLE_AUTO_UPDATE": "1"
    },
    "transport": "acp",
    "sources": [
      "Paseo",
      "Orca"
    ],
    "homepage": "https://www.augmentcode.com/",
    "packages": [
      "@augmentcode/auggie@0.36.0"
    ]
  },
  {
    "id": "autohand",
    "name": "Autohand Code",
    "description": "Autohand Code - AI coding agent powered by Autohand AI",
    "command": "autohand-acp",
    "args": [],
    "env": {},
    "transport": "acp",
    "sources": [
      "Paseo",
      "Orca"
    ],
    "homepage": "https://www.autohand.ai/cli/",
    "packages": [
      "@autohandai/autohand-acp@0.2.1"
    ]
  },
  {
    "id": "cline",
    "name": "Cline",
    "description": "Autonomous coding agent CLI - capable of creating/editing files, running commands, using the browser, and more",
    "command": "cline",
    "args": [
      "--acp"
    ],
    "env": {},
    "transport": "acp",
    "sources": [
      "Paseo",
      "Orca"
    ],
    "homepage": "https://cline.bot/cli",
    "packages": [
      "cline@3.0.73"
    ]
  },
  {
    "id": "codebuddy",
    "name": "Codebuddy Code",
    "description": "Tencent Cloud's official intelligent coding tool",
    "command": "codebuddy",
    "args": [
      "--acp"
    ],
    "env": {},
    "transport": "acp",
    "sources": [
      "Paseo",
      "Orca"
    ],
    "homepage": "https://www.codebuddy.cn/cli/"
  },
  {
    "id": "codewhale",
    "name": "CodeWhale",
    "description": "Terminal coding agent for DeepSeek V4 and open models",
    "command": "codewhale",
    "args": [
      "serve",
      "--acp"
    ],
    "env": {},
    "transport": "acp",
    "sources": [
      "Paseo"
    ],
    "homepage": "https://codewhale.net/"
  },
  {
    "id": "cortex-code",
    "name": "Cortex Code",
    "description": "Snowflake's Cortex Code coding agent",
    "command": "cortex",
    "args": [
      "acp",
      "serve"
    ],
    "env": {},
    "transport": "acp",
    "sources": [
      "Paseo"
    ],
    "homepage": "https://docs.snowflake.com/en/user-guide/cortex-code/cortex-code-cli"
  },
  {
    "id": "corust-agent",
    "name": "Corust Agent",
    "description": "Co-building with a seasoned Rust partner.",
    "command": "corust-agent-acp",
    "args": [],
    "env": {},
    "transport": "acp",
    "sources": [
      "Paseo"
    ],
    "homepage": "https://github.com/Corust-ai/corust-agent-release/releases"
  },
  {
    "id": "crow-cli",
    "name": "crow-cli",
    "description": "Minimal ACP Native Coding Agent",
    "command": "crow-cli",
    "args": [
      "acp"
    ],
    "env": {},
    "transport": "acp",
    "sources": [
      "Paseo"
    ],
    "homepage": "https://crow-ai.dev/"
  },
  {
    "id": "cursor",
    "name": "Cursor",
    "description": "Cursor's coding agent",
    "command": "cursor-agent",
    "args": [
      "acp"
    ],
    "env": {},
    "transport": "acp",
    "sources": [
      "Paseo",
      "Orca"
    ],
    "homepage": "https://docs.cursor.com/en/cli/overview"
  },
  {
    "id": "deepagents",
    "name": "LangChain DeepAgents（社区 ACP）",
    "description": "Batteries-included AI coding and general purpose agent powered by LangChain.",
    "command": "deepagents-acp",
    "args": [],
    "env": {},
    "transport": "acp",
    "sources": [
      "Paseo"
    ],
    "homepage": "https://docs.langchain.com/oss/javascript/deepagents/overview",
    "packages": [
      "deepagents-acp@0.1.36"
    ]
  },
  {
    "id": "devin",
    "name": "Devin CLI",
    "description": "Cognition's Devin for Terminal via Agent Client Protocol",
    "command": "devin",
    "args": [
      "acp"
    ],
    "env": {},
    "transport": "acp",
    "sources": [
      "Paseo",
      "Orca"
    ],
    "homepage": "https://cli.devin.ai/docs"
  },
  {
    "id": "dimcode",
    "name": "DimCode",
    "description": "A coding agent that puts leading models at your command.",
    "command": "dim",
    "args": [
      "acp"
    ],
    "env": {},
    "transport": "acp",
    "sources": [
      "Paseo"
    ],
    "homepage": "https://dimcode.dev/docs/acp.html",
    "packages": [
      "dimcode@0.5.21"
    ]
  },
  {
    "id": "dirac",
    "name": "Dirac",
    "description": "Reduces API costs by more than 50%, produces better and faster work. Uses Hash anchored parallel edits, AST manipulation and a whole lot of neat optimizations. Fully Open Source.",
    "command": "dirac",
    "args": [
      "--acp"
    ],
    "env": {},
    "transport": "acp",
    "sources": [
      "Paseo"
    ],
    "homepage": "https://dirac.run",
    "packages": [
      "dirac-cli@0.5.23"
    ]
  },
  {
    "id": "droid",
    "name": "Factory Droid",
    "description": "Factory Droid - AI coding agent powered by Factory AI",
    "command": "droid",
    "args": [
      "exec",
      "--output-format",
      "acp-daemon"
    ],
    "env": {
      "DROID_DISABLE_AUTO_UPDATE": "true",
      "FACTORY_DROID_AUTO_UPDATE_ENABLED": "false"
    },
    "transport": "acp",
    "sources": [
      "Paseo",
      "Orca"
    ],
    "homepage": "https://factory.ai/product/cli",
    "packages": [
      "droid@0.249.0"
    ]
  },
  {
    "id": "fast-agent",
    "name": "fast-agent",
    "description": "Code and build agents with comprehensive multi-provider support",
    "command": "fast-agent-acp",
    "args": [
      "-x"
    ],
    "env": {},
    "transport": "acp",
    "sources": [
      "Paseo"
    ],
    "homepage": "https://fast-agent.ai/acp/"
  },
  {
    "id": "fx",
    "name": "fx",
    "description": "Vercel Labs' tiny, open, native coding agent",
    "command": "fx",
    "args": [
      "acp"
    ],
    "env": {},
    "transport": "acp",
    "sources": [
      "Paseo"
    ],
    "homepage": "https://fx.sh/docs/getting-started/installation"
  },
  {
    "id": "gemini",
    "name": "Gemini CLI",
    "description": "Google's official CLI for Gemini",
    "command": "gemini",
    "args": [
      "--acp"
    ],
    "env": {},
    "transport": "acp",
    "sources": [
      "Paseo",
      "Orca"
    ],
    "homepage": "https://geminicli.com",
    "packages": [
      "@google/gemini-cli@0.65.0"
    ]
  },
  {
    "id": "gjc",
    "name": "Gajae Code",
    "description": "Runs on the Claude/Codex/Gemini subscription you already pay for. Plan-before-mutation workflows, evidence-gated execution, and approval prompts for shell and destructive edits.",
    "command": "gjc",
    "args": [
      "acp"
    ],
    "env": {
      "GJC_ACP_PERMISSION_MODE": "prompt"
    },
    "transport": "acp",
    "sources": [
      "Paseo"
    ],
    "homepage": "https://gajae-code.com"
  },
  {
    "id": "glm-acp-agent",
    "name": "GLM ACP（社区 · 非 ZCode）",
    "description": "ACP agent powered by Zhipu AI's GLM Coding Plan models (glm-5.3, glm-5.3-flash, glm-5-turbo, glm-4.7). Supports streaming, tool calls, mid-session model switching, image input via Z.AI Coding Plan Vision MCP, and session load/fork/resume with on-disk persistence.",
    "command": "glm-acp-agent",
    "args": [],
    "env": {},
    "transport": "acp",
    "sources": [
      "Paseo"
    ],
    "homepage": "https://github.com/stefandevo/glm-acp-agent",
    "packages": [
      "glm-acp-agent@1.15.0"
    ]
  },
  {
    "id": "goose",
    "name": "goose",
    "description": "A local, extensible, open source AI agent that automates engineering tasks",
    "command": "goose",
    "args": [
      "acp"
    ],
    "env": {},
    "transport": "acp",
    "sources": [
      "Paseo",
      "Orca"
    ],
    "homepage": "https://block.github.io/goose/"
  },
  {
    "id": "grok",
    "name": "Grok",
    "description": "xAI's Grok Build agentic coding CLI with plan mode and parallel subagents. Requires a SuperGrok or X Premium+ subscription.",
    "command": "grok",
    "args": [
      "agent",
      "stdio"
    ],
    "env": {},
    "transport": "acp",
    "sources": [
      "Paseo",
      "Orca"
    ],
    "homepage": "https://docs.x.ai/build/overview"
  },
  {
    "id": "hermes",
    "name": "Hermes",
    "description": "Nous Research self-improving AI agent",
    "command": "hermes",
    "args": [
      "acp"
    ],
    "env": {},
    "transport": "acp",
    "sources": [
      "Paseo",
      "Orca"
    ],
    "homepage": "https://hermes-agent.nousresearch.com/docs/user-guide/features/acp"
  },
  {
    "id": "hoplite",
    "name": "Hoplite",
    "description": "Cloud coding agent through the local hoplite acp bridge",
    "command": "hoplite",
    "args": [
      "acp"
    ],
    "env": {},
    "transport": "acp",
    "sources": [
      "Paseo"
    ],
    "homepage": "https://hoplite.sh/docs/cli#install"
  },
  {
    "id": "junie",
    "name": "Junie",
    "description": "AI Coding Agent by JetBrains",
    "command": "junie",
    "args": [
      "--acp",
      "true"
    ],
    "env": {},
    "transport": "acp",
    "sources": [
      "Paseo"
    ],
    "homepage": "https://junie.jetbrains.com/docs/junie-cli-acp.html"
  },
  {
    "id": "kilo",
    "name": "Kilo",
    "description": "The open source coding agent",
    "command": "kilo",
    "args": [
      "acp"
    ],
    "env": {},
    "transport": "acp",
    "sources": [
      "Paseo",
      "Orca"
    ],
    "homepage": "https://kilo.ai/docs/code-with-ai/platforms/cli"
  },
  {
    "id": "kiro",
    "name": "Kiro CLI",
    "description": "Amazon's AI coding agent with native ACP support",
    "command": "kiro-cli",
    "args": [
      "acp"
    ],
    "env": {},
    "transport": "acp",
    "sources": [
      "Paseo",
      "Orca"
    ],
    "homepage": "https://kiro.dev/docs/cli/acp/"
  },
  {
    "id": "kimi",
    "name": "Kimi Code CLI",
    "description": "Moonshot AI's open-source terminal coding agent",
    "command": "kimi",
    "args": [
      "acp"
    ],
    "env": {},
    "transport": "acp",
    "sources": [
      "Paseo",
      "Orca"
    ],
    "homepage": "https://github.com/MoonshotAI/kimi-code"
  },
  {
    "id": "mcode",
    "name": "MiniMax Code",
    "description": "MiniMax's coding agent for the terminal",
    "command": "mcode",
    "args": [
      "acp"
    ],
    "env": {},
    "transport": "acp",
    "sources": [
      "Paseo"
    ],
    "homepage": "https://agent.minimax.io",
    "packages": [
      "@minimax-ai/code@0.6.13"
    ]
  },
  {
    "id": "minion-code",
    "name": "Minion Code",
    "description": "An enhanced AI code assistant built on the Minion framework with rich development tools",
    "command": "minion-code",
    "args": [
      "acp"
    ],
    "env": {},
    "transport": "acp",
    "sources": [
      "Paseo"
    ],
    "homepage": "https://github.com/femto/minion-code"
  },
  {
    "id": "mistral-vibe",
    "name": "Mistral Vibe",
    "description": "Mistral's open-source coding assistant",
    "command": "vibe-acp",
    "args": [],
    "env": {},
    "transport": "acp",
    "sources": [
      "Paseo",
      "Orca"
    ],
    "homepage": "https://github.com/mistralai/mistral-vibe"
  },
  {
    "id": "nova",
    "name": "Nova",
    "description": "Nova by Compass AI - a fully-fledged software engineer at your command",
    "command": "nova",
    "args": [
      "acp"
    ],
    "env": {},
    "transport": "acp",
    "sources": [
      "Paseo"
    ],
    "homepage": "https://www.compassap.ai/portfolio/nova.html",
    "packages": [
      "@compass-ai/nova@1.1.59"
    ]
  },
  {
    "id": "poolside",
    "name": "Poolside",
    "description": "Poolside's coding agent",
    "command": "pool",
    "args": [
      "acp"
    ],
    "env": {},
    "transport": "acp",
    "sources": [
      "Paseo"
    ],
    "homepage": "https://docs.poolside.ai/cli/pool"
  },
  {
    "id": "qoder",
    "name": "Qoder CLI",
    "description": "AI coding assistant with agentic capabilities",
    "command": "qoder",
    "args": [
      "--acp"
    ],
    "env": {},
    "transport": "acp",
    "sources": [
      "Paseo",
      "Orca"
    ],
    "homepage": "https://qoder.com",
    "packages": [
      "@qoder-ai/qodercli@1.1.78"
    ]
  },
  {
    "id": "qwen",
    "name": "Qwen Code",
    "description": "Alibaba's Qwen coding assistant",
    "command": "qwen",
    "args": [
      "--acp",
      "--experimental-skills"
    ],
    "env": {},
    "transport": "acp",
    "sources": [
      "Paseo",
      "Orca"
    ],
    "homepage": "https://qwenlm.github.io/qwen-code-docs/en/users/overview",
    "packages": [
      "@qwen-code/qwen-code@0.26.0"
    ]
  },
  {
    "id": "sigit",
    "name": "siGit Code",
    "description": "Local-first coding agent. Runs entirely on your machine with optional on-device LLM inference via Onde.",
    "command": "sigit",
    "args": [],
    "env": {},
    "transport": "acp",
    "sources": [
      "Paseo"
    ],
    "homepage": "https://github.com/getsigit/sigit"
  },
  {
    "id": "stakpak",
    "name": "Stakpak",
    "description": "Open-source DevOps agent in Rust with enterprise-grade security",
    "command": "stakpak",
    "args": [
      "acp"
    ],
    "env": {},
    "transport": "acp",
    "sources": [
      "Paseo"
    ],
    "homepage": "https://stakpak.dev/"
  },
  {
    "id": "trae",
    "name": "TRAE CLI",
    "description": "ByteDance's official TRAE coding agent with native ACP support",
    "command": "traecli",
    "args": [
      "acp",
      "serve"
    ],
    "env": {},
    "transport": "acp",
    "sources": [
      "Paseo",
      "Orca"
    ],
    "homepage": "https://docs.trae.cn/cli_get-started-with-trae-cli"
  },
  {
    "id": "vtcode",
    "name": "VT Code",
    "description": "An open-source coding agent with LLM-native code understanding and robust shell safety. Supports multiple LLM providers with automatic failover and efficient context management.",
    "command": "vtcode",
    "args": [
      "acp"
    ],
    "env": {
      "VT_ACP_ENABLED": "1",
      "VT_ACP_ZED_ENABLED": "1"
    },
    "transport": "acp",
    "sources": [
      "Paseo"
    ],
    "homepage": "https://github.com/vinhnx/VTCode/blob/main/docs/guides/zed-acp.md"
  },
  {
    "id": "claude-agent-teams",
    "name": "Claude Agent Teams",
    "description": "Orca 原生分栏团队入口；当前保留目录，待宿主编排能力适配后开放。",
    "hostRequirement": "需要 Orca 原生终端的团队分栏与 tmux 桥，Tervell 当前不执行此宿主专用入口。",
    "command": "orca",
    "args": ["claude-teams"],
    "env": {},
    "transport": "pty",
    "sources": [
      "Orca"
    ],
    "homepage": "https://code.claude.com/docs/en/agent-teams"
  },
  {
    "id": "openclaude",
    "name": "OpenClaude",
    "description": "Orca CLI目录；终端接入，不冒充原生ACP",
    "command": "openclaude",
    "args": [],
    "env": {},
    "transport": "pty",
    "sources": [
      "Orca"
    ],
    "homepage": "https://openclaude.gitlawb.com/"
  },
  {
    "id": "copilot",
    "name": "GitHub Copilot",
    "description": "Orca CLI目录；终端接入，不冒充原生ACP",
    "command": "copilot",
    "args": [],
    "env": {},
    "transport": "pty",
    "sources": [
      "Orca"
    ],
    "homepage": "https://docs.github.com/en/copilot/how-tos/set-up/install-copilot-cli"
  },
  {
    "id": "opencode2",
    "name": "OpenCode 2",
    "description": "Orca CLI目录；终端接入，不冒充原生ACP",
    "command": "opencode2",
    "args": [],
    "env": {},
    "transport": "pty",
    "sources": [
      "Orca"
    ],
    "homepage": "https://opencode.ai/v2/docs/"
  },
  {
    "id": "opencode",
    "name": "OpenCode",
    "description": "Orca CLI目录；终端接入，不冒充原生ACP",
    "command": "opencode",
    "args": [],
    "env": {},
    "transport": "pty",
    "sources": [
      "Orca"
    ],
    "homepage": "https://opencode.ai/docs/cli/"
  },
  {
    "id": "mimo-code",
    "name": "MiMo Code",
    "description": "Orca CLI目录；终端接入，不冒充原生ACP",
    "command": "mimo",
    "args": [],
    "env": {},
    "transport": "pty",
    "sources": [
      "Orca"
    ],
    "homepage": "https://mimo.xiaomi.com/coder"
  },
  {
    "id": "ante",
    "name": "Ante",
    "description": "Orca CLI目录；终端接入，不冒充原生ACP",
    "command": "ante",
    "args": [],
    "env": {},
    "transport": "pty",
    "sources": [
      "Orca"
    ],
    "homepage": "https://github.com/AntigmaLabs/ante-preview"
  },
  {
    "id": "muse",
    "name": "Muse",
    "description": "Orca CLI目录；终端接入，不冒充原生ACP",
    "command": "muse",
    "args": [],
    "env": {},
    "transport": "pty",
    "sources": [
      "Orca"
    ],
    "homepage": "https://dev.meta.ai/docs/muse-code"
  },
  {
    "id": "dsh",
    "name": "DeepSeek Harness",
    "description": "DeepSeek 官方 Harness，使用官方 ACP automation profile；与 LangChain DeepAgents 无关。",
    "command": "dsh",
    "args": ["--profile", "acp"],
    "env": {},
    "transport": "acp",
    "sources": [
      "Magpie", "DeepSeek 官方"
    ],
    "homepage": "https://github.com/deepseek-ai/deepseek-harness"
  },
  {
    "id": "qoder-cn",
    "name": "Qoder CLI China",
    "description": "Orca CLI目录；终端接入，不冒充原生ACP",
    "command": "qoderclicn",
    "args": [],
    "env": {},
    "transport": "pty",
    "sources": [
      "Orca"
    ],
    "homepage": "https://docs.qoder.cn/cli/overview"
  },
  {
    "id": "zcode",
    "name": "ZCode",
    "description": "Orca CLI目录；终端接入，不冒充原生ACP",
    "command": "zcode",
    "args": [],
    "env": {},
    "transport": "pty",
    "sources": [
      "Orca"
    ],
    "homepage": "https://zcode.z.ai/en/docs"
  },
  {
    "id": "prime-agent",
    "name": "Prime Agent",
    "description": "Orca CLI目录；终端接入，不冒充原生ACP",
    "command": "prime-agent",
    "args": [],
    "env": {},
    "transport": "pty",
    "sources": [
      "Orca"
    ],
    "homepage": "https://github.com/PrimeIntellect-ai/prime-agent"
  },
  {
    "id": "antigravity",
    "name": "Antigravity",
    "description": "Orca CLI目录；终端接入，不冒充原生ACP",
    "command": "agy",
    "args": [],
    "env": {},
    "transport": "pty",
    "sources": [
      "Orca"
    ],
    "homepage": "https://antigravity.google/docs/cli-overview"
  },
  {
    "id": "aider",
    "name": "Aider",
    "description": "Orca CLI目录；终端接入，不冒充原生ACP",
    "command": "aider",
    "args": [],
    "env": {},
    "transport": "pty",
    "sources": [
      "Orca"
    ],
    "homepage": "https://aider.chat/docs/"
  },
  {
    "id": "crush",
    "name": "Charm",
    "description": "Orca CLI目录；终端接入，不冒充原生ACP",
    "command": "crush",
    "args": [],
    "env": {},
    "transport": "pty",
    "sources": [
      "Orca"
    ],
    "homepage": "https://github.com/charmbracelet/crush"
  },
  {
    "id": "codebuff",
    "name": "Codebuff",
    "description": "Orca CLI目录；终端接入，不冒充原生ACP",
    "command": "codebuff",
    "args": [],
    "env": {},
    "transport": "pty",
    "sources": [
      "Orca"
    ],
    "homepage": "https://www.codebuff.com/docs/help/quick-start"
  },
  {
    "id": "freebuff",
    "name": "Freebuff",
    "description": "Orca CLI目录；终端接入，不冒充原生ACP",
    "command": "freebuff",
    "args": [],
    "env": {},
    "transport": "pty",
    "sources": [
      "Orca"
    ],
    "homepage": "https://freebuff.com/cli"
  },
  {
    "id": "command-code",
    "name": "Command Code",
    "description": "Orca CLI目录；终端接入，不冒充原生ACP",
    "command": "command-code",
    "args": [],
    "env": {},
    "transport": "pty",
    "sources": [
      "Orca"
    ],
    "homepage": "https://commandcode.ai/docs/quickstart"
  },
  {
    "id": "continue",
    "name": "Continue",
    "description": "Orca CLI目录；终端接入，不冒充原生ACP",
    "command": "cn",
    "args": [],
    "env": {},
    "transport": "pty",
    "sources": [
      "Orca"
    ],
    "homepage": "https://docs.continue.dev/cli/quickstart"
  },
  {
    "id": "rovo",
    "name": "Rovo Dev",
    "description": "Orca CLI目录；终端接入，不冒充原生ACP",
    "command": "acli",
    "args": [
      "rovodev",
      "run"
    ],
    "env": {},
    "transport": "pty",
    "sources": [
      "Orca"
    ],
    "homepage": "https://support.atlassian.com/rovo/docs/install-and-run-rovo-dev-cli-on-your-device/"
  },
  {
    "id": "openclaw",
    "name": "OpenClaw",
    "description": "Orca CLI目录；终端接入，不冒充原生ACP",
    "command": "openclaw",
    "args": [],
    "env": {},
    "transport": "pty",
    "sources": [
      "Orca"
    ],
    "homepage": "https://github.com/openclaw/openclaw"
  },
  {
    "id": "jcode",
    "name": "Jcode",
    "description": "Orca CLI目录；终端接入，不冒充原生ACP",
    "command": "jcode",
    "args": [],
    "env": {},
    "transport": "pty",
    "sources": [
      "Orca"
    ],
    "homepage": "https://github.com/1jehuang/jcode"
  }
]
