import test from 'node:test';
import assert from 'node:assert/strict';
import * as Colors from '../src/color-schemes.js';

test('默认主题使用三字名称，并为亮暗模式提供独立的状态和优先级语义色', () => {
  const schemes = Colors.BUILT_IN_COLOR_SCHEMES;
  assert.deepEqual(schemes.map(item => item.label), ['苹果蓝', '夜幕紫', '森林绿']);
  const statusTokens = ['Submitted', 'Assessment', 'WrittenTest', 'FirstInterview', 'SecondInterview', 'ThirdInterview', 'HrInterview', 'Offer', 'Rejected'];
  for (const scheme of schemes) {
    for (const appearance of ['light', 'dark']) {
      const palette = scheme[appearance];
      for (const token of statusTokens) {
        for (const suffix of ['Fg', 'Soft', 'Fill']) assert.match(palette[`status${token}${suffix}`], /^#[0-9a-f]{6,8}$/i, `${scheme.label} ${appearance} 缺少 status${token}${suffix}`);
      }
      for (const key of ['priorityLowFg', 'priorityMediumFg', 'priorityHighFg', 'priorityLowSoft', 'priorityMediumSoft', 'priorityHighSoft']) {
        assert.match(palette[key], /^#[0-9a-f]{6,8}$/i, `${scheme.label} ${appearance} 缺少 ${key}`);
      }
      assert.notEqual(palette.priorityLowFg, palette.priorityMediumFg);
      assert.notEqual(palette.priorityMediumFg, palette.priorityHighFg);
      assert.notEqual(palette.statusAssessmentFg, palette.blue, `${scheme.label} ${appearance} 的测评色不得复用主交互色`);
    }
    assert.notEqual(scheme.light.blue, scheme.dark.blue, `${scheme.label} 应针对暗色模式调校主色`);
  }
});

test('配色配置可导出、校验并合并为可选主题', () => {
  const file = Colors.colorSchemeFile([{ id: 'custom-blue', label: '自定义蓝', light: { blue: '#1166cc' }, dark: { blue: '#77aaff' } }]);
  assert.equal(file.version, '1.0');
  const imported = Colors.parseColorSchemeFile(file);
  const schemes = Colors.mergeColorSchemes(imported);
  const custom = schemes.find(item => item.id === 'custom-blue');
  assert.equal(custom.light.blue, '#1166cc');
  assert.equal(custom.dark.blue, '#77aaff');
  assert.equal(custom.light.canvas, '#f5f5f7');
});

test('配色配置拒绝未知文件与不安全颜色值', () => {
  assert.throws(() => Colors.parseColorSchemeFile({ type: 'other', version: '1.0', schemes: [] }), /配色文件/);
  assert.throws(() => Colors.parseColorSchemeFile({ type: Colors.COLOR_SCHEME_FILE_TYPE, version: '1.0', schemes: [{ id: 'unsafe', label: '不安全', light: { blue: 'url(javascript:)' }, dark: {} }] }), /配色值无效/);
  assert.throws(() => Colors.parseColorSchemeFile({ type: Colors.COLOR_SCHEME_FILE_TYPE, version: '1.0', schemes: [{ id: 'old-token', label: '旧 token', light: { statusSlateFg: '#123456' }, dark: {} }] }), /token 无效/);
});
