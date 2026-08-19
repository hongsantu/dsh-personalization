# dsh-personalization

[English](README.md) | [中文](README.zh.md)

DSH（DeepSeek Harness Desktop）个性化设置插件：在设置页提供「个性化」卡片，直接编辑 `$DSH_HOME/AGENTS.md`（用户全局个性化配置），让**每个会话**都自动注入并优先使用其中的个性化内容。

## 特性

- 🎴 **设置页栏目**：设置 → 插件 → 插件配置 →「个性化」卡片（textarea 编辑 + 保存）。
- 🌐 **全局生效**：内容写入 `$DSH_HOME/AGENTS.md`，这是 DSH 的用户全局指令文件，每个会话开始前都会注入工作区指令基线（用户全局层）。
- 🔄 **双向同步**：启动时以 AGENTS.md 为准（缺失自动用模板重建）；设置页保存时写回 AGENTS.md。
- ⚡ **热更新**：会话中由 Agent 用编辑工具修改 AGENTS.md 也会热同步，无需重启。
- 🧩 **配套技能**：附 `personalization` 技能，Agent 知道何时/如何维护这份配置。

## 工作原理

| 层 | 文件 | 作用 |
|---|---|---|
| 宿主半 | `lib/index.js` | 注册 `personalization` 设置命名空间，把内容同步到 `$DSH_HOME/AGENTS.md` |
| 浏览器半 | `lib/client.js` | 设置页「插件配置」标签里的「个性化」卡片 |
| 技能 | `skills/personalization/SKILL.md` | 指导 Agent 维护全局个性化配置 |
| 指令文件 | `$DSH_HOME/AGENTS.md` | 用户全局指令，每个会话自动注入（DSH 原生机制） |

## 目录结构

```text
dsh-personalization/
├── package.json                    # 插件清单（含 dsh.client 浏览器端声明）
├── lib/
│   ├── index.js                    # 宿主半
│   └── client.js                   # 浏览器半（设置页卡片）
├── skills/
│   └── personalization/SKILL.md    # 配套技能
├── examples/
│   └── AGENTS.md.template          # 种子模板（不含任何个人隐私内容）
├── install/
│   └── cordis.patch.yml.example    # profile 挂载片段
├── README.md                       # 英文版
├── README.zh.md                    # 中文版
└── LICENSE                         # MIT
```

## 安装

> 前置条件：DSH Desktop。`$DSH_HOME` 通常为 `C:\Users\<你的用户名>\.dsh`。

1. **复制插件包**：把整个 `dsh-personalization` 目录复制到
   `$DSH_HOME\profiles\node_modules\dsh-personalization`
   （`profiles\node_modules` 是 DSH 自动维护的模块回退目录，无需 pnpm 安装）。

2. **挂载插件**：编辑 `$DSH_HOME\profiles\<profile名>\cordis.patch.yml`（如 `desktop`），追加：

   ```yaml
   - insert:
       - id: personalization
         name: dsh-personalization
   ```

   （或直接参考 `install/cordis.patch.yml.example`。）

3. **安装技能（可选但推荐）**：把 `skills/personalization` 复制到 `$DSH_HOME\skills\personalization`。

4. **重启 DSH Desktop**。

## 使用

- 打开 **设置 → 插件 → 插件配置 →「个性化」**，编辑内容并保存，即写入 `$DSH_HOME\AGENTS.md`；
- 新会话开始前自动注入该文件内容；会话中 Agent 修改同一文件也会热同步；
- 也可直接让 Agent 编辑 `~/.dsh/AGENTS.md`（配套技能会按规范维护）。

## 卸载

1. 从 `cordis.patch.yml` 删除 `personalization` 行；
2. 删除 `$DSH_HOME\profiles\node_modules\dsh-personalization` 与 `$DSH_HOME\skills\personalization`；
3. 重启 DSH Desktop。`$DSH_HOME\AGENTS.md` 保留（可手动删除）。

## 隐私提醒

`$DSH_HOME\AGENTS.md` 中保存的是**你的个人偏好**，请勿提交到公开仓库。本仓库只提供 `examples/AGENTS.md.template` 通用模板。

## License

[MIT](LICENSE)
