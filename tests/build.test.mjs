import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');

test('构建产物是可独立打开的单文件，并包含可解析的内联脚本', () => {
  execFileSync(process.execPath, ['scripts/build-single.mjs'], { cwd: root, stdio: 'pipe' });
  const html = readFileSync(resolve(root, 'autumn-recruit-assistant.html'), 'utf8');
  assert.doesNotMatch(html, /<script type="module" src="\.\/app\.js"><\/script>/);
  const script = html.match(/<script>([\s\S]*)<\/script>/)?.[1];
  assert.ok(script, '构建产物应包含内联应用脚本');
  assert.doesNotThrow(() => new Function(script));
  assert.match(html, /const Core = \(\(\) =>/);
  assert.match(html, /const ColorSchemes = \(\(\) =>/);
  assert.match(html, /return \{[^}]*applicationEvents[^}]*\};/);
  assert.match(html, /return \{[^}]*purgeApplication[^}]*\};/);
});
