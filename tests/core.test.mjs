import test from 'node:test';
import assert from 'node:assert/strict';
import * as Core from '../src/core.js';
import * as Backup from '../src/backup.js';

const createdAt = '2026-09-01T10:00:00.000Z';
function setup(input = {}) {
  const state = Core.emptyState();
  const app = Core.createApplication(state, { company: '星河科技', position: '产品经理', applicationDate: '2026-09-01', ...input }, createdAt);
  return { state, app };
}

test('创建 Application 使用新 schema、默认值和 created history', () => {
  const { state, app } = setup();
  assert.deepEqual(Object.keys(state).sort(), ['applications', 'schemaVersion', 'settings']);
  assert.deepEqual(Object.keys(app).sort(), ['applicationDate', 'base', 'channel', 'company', 'createdAt', 'deletedAt', 'history', 'id', 'note', 'position', 'priority', 'status', 'updatedAt', 'website']);
  assert.match(app.id, /^app_/);
  assert.equal(app.channel, '官网');
  assert.equal(app.priority, '中');
  assert.deepEqual(app.history[0], { id: app.history[0].id, operationId: app.history[0].operationId, type: 'created', field: null, timestamp: createdAt, from: null, to: null });
});

test('创建校验公司、岗位、枚举和规范化业务唯一键', () => {
  const state = Core.emptyState();
  assert.throws(() => Core.createApplication(state, { company: '', position: '产品', applicationDate: '2026-09-01' }), /公司名称/);
  assert.throws(() => Core.createApplication(state, { company: '甲', position: '', applicationDate: '2026-09-01' }), /岗位名称/);
  assert.throws(() => Core.createApplication(state, { company: '甲', position: '产品', applicationDate: '2026-09-01', status: '四面' }), /状态/);
  Core.createApplication(state, { company: 'ＡＣＭＥ　科技', position: '产品 经理', applicationDate: '2026-09-01' });
  assert.throws(() => Core.createApplication(state, { company: 'acme 科技', position: '产品 经理', applicationDate: '2026-09-01' }), /同名岗位/);
});

test('一次编辑为每个真实字段创建原子 history 并共享 operationId', () => {
  const { state, app } = setup({ base: '北京', note: '' });
  Core.updateApplication(state, app.id, { base: '上海', status: '一面', priority: '高', note: '准备作品集' }, '2026-09-02T10:00:00.000Z');
  const changes = app.history.slice(1);
  assert.equal(changes.length, 4);
  assert.deepEqual(changes.map(event => event.field), ['base', 'status', 'priority', 'note']);
  assert.ok(changes.every(event => event.type === 'field_changed'));
  assert.equal(new Set(changes.map(event => event.operationId)).size, 1);
  assert.deepEqual(changes.find(event => event.field === 'status').from, '已投递');
  assert.deepEqual(changes.find(event => event.field === 'status').to, '一面');
  assert.equal(app.updatedAt, '2026-09-02T10:00:00.000Z');
});

test('未修改不更新 updatedAt；身份字段不可修改；备注也统一走 field_changed', () => {
  const { state, app } = setup({ note: '准备笔试' });
  const originalUpdatedAt = app.updatedAt;
  Core.updateApplication(state, app.id, { base: '', note: ' 准备笔试 ' }, '2026-09-02T10:00:00.000Z');
  assert.equal(app.history.length, 1);
  assert.equal(app.updatedAt, originalUpdatedAt);
  assert.throws(() => Core.updateApplication(state, app.id, { company: '新公司' }), /不能修改/);
  assert.throws(() => Core.updateApplication(state, app.id, { position: '新岗位' }), /不能修改/);
  Core.updateApplication(state, app.id, { note: '' });
  assert.deepEqual(app.history.at(-1).field, 'note');
  assert.deepEqual(app.history.at(-1).from, '准备笔试');
  assert.deepEqual(app.history.at(-1).to, '');
});

