import * as Core from './core.js';
import * as ColorSchemes from './color-schemes.js';
import * as Storage from './storage.js';
import * as Backup from './backup.js';
import { validateState } from './validation.js';

const COLOR_SCHEME_KEY = 'autumn-recruit-assistant.color-scheme.v1.0';
const COLOR_SCHEME_OVERRIDES_KEY = 'autumn-recruit-assistant.color-scheme-overrides.v1.0';
const root = document.querySelector('#app');
let state = loadState();
let colorSchemeOverrides = loadColorSchemeOverrides();
let colorSchemes = ColorSchemes.mergeColorSchemes(colorSchemeOverrides);
let colorScheme = loadColorScheme();
let view = 'overview';
let search = '';
// Sort rules are deliberately kept outside persisted data: they are a temporary
// reading preference, not part of a user's application history.
let sortRules = [];
let showDeleted = false;
let drawerApplicationId = null;
let modal = null;
let toastTimer;

function loadState() {
  try {
    const loaded = Storage.loadState();
    validateState(loaded);
    return loaded;
  } catch (error) {
    console.warn('本地数据读取失败，已使用空白状态', error);
    return Core.emptyState();
  }
}

function loadColorScheme() {
  try {
    const saved = localStorage.getItem(COLOR_SCHEME_KEY);
    return colorSchemes.some(scheme => scheme.id === saved) ? saved : 'apple';
  } catch (error) {
    console.warn('配色偏好读取失败，已使用默认配色', error);
    return 'apple';
  }
}

function loadColorSchemeOverrides() {
  try {
    const raw = JSON.parse(localStorage.getItem(COLOR_SCHEME_OVERRIDES_KEY) || '[]');
    return Array.isArray(raw) ? ColorSchemes.parseColorSchemeFile({ type: ColorSchemes.COLOR_SCHEME_FILE_TYPE, version: ColorSchemes.COLOR_SCHEME_FILE_VERSION, schemes: raw }) : [];
  } catch (error) {
    console.warn('自定义配色读取失败，已忽略', error);
    return [];
  }
}

function saveColorScheme() {
  localStorage.setItem(COLOR_SCHEME_KEY, colorScheme);
}

function saveColorSchemeOverrides() {
  localStorage.setItem(COLOR_SCHEME_OVERRIDES_KEY, JSON.stringify(colorSchemeOverrides));
}

function activeColorScheme() { return colorSchemes.find(scheme => scheme.id === colorScheme) || colorSchemes[0]; }

function save() {
  Storage.saveState(state);
}

function currentTheme() {
  return state.settings?.theme === 'dark' ? 'dark' : 'light';
}

function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
}

function today() { return new Date().toISOString().slice(0, 10); }
function appFor(id) { return state.applications.find(item => item.id === id); }
function safeUrl(value) {
  try {
    const url = new URL(String(value || '').trim());
    return ['http:', 'https:'].includes(url.protocol) ? url.href : '';
  } catch { return ''; }
}

function applicationLink(app, label = '打开岗位网址') {
  const url = safeUrl(app.website);
  return url ? `<a class="icon-button external-link" href="${esc(url)}" target="_blank" rel="noreferrer" title="${label}" aria-label="${label}">↗</a>` : '<span class="icon-button external-link disabled" title="未填写网址" aria-label="未填写网址" aria-disabled="true">↗</span>';
}
function statusBadge(status, compact = false) {
  const meta = Core.STATUS_META[status] || Core.STATUS_META['已投递'];
  return `<span class="status-badge tone-${meta.tone} ${compact ? 'compact' : ''}">${esc(status)}</span>`;
}
function priorityBadge(priority) {
  const value = priority || '中';
  return `<span class="priority-badge priority-${esc(value)}">${esc(value)}</span>`;
}

function selectOptions(selected, includeAll = false) {
  const options = includeAll ? ['全部状态', ...Core.STATUSES] : Core.STATUSES;
  return options.map(item => `<option value="${esc(item)}" ${item === selected ? 'selected' : ''}>${esc(item)}</option>`).join('');
}

