import { APPLICATION_DEFAULTS, APP_VERSION, CHANNELS, EDITABLE_FIELDS, EVENT_TYPES, FIELD_SPECS, PRIORITIES, SCHEMA_VERSION, STATUSES, applicationBusinessKey } from './schema.js';

export { APPLICATION_DEFAULTS, APP_VERSION, CHANNELS, EDITABLE_FIELDS, EVENT_TYPES, FIELD_SPECS, PRIORITIES, SCHEMA_VERSION, STATUSES, applicationBusinessKey };
export const STATUS_META = {
  '已投递': { tone: 'submitted' }, '测评': { tone: 'assessment' }, '笔试': { tone: 'written-test' },
  '一面': { tone: 'first-interview' }, '二面': { tone: 'second-interview' }, '三面': { tone: 'third-interview' },
  'HR 面': { tone: 'hr-interview' }, 'Offer': { tone: 'offer' }, '拒绝': { tone: 'rejected' }
};

const now = () => new Date().toISOString();
export function clone(value) { return JSON.parse(JSON.stringify(value)); }
export function id(prefix = 'id') {
  const uuid = globalThis.crypto?.randomUUID?.() || `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
  return `${prefix}_${uuid}`;
}
export function emptyState() { return { schemaVersion: SCHEMA_VERSION, applications: [], settings: { theme: 'light' } }; }

function validDay(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00`);
  return !Number.isNaN(date.getTime()) && [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-') === value;
}
function cleanString(value) { return String(value ?? '').trim(); }
function normalizeEditableValue(field, value, fallback) {
  const spec = FIELD_SPECS[field];
  const normalized = cleanString(value === undefined ? fallback : value);
  if (spec.type === 'enum') {
    const result = normalized || spec.default;
    if (!spec.values.includes(result)) throw new Error(`${field === 'status' ? '投递状态' : field === 'channel' ? '投递渠道' : '优先级'}无效：${result}`);
    return result;
  }
  if (spec.type === 'date') {
    if (!validDay(normalized)) throw new Error('投递日期无效');
    return normalized;
  }
  return normalized;
}
function createEvent(type, operationId, timestamp, field = null, from = null, to = null) {
  return { id: id('evt'), operationId, type, field, timestamp, from: clone(from), to: clone(to) };
}
function assertImmutablePatch(app, patch) {
  for (const field of ['id', 'company', 'position', 'createdAt']) {
    if (patch[field] !== undefined && cleanString(patch[field]) !== app[field]) throw new Error('公司名称和岗位名称创建后不能修改');
  }
}

export function createApplication(state, input, at = now()) {
  const company = cleanString(input.company);
  const position = cleanString(input.position);
  if (!company) throw new Error('公司名称不能为空');
  if (!position) throw new Error('岗位名称不能为空');
  const candidate = { company, position };
  if (state.applications.some(app => applicationBusinessKey(app) === applicationBusinessKey(candidate))) throw new Error('该公司已存在同名岗位投递；如需继续使用，请恢复原记录');
  const applicationDate = input.applicationDate === undefined || cleanString(input.applicationDate) === '' ? at.slice(0, 10) : input.applicationDate;
  const app = {
    id: id('app'), company, position,
    base: normalizeEditableValue('base', input.base, APPLICATION_DEFAULTS.base),
    website: normalizeEditableValue('website', input.website, APPLICATION_DEFAULTS.website),
    applicationDate: normalizeEditableValue('applicationDate', applicationDate),
    status: normalizeEditableValue('status', input.status, APPLICATION_DEFAULTS.status),
    channel: normalizeEditableValue('channel', input.channel, APPLICATION_DEFAULTS.channel),
    priority: normalizeEditableValue('priority', input.priority, APPLICATION_DEFAULTS.priority),
    note: normalizeEditableValue('note', input.note, APPLICATION_DEFAULTS.note),
    createdAt: at, updatedAt: at, deletedAt: null, history: []
  };
  if (state.applications.some(item => item.id === app.id)) throw new Error('投递 ID 已存在');
  app.history.push(createEvent('created', id('op'), at));
  state.applications.push(app);
  return app;
}

