// lib/compose.js — Docker Compose helpers

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import yaml from 'yaml';
import { log } from './ui.js';

const FALLBACK_DIR = '/Users/jesusruizlopez/Documents/DESARROLLO/UPLAPH/DGM/PROYECTOS/dbs';

function resolveComposeDir() {
  const cwd = process.cwd();
  if (fs.existsSync(path.join(cwd, 'docker-compose.yml'))) return cwd;
  if (fs.existsSync(path.join(FALLBACK_DIR, 'docker-compose.yml'))) return FALLBACK_DIR;
  log.error('No se encontró docker-compose.yml.');
  process.exit(1);
}

export const composeDir  = resolveComposeDir();
export const composeFile = path.join(composeDir, 'docker-compose.yml');

export function run(cmd, silent = false) {
  try {
    return execSync(cmd, {
      cwd:      composeDir,
      encoding: 'utf-8',
      stdio:    silent ? 'pipe' : 'inherit',
    });
  } catch {
    if (!silent) log.error(`Error ejecutando: ${cmd}`);
    return null;
  }
}

export function getParsed() {
  return yaml.parse(fs.readFileSync(composeFile, 'utf8'));
}

export function saveParsed(parsed) {
  fs.writeFileSync(composeFile, yaml.stringify(parsed));
}

export function getServiceNames() {
  try {
    return Object.keys(getParsed().services || {});
  } catch {
    return [];
  }
}

export function getServiceEnv(service) {
  return getParsed().services?.[service]?.environment ?? null;
}

export function getServiceRestart(service) {
  return getParsed().services?.[service]?.restart ?? 'no';
}

export function setServiceRestart(service, policy) {
  const parsed = getParsed();
  if (parsed.services?.[service]) {
    parsed.services[service].restart = policy;
    saveParsed(parsed);
  }
}

export function getContainerId(service) {
  return run(`docker compose ps -q ${service}`, true)?.trim() ?? null;
}