function priorityOptions(selected) {
  return Core.PRIORITIES.map(item => `<option value="${esc(item)}" ${item === selected ? 'selected' : ''}>${esc(item)}</option>`).join('');
}

function channelOptions(selected) {
  return Core.CHANNELS.map(item => `<option value="${esc(item)}" ${item === selected ? 'selected' : ''}>${esc(item)}</option>`).join('');
}

function render() {
  document.documentElement.dataset.theme = currentTheme();
  document.documentElement.dataset.colorScheme = colorScheme;
  document.body.classList.toggle('drawer-open', Boolean(drawerApplicationId));
  document.body.classList.toggle('modal-open', Boolean(modal));
  ColorSchemes.applyColorScheme(document.documentElement, activeColorScheme(), currentTheme());
  root.innerHTML = `<div class="app-shell">
    ${renderSidebar()}
    <main class="main-area">
      ${renderTopbar()}
      <div class="page-content">${view === 'overview' ? renderOverview() : view === 'applications' ? renderApplications() : renderData()}</div>
    </main>
    ${drawerApplicationId ? renderDrawer(drawerApplicationId) : ''}
    ${modal ? renderModal() : ''}
    <div id="toast" class="toast" aria-live="polite"></div>
    <input id="importInput" type="file" accept="application/json,.json" hidden />
    <input id="colorSchemeImportInput" type="file" accept="application/json,.json" hidden />
  </div>`;
  bindEvents();
}

function renderSidebar() {
  const total = Core.visibleApplications(state).length;
  return `<aside class="sidebar">
    <div class="brand"><span class="brand-mark">秋</span><div><strong>秋招助手</strong><small>Autumn Desk</small></div></div>
    <div class="workspace-label">MY WORKSPACE</div>
    <nav class="nav-list">
      <button class="nav-item ${view === 'overview' ? 'active' : ''}" data-view="overview"><span class="nav-icon">◒</span>秋招全景</button>
      <button class="nav-item ${view === 'applications' ? 'active' : ''}" data-view="applications"><span class="nav-icon">▤</span>全部投递 <em>${total}</em></button>
      <button class="nav-item ${view === 'data' ? 'active' : ''}" data-view="data"><span class="nav-icon">◫</span>数据与安全</button>
    </nav>
    <div class="sidebar-spacer"></div>
    <div class="safety-note"><span>⌁</span><div><strong>数据只在本机</strong><p>自动保存 · 随时导出备份</p></div></div>
    <div class="sidebar-footer">秋招助手 <span>v${Core.APP_VERSION}</span></div>
  </aside>`;
}

function renderTopbar() {
  const titles = { overview: ['秋招全景', '保持节奏，记录每一次进展。'], applications: ['投递记录', '所有机会都在这里，清晰可追溯。'], data: ['数据与安全', '备份、恢复与本地数据管理。'] };
  const [title, subtitle] = titles[view];
  const dark = currentTheme() === 'dark';
  return `<header class="topbar"><div><div class="eyebrow">${view === 'overview' ? '2026 AUTUMN RECRUITMENT' : 'AUTUMN DESK'}</div><h1>${title}</h1><p>${subtitle}</p></div><div class="top-actions"><label class="scheme-picker"><span class="scheme-swatch" aria-hidden="true"></span><select id="colorScheme" aria-label="选择配色方案">${colorSchemes.map(scheme => `<option value="${scheme.id}" ${scheme.id === colorScheme ? 'selected' : ''}>${esc(scheme.label)}</option>`).join('')}</select></label><button class="theme-toggle" type="button" data-action="toggleTheme" aria-pressed="${dark}" title="切换为${dark ? '浅色' : '深色'}模式"><span aria-hidden="true">${dark ? '☾' : '☀'}</span>${dark ? '深色' : '浅色'}</button><button class="button ghost" data-action="export">导出备份</button><button class="button primary" data-action="new">＋ 新增投递</button></div></header>`;
}

