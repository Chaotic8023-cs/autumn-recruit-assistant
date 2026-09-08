import { EDITABLE_FIELDS, EVENT_TYPES, FIELD_SPECS, SCHEMA_VERSION, applicationBusinessKey } from './schema.js';

function isObject(value) { return value !== null && typeof value === 'object' && !Array.isArray(value); }
function hasOwn(object, key) { return Object.prototype.hasOwnProperty.call(object, key); }
function isValidTimestamp(value) { return typeof value === 'string' && value.trim() !== '' && !Number.isNaN(new Date(value).getTime()); }
function isValidDay(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00`);
  return !Number.isNaN(date.getTime()) && [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-') === value;
}
function assertEnum(field, value, prefix = '') {
  const spec = FIELD_SPECS[field];
  if (spec?.type === 'enum' && !spec.values.includes(value)) throw new Error(`${prefix}${field} 无效：${value}`);
}

export function validateHistoryEvent(event, applicationIndex = '') {
  const prefix = applicationIndex === '' ? '历史事件' : `第 ${applicationIndex + 1} 条投递的历史事件`;
  if (!isObject(event)) throw new Error(`${prefix}必须是对象`);
  if (typeof event.id !== 'string' || !event.id.trim()) throw new Error(`${prefix}缺少 id`);
  if (typeof event.operationId !== 'string' || !event.operationId.trim()) throw new Error(`${prefix}缺少 operationId`);
  if (!EVENT_TYPES.includes(event.type)) throw new Error(`${prefix}类型无效：${event.type}`);
  if (!isValidTimestamp(event.timestamp)) throw new Error(`${prefix}时间无效`);
  if (!hasOwn(event, 'field') || !hasOwn(event, 'from') || !hasOwn(event, 'to')) throw new Error(`${prefix}缺少 field / from / to`);
  if (event.type === 'field_changed') {
    if (!EDITABLE_FIELDS.includes(event.field)) throw new Error(`历史事件 field 无效：${event.field}`);
    if (typeof event.from !== 'string' || typeof event.to !== 'string') throw new Error('历史事件 field_changed 的 from / to 必须是字符串');
    if (event.from === event.to) throw new Error('历史事件的 from 与 to 不能相同');
    assertEnum(event.field, event.from, '历史事件 ');
    assertEnum(event.field, event.to, '历史事件 ');
  } else if (event.field !== null || event.from !== null || event.to !== null) throw new Error(`${prefix}的 ${event.type} 事件不能包含字段变更`);
}

export function validateApplication(application, index = '') {
  const prefix = index === '' ? '投递' : `第 ${index + 1} 条投递`;
  if (!isObject(application)) throw new Error(`${prefix}必须是对象`);
  const fields = ['id', 'company', 'position', 'base', 'website', 'applicationDate', 'status', 'channel', 'priority', 'note', 'createdAt', 'updatedAt'];
  for (const field of fields) if (typeof application[field] !== 'string') throw new Error(`${prefix}缺少 ${field}`);
  if (!application.id.trim() || !application.company.trim() || !application.position.trim()) throw new Error(`${prefix}缺少 id、company 或 position`);
  if (!isValidDay(application.applicationDate)) throw new Error(`${prefix}的 applicationDate 无效`);
  if (!isValidTimestamp(application.createdAt) || !isValidTimestamp(application.updatedAt)) throw new Error(`${prefix}的创建或更新时间无效`);
  if (application.deletedAt !== null && !isValidTimestamp(application.deletedAt)) throw new Error(`${prefix}的 deletedAt 无效`);
  if (!Array.isArray(application.history)) throw new Error(`${prefix}缺少 history`);
  for (const field of EDITABLE_FIELDS) assertEnum(field, application[field], `${prefix} `);
  const eventIds = new Set();
  application.history.forEach(event => { validateHistoryEvent(event, index); if (eventIds.has(event.id)) throw new Error(`${prefix}存在重复历史事件 ID`); eventIds.add(event.id); });
}

export function validateState(candidate) {
  if (!isObject(candidate)) throw new Error('状态必须是 JSON 对象');
  if (candidate.schemaVersion !== SCHEMA_VERSION) throw new Error('状态 Schema 版本不兼容');
  if (!Array.isArray(candidate.applications)) throw new Error('状态缺少 applications');
  if (!isObject(candidate.settings)) throw new Error('状态缺少 settings');
  if (Object.keys(candidate).some(key => !['schemaVersion', 'applications', 'settings'].includes(key))) throw new Error('状态包含不支持的字段');
  if (!['light', 'dark'].includes(candidate.settings.theme)) throw new Error('主题设置无效');
  const ids = new Set(), keys = new Set(), historyIds = new Set();
  candidate.applications.forEach((application, index) => {
    validateApplication(application, index);
    if (ids.has(application.id)) throw new Error('存在重复的投递 ID');
    ids.add(application.id);
    const key = applicationBusinessKey(application);
    if (keys.has(key)) throw new Error(`存在重复的公司 / 岗位：${application.company} / ${application.position}`);
    keys.add(key);
    application.history.forEach(event => { if (historyIds.has(event.id)) throw new Error('存在重复的历史事件 ID'); historyIds.add(event.id); });
  });
  return true;
}

export function validateBackupEnvelope(candidate) {
  if (!isObject(candidate)) throw new Error('备份必须是 JSON 对象');
  if (candidate.type !== 'autumn-desk-backup') throw new Error('备份文件类型不正确');
  if (candidate.schemaVersion !== SCHEMA_VERSION) throw new Error('备份 Schema 版本不兼容');
  if (typeof candidate.appVersion !== 'string' || !candidate.appVersion.trim()) throw new Error('备份缺少 appVersion');
  if (!isValidTimestamp(candidate.exportedAt)) throw new Error('备份导出时间无效');
  if (!isObject(candidate.data)) throw new Error('备份缺少 data');
  if (Object.keys(candidate.data).some(key => !['applications', 'settings'].includes(key))) throw new Error('备份 data 包含不支持的字段');
  validateState({ ...candidate.data, schemaVersion: candidate.schemaVersion });
  return true;
}
