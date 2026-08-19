// 个性化设置插件（宿主半）
// 注册 `personalization` 设置命名空间，将其 content 与 $DSH_HOME/AGENTS.md 同步：
//   - 启动时以 AGENTS.md 为准（缺失则写入模板），作为命名空间的 base 层；
//   - 设置页保存（settings/updated）时把新内容写回 AGENTS.md。
// AGENTS.md 是 DSH 的用户全局指令文件，每个会话开始前都会注入工作区指令基线。
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import z from '@deepseek-ai/schemastery';
import { resolveDshHome } from '@deepseek-ai/dsh-home-paths';
import { settingsNamespace } from '@deepseek-ai/dsh-settings';

const name = 'dsh-personalization';
const NS = settingsNamespace('personalization');

const DEFAULT_TEMPLATE = `# 个性化配置（用户全局）

> 本文件是用户级全局指令：DSH 会在每个会话开始前把它注入工作区指令基线（用户全局层）。
> 编辑方式：设置 → 插件 → 插件配置 → 个性化，或直接让 Agent 修改本文件。
> 保存后，新会话立即生效；会话中由 Agent 用编辑工具修改也会热同步。

## 个性化偏好

在这里写下你希望每个会话都遵守的通用约束，例如：

- 默认使用简体中文回复；
- 代码注释和提交信息使用简洁中文；
- 改动前先说明影响范围。
`;

const Config = z.object({
  content: z.string().default('')
});

/** $DSH_HOME/AGENTS.md 的绝对路径。 */
function agentsPath() {
  return join(resolveDshHome(), 'AGENTS.md');
}

/** 读取 AGENTS.md；文件不存在时写入模板并返回模板内容。 */
async function readOrSeed() {
  const path = agentsPath();
  try {
    return await readFile(path, 'utf8');
  } catch (error) {
    if (error?.code !== 'ENOENT') throw error;
  }
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, DEFAULT_TEMPLATE, 'utf8');
  return DEFAULT_TEMPLATE;
}

function apply(ctx) {
  ctx.inject(['settings'], (sctx) => {
    const path = agentsPath();
    void readOrSeed()
      .then((content) => {
        const scope = sctx.settings.register(NS, Config, { base: { content } });
        sctx.on('settings/updated', (ns, next) => {
          if (ns !== NS) return;
          const text = typeof next?.content === 'string' ? next.content : '';
          writeFile(path, text, 'utf8').catch((error) => {
            ctx.logger.warn('personalization: 写入 AGENTS.md 失败: %o', error);
          });
        });
        // 首次注册后让 UI 立即拿到当前内容（注册本身已同步 base，这里只兜底刷新）
        scope.get();
      })
      .catch((error) => {
        ctx.logger.warn('personalization: 初始化失败: %o', error);
      });
  });
}

export { Config, apply, name };