function renderOverview() {
  const apps = Core.visibleApplications(state);
  const interviewCount = apps.filter(a => ['一面', '二面', '三面', 'HR 面'].includes(a.status)).length;
  const offerCount = apps.filter(a => a.status === 'Offer').length;
  const progressing = apps.filter(a => a.status !== '拒绝').length;
  const recent = state.applications.flatMap(application => application.history.map(event => ({ application, event }))).sort((a, b) => b.event.timestamp.localeCompare(a.event.timestamp)).slice(0, 6);
  const maxCount = Math.max(1, ...Core.STATUSES.map(status => apps.filter(a => a.status === status).length));
  return `<section class="overview">
    <div class="welcome-row"><div><span class="date-chip">${new Intl.DateTimeFormat('zh-CN', { dateStyle: 'full' }).format(new Date())}</span><h2>你好，今天也向前一步。</h2></div></div>
    <div class="stats-grid">
      ${statCard('总投递', apps.length, '自开始记录以来', 'total', '↗')}
      ${statCard('推进中', progressing, '尚未结束的机会', 'progress', '◔')}
      ${statCard('面试中', interviewCount, '正在进行的面试', 'interview', '◎')}
      ${statCard('Offer', offerCount, '值得庆祝的时刻', 'offer', '★')}
    </div>
    <div class="overview-grid">
      <section class="panel funnel-panel"><div class="panel-heading"><div><span class="section-kicker">PIPELINE</span><h3>状态分布</h3></div><button class="text-button" data-view="applications">查看全部 →</button></div><div class="funnel-list">${Core.STATUSES.map(status => { const count = apps.filter(a => a.status === status).length; return `<div class="funnel-row"><span class="funnel-label">${statusBadge(status, true)}</span><div class="bar-track"><div class="bar tone-${Core.STATUS_META[status].tone}" style="width:${Math.max(count ? 8 : 0, count / maxCount * 100)}%"></div></div><strong>${count}</strong></div>`; }).join('')}</div></section>
      <section class="panel recent-panel"><div class="panel-heading"><div><span class="section-kicker">ACTIVITY</span><h3>最近动态</h3></div><span class="muted">${state.applications.reduce((total, app) => total + app.history.length, 0)} 条记录</span></div><div class="activity-list">${recent.length ? recent.map(renderActivity).join('') : emptyState('还没有动态记录', '新增一条投递，开始你的秋招旅程。') }</div></section>
    </div>
    ${renderTodayTip()}
  </section>`;
}

function statCard(title, value, desc, tone, icon) { return `<div class="stat-card ${tone}"><div class="stat-icon">${icon}</div><div class="stat-title">${title}</div><div class="stat-value">${value}</div><div class="stat-desc">${desc}</div></div>`; }

function renderTodayTip() { return `<div class="tip-card"><div class="tip-mark">✦</div><div><span class="section-kicker">A LITTLE REMINDER</span><p>投递不是一次性的动作，给每个机会留下一点记录，回头就能看见自己的成长。</p></div><span class="tip-decoration">✳</span></div>`; }

const FIELD_PRESENTATION = {
  base: { label: 'Base 地', renderer: 'generic' }, website: { label: '投递网址', renderer: 'generic' }, applicationDate: { label: '投递日期', renderer: 'generic' }, status: { label: '状态', renderer: 'status' }, channel: { label: '投递渠道', renderer: 'generic' }, priority: { label: '优先级', renderer: 'priority' }, note: { label: '备注', renderer: 'generic' }
};
function eventTitle(event) { return event.type === 'created' ? '创建投递' : event.type === 'soft_deleted' ? '删除投递' : event.type === 'restored' ? '恢复投递' : event.field === 'status' ? '状态变更' : event.field === 'priority' ? '优先级变更' : `修改了${FIELD_PRESENTATION[event.field]?.label || event.field}`; }
function eventSummary(event, application) { return event.type === 'created' ? `已记录「${application.position}」` : event.type === 'soft_deleted' ? '将该投递移入已删除' : event.type === 'restored' ? '恢复了该投递' : event.field === 'status' ? '更新了状态' : event.field === 'priority' ? '更新了优先级' : `修改了${FIELD_PRESENTATION[event.field]?.label || event.field}`; }
function eventTone(event) { return event.type === 'soft_deleted' ? 'rejected' : event.type === 'restored' ? 'offer' : event.field === 'status' ? Core.STATUS_META[event.to]?.tone || 'activity' : 'activity'; }
function renderActivity(item) {
  const { application, event } = item;
  const content = `<span class="activity-dot ${eventTone(event)}"></span><span class="activity-copy"><strong>${esc(application.company)}<em>${esc(application.position)}</em></strong><span>${esc(eventSummary(event, application))}</span></span><time>${Core.formatDateTime(event.timestamp)}</time>`;
  return `<button class="activity-item" data-application="${esc(application.id)}">${content}</button>`;
}