test('软删除、恢复与彻底删除保留既定生命周期行为', () => {
  const { state, app } = setup();
  Core.softDeleteApplication(state, app.id, '2026-09-02T10:00:00.000Z');
  assert.equal(app.deletedAt, '2026-09-02T10:00:00.000Z');
  assert.equal(app.history.at(-1).type, 'soft_deleted');
  assert.throws(() => Core.updateApplication(state, app.id, { base: '上海' }), /已删除/);
  assert.throws(() => Core.purgeApplication(state, Core.createApplication(state, { company: '乙', position: '运营', applicationDate: '2026-09-01' }).id), /先将投递/);
  Core.restoreApplication(state, app.id, '2026-09-03T10:00:00.000Z');
  assert.equal(app.deletedAt, null);
  assert.equal(app.history.at(-1).type, 'restored');
  Core.softDeleteApplication(state, app.id);
  assert.equal(Core.purgeApplication(state, app.id), true);
  assert.equal(state.applications.some(item => item.id === app.id), false);
});

test('排序仍按业务状态和优先级顺序逐级比较', () => {
  const applications = [
    { id: 'a', company: '甲', position: '岗位', applicationDate: '2026-09-02', priority: '高', status: 'Offer' },
    { id: 'b', company: '乙', position: '岗位', applicationDate: '2026-09-01', priority: '高', status: '已投递' },
    { id: 'c', company: '丙', position: '岗位', applicationDate: '2026-09-02', priority: '低', status: '一面' }
  ];
  assert.deepEqual(Core.sortApplications(applications, [{ key: 'applicationDate', direction: 'asc' }, { key: 'priority', direction: 'asc' }]).map(app => app.id), ['b', 'c', 'a']);
  assert.deepEqual(Core.sortApplications(applications, [{ key: 'status', direction: 'asc' }]).map(app => app.id), ['b', 'c', 'a']);
});

test('组合排序以选择顺序作为优先级，取消规则后后续优先级立即前移', () => {
  let rules = [];
  rules = Core.nextSortRules(rules, 'status');
  rules = Core.nextSortRules(rules, 'priority');
  rules = Core.nextSortRules(rules, 'applicationDate');
  assert.deepEqual(rules, [
    { key: 'status', direction: 'asc' }, { key: 'priority', direction: 'asc' }, { key: 'applicationDate', direction: 'asc' }
  ]);
  rules = Core.nextSortRules(rules, 'priority');
  assert.equal(rules[1].direction, 'desc');
  rules = Core.nextSortRules(rules, 'priority');
  assert.deepEqual(rules, [{ key: 'status', direction: 'asc' }, { key: 'applicationDate', direction: 'asc' }]);

  const applications = [
    { id: 'a', company: '甲', position: '产品', status: '一面', priority: '高', applicationDate: '2026-09-03' },
    { id: 'b', company: '乙', position: '产品', status: '一面', priority: '低', applicationDate: '2026-09-01' },
    { id: 'c', company: '丙', position: '产品', status: '已投递', priority: '中', applicationDate: '2026-09-02' }
  ];
  assert.deepEqual(Core.sortApplications(applications, rules).map(app => app.id), ['c', 'b', 'a']);
});

