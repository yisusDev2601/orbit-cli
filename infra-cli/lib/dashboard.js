// lib/dashboard.js — Parsed Docker status dashboard

import chalk from 'chalk';
import { execSync } from 'child_process';
import { composeDir, getServiceNames } from './compose.js';

// ─── Fetch container data ───────────────────────────────────
function fetchContainers() {
  const FORMAT = [
    '{"id":"{{.ID}}",',
    '"name":"{{.Names}}",',
    '"image":"{{.Image}}",',
    '"status":"{{.Status}}",',
    '"state":"{{.State}}",',
    '"ports":"{{.Ports}}",',
    '"created":"{{.RunningFor}}"}',
  ].join('');

  try {
    const raw = execSync(
      `docker compose ps --format '${FORMAT}'`,
      { cwd: composeDir, encoding: 'utf-8' }
    ).trim();

    if (!raw) return [];

    return raw
      .split('\n')
      .filter(Boolean)
      .map(line => {
        try { return JSON.parse(line); }
        catch { return null; }
      })
      .filter(Boolean);
  } catch {
    return [];
  }
}

// ─── Fetch live CPU/RAM stats (no-stream, ~300ms) ──────────
function fetchStats(ids) {
  if (!ids.length) return {};
  try {
    const raw = execSync(
      `docker stats --no-stream --format '{"id":"{{.ID}}","cpu":"{{.CPUPerc}}","mem":"{{.MemUsage}}","memPct":"{{.MemPerc}}"}' ${ids.join(' ')}`,
      { encoding: 'utf-8' }
    ).trim();

    const result = {};
    raw.split('\n').filter(Boolean).forEach(line => {
      try {
        const obj = JSON.parse(line);
        result[obj.id.substring(0, 12)] = obj;
      } catch {}
    });
    return result;
  } catch {
    return {};
  }
}

// ─── State formatters ──────────────────────────────────────
function stateIcon(state) {
  switch (state?.toLowerCase()) {
    case 'running': return chalk.greenBright('● running ');
    case 'exited':  return chalk.red('● exited  ');
    case 'paused':  return chalk.yellow('● paused  ');
    default:        return chalk.gray('● unknown ');
  }
}

function formatPorts(ports) {
  if (!ports) return chalk.gray('—');
  // Extract unique host ports from port mappings
  const matches = [...ports.matchAll(/0\.0\.0\.0:(\d+)->/g)];
  if (!matches.length) return chalk.gray('—');
  return matches
    .map(m => chalk.cyan(`:${m[1]}`))
    .join(chalk.gray(', '));
}

function cpuBar(cpuStr, width = 8) {
  const val = parseFloat(cpuStr) || 0;
  const filled = Math.round((val / 100) * width);
  const color = val > 80 ? chalk.red : val > 40 ? chalk.yellow : chalk.green;
  return color('▪'.repeat(filled)) + chalk.gray('▫'.repeat(width - filled)) + chalk.gray(` ${cpuStr.padStart(6)}`);
}

// ─── Column helpers ────────────────────────────────────────
function pad(str, len) {
  const plain = str.replace(/\x1B\[[0-9;]*m/g, '');
  const diff = len - plain.length;
  return str + ' '.repeat(Math.max(0, diff));
}

// ─── Main render ──────────────────────────────────────────
export function renderDashboard(withStats = false) {
  const containers = fetchContainers();
  const services   = getServiceNames();

  // Services defined but not running
  const runningNames = containers.map(c => c.name);
  const stoppedOnly  = services.filter(s => !runningNames.some(n => n.includes(s)));

  // Optionally fetch stats for running containers
  const runningIds = containers
    .filter(c => c.state === 'running')
    .map(c => c.id);
  const stats = withStats ? fetchStats(runningIds) : {};

  // ── Header ──────────────────────────────────────────────
  const divider = chalk.gray('  ' + '─'.repeat(withStats ? 110 : 80));

  const headerCols = [
    chalk.cyan.bold('SERVICE'.padEnd(22)),
    chalk.cyan.bold('STATUS'.padEnd(14)),
    chalk.cyan.bold('PORTS'.padEnd(26)),
    chalk.cyan.bold('UPTIME'.padEnd(18)),
  ];
  if (withStats) {
    headerCols.push(chalk.cyan.bold('CPU'.padEnd(16)));
    headerCols.push(chalk.cyan.bold('MEM'));
  }

  console.log('');
  console.log(divider);
  console.log('  ' + headerCols.join('  '));
  console.log(divider);

  // ── Running containers ──────────────────────────────────
  containers.forEach(c => {
    const name    = c.name.replace(/^[^_]+_/, '');        // strip compose prefix
    const statRow = stats[c.id] ?? null;

    const cols = [
      pad(chalk.white.bold(name), 22),
      pad(stateIcon(c.state), 14),
      pad(formatPorts(c.ports), 26),
      pad(chalk.gray(c.created || '—'), 18),
    ];

    if (withStats) {
      cols.push(
        pad(c.state === 'running' && statRow ? cpuBar(statRow.cpu) : chalk.gray('—'.padEnd(14)), 16)
      );
      cols.push(
        c.state === 'running' && statRow
          ? chalk.magenta(statRow.mem)
          : chalk.gray('—')
      );
    }

    console.log('  ' + cols.join('  '));
  });

  // ── Stopped services (defined in compose but not started) ─
  if (stoppedOnly.length) {
    console.log(divider);
    stoppedOnly.forEach(s => {
      const cols = [
        pad(chalk.gray(s), 22),
        pad(chalk.gray('● stopped '), 14),
        pad(chalk.gray('—'), 26),
        pad(chalk.gray('—'), 18),
      ];
      if (withStats) {
        cols.push(pad(chalk.gray('—'), 16));
        cols.push(chalk.gray('—'));
      }
      console.log('  ' + cols.join('  '));
    });
  }

  console.log(divider);

  // ── Summary ─────────────────────────────────────────────
  const running = containers.filter(c => c.state === 'running').length;
  const total   = services.length;
  const stopped = total - running;

  console.log('');
  console.log(
    '  ' +
    chalk.greenBright(`● ${running} corriendo`) + '   ' +
    chalk.red(`● ${stopped} detenidos`) + '   ' +
    chalk.gray(`de ${total} servicios configurados`)
  );
  console.log('');
}