const SORT_COLUMNS = [
  { key: 'company', label: '公司 / 岗位' },
  { key: 'base', label: 'Base 地' },
  { key: 'channel', label: '渠道' },
  { key: 'applicationDate', label: '投递日期' },
  { key: 'status', label: '当前状态' },
  { key: 'updatedAt', label: '最后更新' },
  { key: 'priority', label: '优先级' }
];

function sortRuleFor(key) { return sortRules.find(rule => rule.key === key); }
function sortHeader(column) {
  const rule = sortRuleFor(column.key);
  const direction = rule ? (rule.direction === 'asc' ? '升序' : '降序') : '未排序';
  const marker = rule ? `<span class="sort-marker ${rule.direction}">${rule.direction === 'asc' ? '↑' : '↓'}<sup>${sortRules.indexOf(rule) + 1}</sup></span>` : '<span class="sort-marker">↕</span>';
  const priorityHint = rule ? `第 ${sortRules.indexOf(rule) + 1} 排序级；仅当前面排序级相同时参与比较。` : '点击加入组合排序；先选择的列优先级更高。';
  return `<button class="sort-button ${rule ? 'is-sorted' : ''}" type="button" data-sort="${column.key}" aria-label="按${column.label}${direction}排序" title="${priorityHint} 点击切换升序、降序或取消排序">${esc(column.label)}${marker}</button>`;
}

function sortDescription() {
  if (!sortRules.length) return '默认按最近更新排列';
  const labels = new Map(SORT_COLUMNS.map(column => [column.key, column.label]));
  return sortRules.map((rule, index) => `${index + 1}. ${labels.get(rule.key)}${rule.direction === 'asc' ? '↑' : '↓'}`).join(' · ');
}

function filteredApplications() {
  let apps = state.applications.filter(app => showDeleted || !app.deletedAt);
  const needle = search.trim().toLocaleLowerCase();
  if (needle) apps = apps.filter(app => [app.company, app.position, app.base, app.note, app.channel, app.priority].join(' ').toLocaleLowerCase().includes(needle));
  // Preserve the familiar "recently updated" view until the user creates a
  // custom combination of column sorts.
  const rules = sortRules.length ? sortRules : [{ key: 'updatedAt', direction: 'desc' }];
  return Core.sortApplications(apps, rules);
}

function renderApplications() {
  const apps = filteredApplications();
  const activeSortDescription = sortDescription();
  return `<section class="applications-page"><div class="list-intro"><div><span class="section-kicker">YOUR PIPELINE</span><h2>全部投递 <span>${Core.visibleApplications(state).length}</span></h2></div><p>在列表行末统一编辑，详情页专注回看每个机会的完整轨迹。</p></div>
    <div class="toolbar"><label class="search-box"><span>⌕</span><input id="searchInput" value="${esc(search)}" placeholder="搜索公司、岗位或备注" /></label><span class="sort-hint">${activeSortDescription}</span><button class="filter-toggle ${showDeleted ? 'on' : ''}" data-action="toggleDeleted">${showDeleted ? '✓ 显示已删除' : '显示已删除'}</button><button class="reset-sort" data-action="resetSort" ${sortRules.length ? '' : 'disabled'} title="清除所有自定义排序">↺ 重置排序</button></div>
    <div class="table-panel"><div class="table-head">${SORT_COLUMNS.map(sortHeader).join('')}<span></span></div>${apps.length ? apps.map(renderApplicationRow).join('') : emptyState('没有找到匹配的投递', search ? '试试调整搜索关键词。' : '点击右上角，记录你的第一条投递。')}</div>
    </section>`;
}

