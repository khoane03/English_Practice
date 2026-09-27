import { existsSync, readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const configPath = resolve(root, 'src/app/core/config/cloudinary.config.generated.ts');
const values = {};

for (const filename of ['.env', '.env.local']) {
  const path = resolve(root, filename);
  if (!existsSync(path)) {
    continue;
  }

  for (const line of readFileSync(path, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^\s*(?:export\s+)?(CLOUDINARY_CLOUD_NAME|CLOUDINARY_UPLOAD_PRESET)\s*=\s*(.*?)\s*$/);
    if (match) {
      values[match[1]] = match[2].replace(/^(['"])(.*)\1$/, '$2');
    }
  }
}

for (const key of ['CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_UPLOAD_PRESET']) {
  if (process.env[key] !== undefined) {
    values[key] = process.env[key];
  }
}

const cloudName = (values.CLOUDINARY_CLOUD_NAME ?? '').trim();
const uploadPreset = (values.CLOUDINARY_UPLOAD_PRESET ?? '').trim();

if (uploadPreset && !cloudName) {
  throw new Error('CLOUDINARY_CLOUD_NAME is required when CLOUDINARY_UPLOAD_PRESET is configured.');
}

if (cloudName && !/^[a-zA-Z0-9_-]+$/.test(cloudName)) {
  throw new Error('CLOUDINARY_CLOUD_NAME contains invalid characters.');
}

mkdirSync(dirname(configPath), { recursive: true });
writeFileSync(
  configPath,
  `export const cloudinaryEnvironment = ${JSON.stringify({ cloudName, uploadPreset }, null, 2)} as const;\n`,
);
const status = cloudName && uploadPreset ? 'configured' : cloudName ? 'cloud name only' : 'not configured';
console.log(`Generated Cloudinary configuration (${status}).`);
