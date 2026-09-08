import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const source = name => readFile(resolve(root, 'src', name), 'utf8');
const [template, app, schema, core, validation, storage, backup, colors, css] = await Promise.all([
  readFile(resolve(root, 'src/index.html'), 'utf8'),
  source('app.js'), source('schema.js'), source('core.js'), source('validation.js'), source('storage.js'), source('backup.js'), source('color-schemes.js'), source('styles.css')
]);
const stripExports = value => value.replace(/^export /gm, '');
const schemaExports = ['SCHEMA_VERSION', 'APP_VERSION', 'STATUSES', 'PRIORITIES', 'CHANNELS', 'EVENT_TYPES', 'EDITABLE_FIELDS', 'FIELD_SPECS', 'APPLICATION_DEFAULTS', 'normalizeIdentityPart', 'applicationBusinessKey'];
const coreExports = ['APPLICATION_DEFAULTS', 'CHANNELS', 'EDITABLE_FIELDS', 'EVENT_TYPES', 'FIELD_SPECS', 'PRIORITIES', 'SCHEMA_VERSION', 'STATUSES', 'applicationBusinessKey', 'APP_VERSION', 'STATUS_META', 'clone', 'id', 'emptyState', 'createApplication', 'updateApplication', 'softDeleteApplication', 'restoreApplication', 'purgeApplication', 'visibleApplications', 'applicationEvents', 'SORT_KEYS', 'sortApplications', 'nextSortRules', 'formatDateTime', 'formatDate'];
const validationExports = ['validateHistoryEvent', 'validateApplication', 'validateState', 'validateBackupEnvelope'];
const storageExports = ['STATE_STORAGE_KEY', 'loadState', 'saveState'];
const backupExports = ['buildBackup', 'parseBackup'];
const facade = (body, exports) => `(() => {\n${body}\nreturn { ${exports.join(', ')} };\n})()`;
const inlineSchema = facade(stripExports(schema), schemaExports);
const inlineCore = facade(stripExports(core).replace(/import \{ ([^}]+) \} from '\.\/schema\.js';/, 'const { $1 } = Schema;').replace(/^\{ APPLICATION_DEFAULTS.*\};\n/m, ''), coreExports);
const inlineValidation = facade(stripExports(validation).replace(/import \{ ([^}]+) \} from '\.\/schema\.js';/, 'const { $1 } = Schema;'), validationExports);
const inlineStorage = facade(stripExports(storage).replace("import { emptyState } from './core.js';", 'const { emptyState } = Core;'), storageExports);
const inlineBackup = facade(stripExports(backup).replace("import { APP_VERSION, SCHEMA_VERSION } from './schema.js';", 'const { APP_VERSION, SCHEMA_VERSION } = Schema;').replace("import { clone } from './core.js';", 'const { clone } = Core;').replace("import { validateBackupEnvelope, validateState } from './validation.js';", 'const { validateBackupEnvelope, validateState } = Validation;'), backupExports);
const inlineColors = stripExports(colors);
const imports = "import * as Core from './core.js';\nimport * as ColorSchemes from './color-schemes.js';\nimport * as Storage from './storage.js';\nimport * as Backup from './backup.js';\nimport { validateState } from './validation.js';";
const inlineApp = app.replace(imports, `const Schema = ${inlineSchema};\nconst Core = ${inlineCore};\nconst Validation = ${inlineValidation};\nconst Storage = ${inlineStorage};\nconst Backup = ${inlineBackup};\nconst { validateState } = Validation;\nconst ColorSchemes = (() => {\n${inlineColors}\nreturn { COLOR_SCHEME_FILE_TYPE, COLOR_SCHEME_FILE_VERSION, BUILT_IN_COLOR_SCHEMES, mergeColorSchemes, parseColorSchemeFile, colorSchemeFile, applyColorScheme };\n})();`);
const html = template.replace(/\s*<script type="module" src="\.\/app\.js"><\/script>/, `<style>${css}</style><script>${inlineApp}</script>`);
const dist = resolve(root, 'autumn-recruit-assistant.html');
await mkdir(dirname(dist), { recursive: true });
await writeFile(dist, html, 'utf8');
console.log(`built ${dist}`);