function renderApplicationRow(app) {
  const deleted = !!app.deletedAt;
  const tone = Core.STATUS_META[app.status]?.tone || 'slate';
  const priority = app.priority || '中';
  return `<div class="table-row tone-row-${tone} ${deleted ? 'deleted-row' : ''}"><div class="company-cell"><button class="company-name" data-application="${esc(app.id)}" title="${esc(app.company)}">${esc(app.company)}</button><span title="${esc(app.position)}">${esc(app.position)}${deleted ? ' · 已删除' : ''}</span></div><div class="cell muted base-cell" title="${esc(app.base || '—')}">${esc(app.base || '—')}</div><div class="cell channel-cell" title="${esc(app.channel || '官网')}">${esc(app.channel || '官网')}</div><div class="cell date-cell">${Core.formatDate(app.applicationDate)}</div><div class="cell status-cell">${deleted ? '<span class="deleted-label">已删除</span>' : statusBadge(app.status, true)}</div><div class="cell muted updated-cell">${Core.formatDateTime(app.updatedAt)}</div><div class="cell priority-cell">${priorityBadge(priority)}</div><div class="row-actions">${deleted ? `<button class="icon-button green-icon" title="恢复投递" aria-label="恢复投递" data-action="restore" data-id="${esc(app.id)}">↺</button><button class="icon-button danger-icon" title="彻底删除" aria-label="彻底删除" data-action="purge" data-id="${esc(app.id)}">×</button>` : `${applicationLink(app)}<button class="icon-button" title="编辑投递" aria-label="编辑投递" data-action="edit" data-id="${esc(app.id)}">✎</button><button class="icon-button danger-icon" title="删除投递" aria-label="删除投递" data-action="delete" data-id="${esc(app.id)}">×</button>`}</div></div>`;
}

function renderData() {
  return `<section class="data-page"><div class="list-intro"><div><span class="section-kicker">LOCAL FIRST</span><h2>数据与安全</h2></div><p>所有数据都保存在当前浏览器中，不会上传到任何服务器。</p></div><div class="data-grid"><section class="panel data-card"><div class="data-card-icon blue-icon">⇩</div><h3>导出完整备份</h3><p>将投递记录、完整历史和设置保存为一个 JSON 文件。建议定期备份。</p><button class="button primary" data-action="export">导出备份文件</button></section><section class="panel data-card"><div class="data-card-icon violet-icon">⇧</div><h3>导入备份</h3><p>仅校验完整的 JSON 备份才会替换当前数据。导入前请先导出当前数据。</p><button class="button secondary" data-action="import">选择备份文件</button></section></div><section class="panel appearance-panel"><div><span class="section-kicker">APPEARANCE</span><h3>配色方案配置</h3><p>当前使用「${esc(activeColorScheme().label)}」。配色独立于投递备份，可单独迁移或编辑。</p></div><div class="appearance-actions"><button class="button secondary" data-action="exportColorSchemes">导出配色</button><button class="button ghost" data-action="importColorSchemes">导入配色</button></div></section><section class="storage-note"><span>✓</span><div><strong>当前存储状态正常</strong><p>本地状态包含 ${state.applications.length} 条投递和 ${state.applications.reduce((total, app) => total + app.history.length, 0)} 条历史事件。</p></div></section></section>`;
}

