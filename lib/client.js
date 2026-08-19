// 个性化设置插件（浏览器半）
// 在「设置 → 插件 → 插件配置」注册一张「个性化」卡片：
// textarea 编辑全局个性化内容，保存时经 settings 命名空间写回 $DSH_HOME/AGENTS.md。
window.__ModuleLoader__.load({
	id: 'dsh-personalization',
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
		let react = require('react');
		let runtime = require('@deepseek-ai/dsh-client-runtime/client');

		// ── 卡片样式（独立 CSS，避免与其他插件冲突）──────────────────────────────
		const css =
			'.dsp_card{border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-3);border-radius:12px;list-style:none;transition:border-color .16s,background .16s}' +
			'.dsp_card:hover{border-color:var(--dsw-alias-label-dimmed)}' +
			'.dsp_cardOpen{background:var(--dsw-alias-bg-layer-2);border-color:var(--dsw-alias-label-dimmed)}' +
			'.dsp_header{appearance:none;width:100%;font:inherit;color:inherit;text-align:left;cursor:pointer;background:0 0;border:0;border-radius:12px;align-items:center;gap:12px;padding:14px 16px;display:flex}' +
			'.dsp_header:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:-2px}' +
			'.dsp_headText{flex-direction:column;flex:1;gap:4px;min-width:0;display:flex}' +
			'.dsp_name{color:var(--dsw-alias-label-primary);font-size:15px;font-weight:600;line-height:1.4}' +
			'.dsp_description{color:var(--dsw-alias-label-tertiary);font-size:13px;line-height:1.5}' +
			'.dsp_pending{white-space:nowrap;background:var(--dsw-alias-bg-module-platform);color:var(--dsw-alias-label-secondary);border-radius:999px;flex:none;padding:1px 8px;font-size:11px;font-weight:500;line-height:17px}' +
			'.dsp_chevron{color:var(--dsw-alias-label-tertiary);flex:none;transition:transform .16s}' +
			'.dsp_chevronOpen{transform:rotate(180deg)}' +
			'.dsp_body{border-top:1px solid var(--dsw-alias-border-l2);margin:0 16px;padding-bottom:8px}' +
			'.dsp_readOnly{color:var(--dsw-alias-label-tertiary);margin:12px 0 0;font-size:12px;line-height:1.5}' +
			'.dsp_textarea{box-sizing:border-box;width:100%;border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-3);color:var(--dsw-alias-label-primary);border-radius:8px;padding:10px 12px;font:inherit;font-size:13px;line-height:1.6;resize:vertical;margin-top:12px}' +
			'.dsp_textarea:focus-visible{border-color:var(--dsw-alias-brand-primary);outline:none}' +
			'.dsp_textarea:disabled{color:var(--dsw-alias-label-tertiary);cursor:default}' +
			'.dsp_hint{color:var(--dsw-alias-label-tertiary);margin:8px 0 0;font-size:12px;line-height:1.5}' +
			'.dsp_footer{border-top:1px solid var(--dsw-alias-border-l2);justify-content:flex-end;align-items:center;gap:8px;padding:12px 0 4px;display:flex}' +
			'.dsp_failed{min-width:0;color:var(--dsw-alias-label-error);flex:1;margin:0;font-size:12px;line-height:1.5}' +
			'.dsp_discard,.dsp_save{appearance:none;font:inherit;cursor:pointer;border:1px solid transparent;border-radius:8px;padding:5px 14px;font-size:13px;line-height:1.5}' +
			'.dsp_discard{border-color:var(--dsw-alias-border-l2);color:var(--dsw-alias-label-secondary);background:0 0}' +
			'.dsp_save{color:#fff;background:var(--dsw-alias-brand-primary)}' +
			'.dsp_save:disabled,.dsp_discard:disabled{opacity:.5;cursor:default}';
		const tagId = 'dsh-personalization/card.css';
		if (
			typeof document !== 'undefined' &&
			document.querySelector(`style[data-plugin-css="${tagId}"]`) === null
		) {
			const tag = document.createElement('style');
			tag.dataset.plugin = 'dsh-personalization';
			tag.dataset.pluginCss = tagId;
			tag.textContent = css;
			document.head.appendChild(tag);
		}

		// ── 表单控制器：暂存草稿，保存时写入 settings 命名空间 ─────────────────────
		var PersonalizationController = class {
			constructor(scope) {
				this.scope = scope;
				this.staged = null; // string | null；null 表示未编辑
				this.saving = false;
				this.failed = false;
				this.store = runtime.createSnapshotStore(this.project());
				scope.subscribe(() => {
					this.publish();
				});
			}
			project() {
				const snap = this.scope.getSnapshot();
				const value = snap.value;
				const current = typeof value?.content === 'string' ? value.content : '';
				return {
					available: snap.status === 'ready',
					writable: snap.writable,
					dirty: this.staged !== null && this.staged !== current,
					saving: this.saving,
					failed: this.failed,
					text: this.staged !== null ? this.staged : current
				};
			}
			publish() {
				this.store.set(this.project());
			}
			edit(text) {
				this.staged = text;
				this.failed = false;
				this.publish();
			}
			discard() {
				this.staged = null;
				this.failed = false;
				this.publish();
			}
			async save() {
				const p = this.project();
				if (this.saving || !p.dirty || !p.available || !p.writable) return;
				this.saving = true;
				this.failed = false;
				this.publish();
				await this.scope.set('content', p.text);
				const after = this.scope.getSnapshot();
				const landed = after.user != null && after.user.content === p.text;
				this.staged = null;
				this.saving = false;
				this.failed = !landed;
				this.publish();
			}
			inject() {
				return {
					hooks: { personalization: this.store },
					edit: (text) => this.edit(text),
					save: () => this.save(),
					discard: () => this.discard()
				};
			}
		};

		// ── 卡片组件：标题行 + 可展开的编辑区 ─────────────────────────────────────
		function PersonalizationCard(props) {
			const snap = props.usePersonalization((s) => s);
			const [open, setOpen] = react.useState(false);
			const blocked = !snap.available || !snap.dirty || snap.saving;
			return react.createElement(
				'li',
				{ className: 'dsp_card' + (open ? ' dsp_cardOpen' : '') },
				react.createElement(
					'button',
					{
						type: 'button',
						className: 'dsp_header',
						'aria-expanded': open,
						onClick: () => {
							setOpen(!open);
						}
					},
					react.createElement(
						'span',
						{ className: 'dsp_headText' },
						react.createElement('span', { className: 'dsp_name' }, '个性化'),
						react.createElement('span', { className: 'dsp_description' }, '编辑全局个性化配置（~/.dsh/AGENTS.md），所有会话生效')
					),
					snap.dirty
						? react.createElement('span', { className: 'dsp_pending' }, '未保存')
						: null,
					react.createElement('span', { className: 'dsp_chevron' + (open ? ' dsp_chevronOpen' : '') }, '▾')
				),
				open
					? react.createElement(
							'div',
							{ className: 'dsp_body' },
							!snap.writable
								? react.createElement('p', { className: 'dsp_readOnly', role: 'status' }, '本部署的设置只读，无法保存。')
								: null,
							react.createElement('textarea', {
								className: 'dsp_textarea',
								rows: 14,
								value: snap.text,
								disabled: !snap.available || !snap.writable,
								placeholder: '在这里写下每个会话都要遵守的个性化内容（Markdown）…',
								onChange: (event) => {
									props.edit(event.target.value);
								}
							}),
							react.createElement('p', { className: 'dsp_hint' }, '保存后写入 ~/.dsh/AGENTS.md，新会话立即生效；当前会话中由 Agent 编辑同一文件也会热同步。'),
							react.createElement(
								'div',
								{ className: 'dsp_footer' },
								snap.failed ? react.createElement('p', { className: 'dsp_failed', role: 'status' }, '保存失败，请重试。') : null,
								react.createElement(
									'button',
									{
										type: 'button',
										className: 'dsp_discard',
										disabled: !snap.dirty || snap.saving,
										onClick: () => {
											props.discard();
										}
									},
									'放弃修改'
								),
								react.createElement(
									'button',
									{
										type: 'button',
										className: 'dsp_save',
										disabled: blocked,
										onClick: () => {
											props.save();
										}
									},
									snap.saving ? '保存中…' : '保存'
								)
							)
						)
					: null
			);
		}

		// ── 挂载 ──────────────────────────────────────────────────────────────────
		const NS = 'personalization';
		const inject = ['settingsScope', 'slots'];

		function apply(ctx) {
			const scope = ctx.settingsScope.bind({ namespace: NS });
			const controller = new PersonalizationController(scope);
			ctx.slots.inject('settings.plugin.item', function* () {
				yield ctx.slots.register(
					{
						name: 'settings.plugin.item',
						key: NS,
						inject: () => controller.inject()
					},
					PersonalizationCard
				);
			});
		}

		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	}
});
