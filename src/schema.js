export const SCHEMA_VERSION = '1.0';
export const APP_VERSION = '1.0';

export const STATUSES = ['已投递', '测评', '笔试', '一面', '二面', '三面', 'HR 面', 'Offer', '拒绝'];
export const PRIORITIES = ['低', '中', '高'];
export const CHANNELS = ['官网', '内推', 'boss直聘', '其他'];
export const EVENT_TYPES = ['created', 'field_changed', 'soft_deleted', 'restored'];

export const EDITABLE_FIELDS = ['base', 'website', 'applicationDate', 'status', 'channel', 'priority', 'note'];

export const FIELD_SPECS = {
  base: { type: 'string', default: '' },
  website: { type: 'string', default: '' },
  applicationDate: { type: 'date' },
  status: { type: 'enum', values: STATUSES, default: '已投递' },
  channel: { type: 'enum', values: CHANNELS, default: '官网' },
  priority: { type: 'enum', values: PRIORITIES, default: '中' },
  note: { type: 'string', default: '' }
};

export const APPLICATION_DEFAULTS = {
  base: '', website: '', status: '已投递', channel: '官网', priority: '中', note: '', deletedAt: null
};

export function normalizeIdentityPart(value) {
  return String(value ?? '').trim().replace(/\s+/g, ' ').normalize('NFKC').toLocaleLowerCase();
}

export function applicationBusinessKey(application) {
  return [normalizeIdentityPart(application?.company), normalizeIdentityPart(application?.position)].join('\u0000');
}