function renderDrawer(applicationId) {
  const app = appFor(applicationId);
  if (!app) return '';
  const events = Core.applicationEvents(state, app.id);
  return `<div class="drawer-backdrop" data-action="closeDrawer"></div><aside class="drawer"><div class="drawer-head"><div><span class="company-avatar">${esc(app.company.slice(0, 1))}</span><div class="drawer-title"><span class="section-kicker">APPLICATION DETAIL</span><h2>${esc(app.company)}</h2></div></div><button class="close-button" data-action="closeDrawer">×</button></div><div class="drawer-body"><section class="drawer-section"><div class="section-title"><h3>投递信息</h3><span>仅此岗位</span></div><p class="drawer-readonly-hint">此处仅供查看；请在投递列表行末编辑。</p><article class="drawer-app ${app.deletedAt ? 'deleted-card' : ''}"><div class="drawer-app-top"><strong>${esc(app.position)}</strong>${app.deletedAt ? '<span class="deleted-label">已删除</span>' : statusBadge(app.status, true)}</div><dl class="drawer-facts"><div><dt>投递日期</dt><dd>${Core.formatDate(app.applicationDate)}</dd></div></dl><div class="drawer-note-block"><span>备注</span><p class="drawer-note ${app.note ? '' : 'is-empty'}">${esc(app.note || '暂无备注')}</p></div></article></section><section class="drawer-section timeline-section"><div class="section-title"><h3>完整时间线</h3><span>${events.length} 条记录</span></div><div class="timeline">${events.length ? events.map(event => `<div class="timeline-item timeline-tone-${eventTone(event)}"><span class="timeline-line"></span><span class="timeline-dot ${event.type === 'field_changed' && ['status', 'priority'].includes(event.field) ? 'active' : ''}"></span><div class="timeline-content"><div class="timeline-meta"><div><strong>${esc(eventTitle(event))}</strong><span class="timeline-role">${esc(app.position)}</span></div><time>${Core.formatDateTime(event.timestamp)}</time></div><p>${esc(eventSummary(event, app))}</p>${event.type === 'field_changed' && event.field === 'status' ? `<div class="change-pills">${statusBadge(event.from, true)}<span>→</span>${statusBadge(event.to, true)}</div>` : event.type === 'field_changed' && event.field === 'priority' ? `<div class="change-pills">${priorityBadge(event.from)}<span>→</span>${priorityBadge(event.to)}</div>` : ''}</div></div>`).join('') : '<div class="empty-inline">还没有历史事件。</div>'}</div></section></div></aside>`;
}

function renderModal() {
  const app = modal.mode === 'edit' ? appFor(modal.id) : null;
  const values = modal.mode === 'edit' ? { company: app.company, website: app.website || '', priority: app.priority || '中', channel: app.channel || '官网', position: app.position, base: app.base, applicationDate: app.applicationDate, status: app.status, note: app.note } : { company: '', website: '', priority: '中', channel: '官网', position: '', base: '', applicationDate: today(), status: '已投递', note: '' };
  const priorityField = `<label>优先级<select name="priority">${priorityOptions(values.priority)}</select></label>`;
  const channelField = `<label>投递渠道<select name="channel">${channelOptions(values.channel)}</select></label>`;
  return `<div class="modal-backdrop" data-action="closeModal"><section class="modal" role="dialog" aria-modal="true" aria-labelledby="modalTitle"><div class="modal-head"><div><span class="section-kicker">${modal.mode === 'edit' ? 'EDIT APPLICATION' : 'NEW APPLICATION'}</span><h2 id="modalTitle">${modal.mode === 'edit' ? '编辑投递' : '记录一条新投递'}</h2></div><button class="close-button" data-action="closeModal">×</button></div><form id="applicationForm"><div class="form-grid"><label class="full">公司名称<input name="company" value="${esc(values.company)}" ${modal.mode === 'edit' ? 'disabled' : ''} required placeholder="例如：字节跳动" /></label><label>岗位名称<input name="position" value="${esc(values.position)}" ${modal.mode === 'edit' ? 'disabled' : ''} required placeholder="例如：产品经理" /></label><label>Base 地<input name="base" value="${esc(values.base)}" placeholder="例如：北京" /></label><label>投递日期<input type="date" name="applicationDate" value="${esc(values.applicationDate)}" required /></label><label>当前状态<select name="status">${selectOptions(values.status)}</select></label>${priorityField}${channelField}<label class="full">投递网址<input type="url" name="website" value="${esc(values.website)}" placeholder="https://..." /><small>按岗位保存；同一公司不同岗位可填写不同网址。</small></label><label class="full">备注<textarea name="note" rows="3" placeholder="记录内推人、进展、准备事项等">${esc(values.note)}</textarea></label></div><div class="modal-foot"><button type="button" class="button ghost" data-action="closeModal">取消</button><button type="submit" class="button primary">${modal.mode === 'edit' ? '保存修改' : '创建投递'}</button></div></form></section></div>`;
}