export function updateApplication(state, applicationId, patch, at = now()) {
  const app = state.applications.find(item => item.id === applicationId);
  if (!app) throw new Error('投递不存在');
  if (app.deletedAt) throw new Error('投递已删除，请先恢复后再编辑');
  assertImmutablePatch(app, patch);
  const changes = EDITABLE_FIELDS.flatMap(field => {
    if (patch[field] === undefined) return [];
    const next = normalizeEditableValue(field, patch[field], app[field]);
    return next === app[field] ? [] : [{ field, from: app[field], to: next }];
  });
  if (!changes.length) return app;
  const operationId = id('op');
  changes.forEach(change => {
    app[change.field] = change.to;
    app.history.push(createEvent('field_changed', operationId, at, change.field, change.from, change.to));
  });
  app.updatedAt = at;
  return app;
}

export function softDeleteApplication(state, applicationId, at = now()) {
  const app = state.applications.find(item => item.id === applicationId);
  if (!app || app.deletedAt) return app;
  app.deletedAt = at; app.updatedAt = at;
  app.history.push(createEvent('soft_deleted', id('op'), at));
  return app;
}

export function restoreApplication(state, applicationId, at = now()) {
  const app = state.applications.find(item => item.id === applicationId);
  if (!app) throw new Error('投递不存在');
  if (!app.deletedAt) return app;
  app.deletedAt = null; app.updatedAt = at;
  app.history.push(createEvent('restored', id('op'), at));
  return app;
}

export function purgeApplication(state, applicationId) {
  const app = state.applications.find(item => item.id === applicationId);
  if (!app) return false;
  if (!app.deletedAt) throw new Error('请先将投递移入已删除，再彻底删除');
  state.applications = state.applications.filter(item => item.id !== applicationId);
  return true;
}

export const visibleApplications = state => state.applications.filter(app => !app.deletedAt);
export const applicationEvents = (state, applicationId) => state.applications.find(app => app.id === applicationId)?.history.slice().sort((a, b) => b.timestamp.localeCompare(a.timestamp)) || [];
export const SORT_KEYS = ['company', 'base', 'channel', 'applicationDate', 'status', 'updatedAt', 'priority'];
const collator = new Intl.Collator('zh-CN', { numeric: true, sensitivity: 'base' });
function sortValue(app, key) {
  if (key === 'company') return `${app.company} ${app.position}`;
  if (key === 'status') return String(STATUSES.indexOf(app.status)).padStart(2, '0');
  if (key === 'priority') return String(PRIORITIES.indexOf(app.priority)).padStart(2, '0');
  return String(app[key] || '');
}
function compareSortValues(left, right, key) {
  // ISO day strings and ISO timestamps have a chronological lexical order.
  // Keep this branch explicit: these columns are dates, not display strings.
  if (key === 'applicationDate' || key === 'updatedAt') return left.localeCompare(right);
  return collator.compare(left, right);
}
export function sortApplications(applications, rules = []) {
  const seen = new Set();
  const validRules = Array.isArray(rules) ? rules.filter(rule => {
    if (!rule || !SORT_KEYS.includes(rule.key) || !['asc', 'desc'].includes(rule.direction) || seen.has(rule.key)) return false;
    seen.add(rule.key);
    return true;
  }) : [];
  return applications.map((application, index) => ({ application, index })).sort((left, right) => {
    for (const rule of validRules) {
      const result = compareSortValues(sortValue(left.application, rule.key), sortValue(right.application, rule.key), rule.key);
      if (result) return rule.direction === 'asc' ? result : -result;
    }
    return left.index - right.index;
  }).map(item => item.application);
}
// The order in this array is the user's selected priority: selecting another
// column appends it, and removing a column naturally shifts later rules up.
export function nextSortRules(rules, key) {
  if (!SORT_KEYS.includes(key)) return Array.isArray(rules) ? rules.slice() : [];
  const normalized = [];
  const seen = new Set();
  for (const rule of Array.isArray(rules) ? rules : []) {
    if (!rule || !SORT_KEYS.includes(rule.key) || !['asc', 'desc'].includes(rule.direction) || seen.has(rule.key)) continue;
    seen.add(rule.key);
    normalized.push({ key: rule.key, direction: rule.direction });
  }
  const index = normalized.findIndex(rule => rule.key === key);
  if (index === -1) return [...normalized, { key, direction: 'asc' }];
  if (normalized[index].direction === 'asc') return normalized.map((rule, ruleIndex) => ruleIndex === index ? { ...rule, direction: 'desc' } : rule);
  return normalized.filter((_, ruleIndex) => ruleIndex !== index);
}
export function formatDateTime(value) { if (!value) return '—'; const date = new Date(value); return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(date); }
export function formatDate(value) { if (!value) return '—'; const date = new Date(`${value}T00:00:00`); return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat('zh-CN', { month: 'short', day: 'numeric' }).format(date); }
