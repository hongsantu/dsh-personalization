# dsh-personalization

[English](README.md) | [中文](README.zh.md)

A DSH (DeepSeek Harness Desktop) personalization plugin: adds a **Personalization** card in Settings that directly edits `$DSH_HOME/AGENTS.md` (the user-global personalization file), so **every session** automatically loads and prioritizes the content configured there.

## Features

- 🎴 **Settings section**: Settings → Plugins → Plugin configuration → **Personalization** card (textarea editor + save).
- 🌐 **Global scope**: content is written to `$DSH_HOME/AGENTS.md`, DSH's user-global instruction file, which is injected into the workspace instruction baseline of every session before it starts.
- 🔄 **Two-way sync**: on startup the file is the source of truth (recreated from a template if missing); saving from the Settings card writes the file back.
- ⚡ **Hot reload**: in-session edits to `AGENTS.md` made by the agent via editing tools are synced live, no restart needed.
- 🧩 **Bundled skill**: ships the `personalization` skill so agents know when and how to maintain this configuration.

## How it works

| Layer | File | Role |
|---|---|---|
| Host half | `lib/index.js` | Registers the `personalization` settings namespace and syncs it to `$DSH_HOME/AGENTS.md` |
| Browser half | `lib/client.js` | The Personalization card inside Settings → Plugins → Plugin configuration |
| Skill | `skills/personalization/SKILL.md` | Guides the agent in maintaining the user-global personalization file |
| Instruction file | `$DSH_HOME/AGENTS.md` | User-global instructions, auto-injected into every session (native DSH mechanism) |

## Layout

```text
dsh-personalization/
├── package.json                    # Plugin manifest (incl. dsh.client browser-half declaration)
├── lib/
│   ├── index.js                    # Host half
│   └── client.js                   # Browser half (settings card)
├── skills/
│   └── personalization/SKILL.md    # Bundled skill
├── examples/
│   └── AGENTS.md.template          # Seed template (no personal/private content)
├── install/
│   └── cordis.patch.yml.example    # Profile mount snippet
├── README.md
├── README.zh.md
└── LICENSE                         # MIT
```

## Installation

> Prerequisite: DSH Desktop. `$DSH_HOME` is usually `C:\Users\<your-user-name>\.dsh`.

1. **Copy the plugin package**: copy the whole `dsh-personalization` directory to
   `$DSH_HOME\profiles\node_modules\dsh-personalization`
   (`profiles\node_modules` is DSH's maintained module fallback directory — no pnpm install needed).

2. **Mount the plugin**: edit `$DSH_HOME\profiles\<profile-name>\cordis.patch.yml` (e.g. `desktop`) and append:

   ```yaml
   - insert:
       - id: personalization
         name: dsh-personalization
   ```

   (See `install/cordis.patch.yml.example`.)

3. **Install the skill (optional but recommended)**: copy `skills/personalization` to `$DSH_HOME\skills\personalization`.

4. **Restart DSH Desktop**.

## Usage

- Open **Settings → Plugins → Plugin configuration → Personalization**, edit and save — it writes `$DSH_HOME\AGENTS.md`;
- New sessions inject the file content before they start; in-session agent edits to the same file are hot-synced;
- You can also simply ask the agent to edit `~/.dsh/AGENTS.md` (the bundled skill maintains it per its rules).

## Uninstall

1. Remove the `personalization` row from `cordis.patch.yml`;
2. Delete `$DSH_HOME\profiles\node_modules\dsh-personalization` and `$DSH_HOME\skills\personalization`;
3. Restart DSH Desktop. `$DSH_HOME\AGENTS.md` is kept (delete it manually if you want).

## Privacy note

`$DSH_HOME\AGENTS.md` holds **your personal preferences** — do not commit it to a public repository. This repository only ships the generic `examples/AGENTS.md.template`.

## For contributors

- After changing `lib/client.js`, refresh the GUI page (browser bundles are served live with `no-cache`); composition-level changes require a restart.
- Keep the `window.__ModuleLoader__.load(...)` browser-plugin wrapper and the `dsh.client` manifest declaration in sync.
- When publishing on GitHub, add the `dsh-plugin` topic:
  `gh repo edit <owner>/dsh-personalization --add-topic dsh-plugin` (or repo About → Topics).

## License

[MIT](LICENSE)