function emptyState(title, desc) { return `<div class="empty-state"><div class="empty-icon">○</div><strong>${title}</strong><p>${desc}</p></div>`; }

function bindEvents() {
  root.querySelectorAll('[data-view]').forEach(button => button.addEventListener('click', () => { view = button.dataset.view; render(); }));
  root.querySelectorAll('[data-application]').forEach(button => button.addEventListener('click', () => { drawerApplicationId = button.dataset.application; render(); }));
  root.querySelectorAll('[data-action]').forEach(button => button.addEventListener('click', event => {
    if (button.classList.contains('modal-backdrop')) return;
    if (button.classList.contains('drawer-backdrop') && event.target !== event.currentTarget) return;
    handleAction(button.dataset.action, button.dataset.id);
  }));
  root.querySelectorAll('[data-sort]').forEach(button => button.addEventListener('click', () => toggleSort(button.dataset.sort)));
  root.querySelector('#searchInput')?.addEventListener('input', event => { search = event.target.value; renderApplicationsInPlace(); });
  root.querySelector('#colorScheme')?.addEventListener('change', event => {
    if (colorSchemes.some(scheme => scheme.id === event.target.value)) {
      colorScheme = event.target.value;
      saveColorScheme();
      render();
    }
  });
  root.querySelector('#applicationForm')?.addEventListener('submit', submitApplication);
  root.querySelector('#importInput')?.addEventListener('change', importFile);
  root.querySelector('#colorSchemeImportInput')?.addEventListener('change', importColorSchemes);
}

function bindTableEvents() {
  const table = root.querySelector('.table-panel');
  if (!table) return;
  table.querySelectorAll('[data-application]').forEach(button => button.addEventListener('click', () => { drawerApplicationId = button.dataset.application; render(); }));
  table.querySelectorAll('[data-action]').forEach(button => button.addEventListener('click', () => handleAction(button.dataset.action, button.dataset.id)));
  table.querySelectorAll('[data-sort]').forEach(button => button.addEventListener('click', () => toggleSort(button.dataset.sort)));
}

function renderApplicationsInPlace() { const panel = root.querySelector('.table-panel'); if (panel) panel.outerHTML = `<div class="table-panel"><div class="table-head">${SORT_COLUMNS.map(sortHeader).join('')}<span></span></div>${filteredApplications().map(renderApplicationRow).join('') || emptyState('没有找到匹配的投递', '试试调整搜索条件。')}</div>`; bindTableEvents(); }

function toggleSort(key) {
  sortRules = Core.nextSortRules(sortRules, key);
  render();
}

