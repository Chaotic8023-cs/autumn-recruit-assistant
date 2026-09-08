import { APP_VERSION, SCHEMA_VERSION } from './schema.js';
import { clone } from './core.js';
import { validateBackupEnvelope, validateState } from './validation.js';

const now = () => new Date().toISOString();

export function buildBackup(state, exportedAt = now()) {
  validateState(state);
  return {
    type: 'autumn-desk-backup', schemaVersion: SCHEMA_VERSION, appVersion: APP_VERSION, exportedAt,
    data: { applications: clone(state.applications), settings: clone(state.settings) }
  };
}

export function parseBackup(candidate) {
  validateBackupEnvelope(candidate);
  return clone({ schemaVersion: candidate.schemaVersion, applications: candidate.data.applications, settings: candidate.data.settings });
}