test('次级优先级只在主排序值相同时决胜，状态和优先级遵循预设顺序', () => {
  const applications = [
    { id: 'c1p1', company: 'c1', position: 'p1', priority: '高', status: '一面', applicationDate: '2026-09-02', updatedAt: '2026-09-02T10:00:00.000Z' },
    { id: 'c2p2', company: 'c2', position: 'p2', priority: '低', status: '已投递', applicationDate: '2026-09-01', updatedAt: '2026-09-01T10:00:00.000Z' },
    { id: 'c1p2', company: 'c1', position: 'p2', priority: '低', status: '一面', applicationDate: '2026-09-03', updatedAt: '2026-09-03T10:00:00.000Z' }
  ];
  // “公司 / 岗位”本身是唯一业务键，因此它作为第 1 级时，优先级不会覆盖它。
  assert.deepEqual(Core.sortApplications(applications, [{ key: 'company', direction: 'asc' }, { key: 'priority', direction: 'asc' }]).map(app => app.id), ['c1p1', 'c1p2', 'c2p2']);
  assert.deepEqual(Core.sortApplications(applications, [{ key: 'priority', direction: 'asc' }, { key: 'company', direction: 'asc' }]).map(app => app.id), ['c1p2', 'c2p2', 'c1p1']);
  assert.deepEqual(Core.sortApplications(applications, [{ key: 'status', direction: 'asc' }, { key: 'priority', direction: 'asc' }]).map(app => app.id), ['c2p2', 'c1p2', 'c1p1']);
  assert.deepEqual(Core.sortApplications(applications, [{ key: 'applicationDate', direction: 'desc' }]).map(app => app.id), ['c1p2', 'c1p1', 'c2p2']);
  assert.deepEqual(Core.sortApplications(applications, [{ key: 'updatedAt', direction: 'asc' }]).map(app => app.id), ['c2p2', 'c1p1', 'c1p2']);
});

test('组合排序在字段更新、软删除和恢复后按当前数据即时重算', () => {
  const { state, app: first } = setup({ priority: '高' });
  const second = Core.createApplication(state, { company: '月海科技', position: '算法工程师', applicationDate: '2026-09-01', priority: '低' }, '2026-09-01T11:00:00.000Z');
  const rules = [{ key: 'priority', direction: 'asc' }];
  assert.deepEqual(Core.sortApplications(Core.visibleApplications(state), rules).map(app => app.id), [second.id, first.id]);
  Core.updateApplication(state, first.id, { priority: '低' }, '2026-09-02T10:00:00.000Z');
  assert.deepEqual(Core.sortApplications(Core.visibleApplications(state), rules).map(app => app.id), [first.id, second.id]);
  Core.softDeleteApplication(state, first.id);
  assert.deepEqual(Core.sortApplications(Core.visibleApplications(state), rules).map(app => app.id), [second.id]);
  Core.restoreApplication(state, first.id);
  assert.deepEqual(Core.sortApplications(state.applications, rules).map(app => app.id), [first.id, second.id]);
});

test('新版 backup 严格校验封装、业务键和 history', () => {
  const { state, app } = setup();
  Core.updateApplication(state, app.id, { status: '一面' });
  const backup = Backup.buildBackup(state, '2026-09-08T10:00:00.000Z');
  assert.equal(Core.APP_VERSION, '1.0');
  assert.equal(state.schemaVersion, '1.0');
  assert.equal(backup.schemaVersion, '1.0');
  assert.equal(backup.appVersion, '1.0');
  const restored = Backup.parseBackup(backup);
  assert.deepEqual(restored, state);
  const invalidType = structuredClone(backup); invalidType.type = 'other';
  assert.throws(() => Backup.parseBackup(invalidType), /类型/);
  const invalidField = structuredClone(backup); invalidField.data.applications[0].history.at(-1).field = 'salary';
  assert.throws(() => Backup.parseBackup(invalidField), /field 无效/);
  const missingFrom = structuredClone(backup); delete missingFrom.data.applications[0].history.at(-1).from;
  assert.throws(() => Backup.parseBackup(missingFrom), /field \/ from \/ to/);
  const duplicate = structuredClone(backup); duplicate.data.applications.push({ ...duplicate.data.applications[0], id: 'another' });
  assert.throws(() => Backup.parseBackup(duplicate), /重复的公司/);
});

test('备份只接受最终的字符串版本 1.0', () => {
  const { state } = setup();
  const backup = Backup.buildBackup(state, '2026-09-08T10:00:00.000Z');
  backup.schemaVersion = 1;
  assert.throws(() => Backup.parseBackup(backup), /Schema 版本不兼容/);
});