function handleAction(action, itemId) {
  if (action === 'toggleTheme') {
    state.settings = { ...(state.settings || {}), theme: currentTheme() === 'dark' ? 'light' : 'dark' };
    save();
    render();
    toast(`已切换为${currentTheme() === 'dark' ? '深色' : '浅色'}模式`);
    return;
  }
  if (action === 'new') { modal = { mode: 'new' }; render(); return; }
  if (action === 'edit') { modal = { mode: 'edit', id: itemId }; render(); return; }
  if (action === 'closeModal') { modal = null; render(); return; }
  if (action === 'closeDrawer') { drawerApplicationId = null; render(); return; }
  if (action === 'delete') {
    const app = appFor(itemId);
    if (app && window.confirm(`确定删除「${app.company} · ${app.position}」吗？\n历史记录会保留，也可以从“显示已删除”中恢复。`)) { Core.softDeleteApplication(state, itemId); save(); modal = null; toast('已删除投递，历史记录仍然保留'); render(); }
  }
  if (action === 'restore') { Core.restoreApplication(state, itemId); save(); toast('投递已恢复'); render(); }
  if (action === 'purge') {
    const app = appFor(itemId);
    if (app && window.confirm(`彻底删除「${app.company} · ${app.position}」吗？\n该投递及其完整时间线将被永久清除，无法恢复。`)) {
      Core.purgeApplication(state, itemId); save();
      if (drawerApplicationId === itemId) drawerApplicationId = null;
      toast('投递及其完整历史已彻底删除'); render();
    }
  }
  if (action === 'toggleDeleted') { showDeleted = !showDeleted; render(); }
  if (action === 'resetSort') { sortRules = []; render(); }
  if (action === 'export') exportBackup();
  if (action === 'import') root.querySelector('#importInput')?.click();
  if (action === 'exportColorSchemes') exportColorSchemes();
  if (action === 'importColorSchemes') root.querySelector('#colorSchemeImportInput')?.click();
}

function submitApplication(event) {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(event.currentTarget).entries());
  try {
    if (data.website && !safeUrl(data.website)) throw new Error('网址仅支持以 http:// 或 https:// 开头的地址');
    if (modal.mode === 'edit') {
      const at = new Date().toISOString();
      Core.updateApplication(state, modal.id, data, at);
      save(); toast('投递信息已更新'); modal = null; render(); return;
    }
    Core.createApplication(state, data);
    save(); toast('投递已记录'); modal = null; view = 'applications'; render();
  } catch (error) { toast(error.message || '保存失败', 'error'); }
}

function exportBackup() {
  try {
    const backup = Backup.buildBackup(state);
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = `autumn-desk-backup-${backup.exportedAt.slice(0, 10)}.json`; link.click(); URL.revokeObjectURL(url); toast('备份文件已导出');
  } catch (error) { toast(`当前数据存在异常，无法导出：${error.message || '校验失败'}`, 'error'); }
}

function exportColorSchemes() {
  const config = ColorSchemes.colorSchemeFile(colorSchemes);
  const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = `autumn-desk-color-schemes-${config.exportedAt.slice(0, 10)}.json`; link.click(); URL.revokeObjectURL(url); toast('配色配置已导出');
}

async function importColorSchemes(event) {
  const file = event.target.files?.[0]; event.target.value = '';
  if (!file) return;
  try {
    const imported = ColorSchemes.parseColorSchemeFile(JSON.parse(await file.text()));
    colorSchemeOverrides = imported;
    colorSchemes = ColorSchemes.mergeColorSchemes(colorSchemeOverrides);
    if (!colorSchemes.some(scheme => scheme.id === colorScheme)) colorScheme = colorSchemes[0].id;
    saveColorSchemeOverrides(); saveColorScheme(); render(); toast(`已导入 ${imported.length} 套配色`);
  } catch (error) { toast(`配色导入失败：${error.message || '文件格式不正确'}`, 'error'); }
}

async function importFile(event) {
  const file = event.target.files?.[0]; event.target.value = '';
  if (!file) return;
  try {
    const parsed = JSON.parse(await file.text());
    const imported = Backup.parseBackup(parsed);
    if (!window.confirm(`确认导入这份备份吗？\n将恢复 ${imported.applications.length} 条投递，并替换当前数据。请确认你已导出当前数据。`)) return;
    state = imported;
    save(); drawerApplicationId = null; toast('备份已恢复'); render();
  } catch (error) { toast(`导入失败：${error.message || '文件格式不正确'}`, 'error'); }
}

function toast(message, type = 'success') { const item = root.querySelector('#toast'); if (!item) return; item.textContent = message; item.className = `toast show ${type}`; clearTimeout(toastTimer); toastTimer = setTimeout(() => item.classList.remove('show'), 2800); }

document.addEventListener('keydown', event => { if (event.key === 'Escape' && !modal && drawerApplicationId) { drawerApplicationId = null; render(); } });

render();
