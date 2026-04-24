// lib/ui.js — Shared UI utilities: banner, logger, pause, theme

import chalk from 'chalk';
import boxen from 'boxen';
import figlet from 'figlet';
import gradient from 'gradient-string';
import * as clack from '@clack/prompts';
import os from 'os';

// ─── THEME ────────────────────────────────────────────────
export const theme = {
  primary:   (t) => chalk.cyanBright(t),
  secondary: (t) => chalk.greenBright(t),
  accent:    (t) => chalk.magentaBright(t),
  dim:       (t) => chalk.gray(t),
  highlight: (t) => chalk.yellow(t),
  danger:    (t) => chalk.redBright(t),
  white:     (t) => chalk.white.bold(t),
};

// ─── LOGGER BADGES ────────────────────────────────────────
export const log = {
  info:  (msg) => console.log(`${chalk.bgBlueBright.bold.black('  INFO  ')} ${chalk.blueBright(msg)}`),
  ready: (msg) => console.log(`${chalk.bgGreenBright.bold.black(' READY  ')} ${chalk.greenBright(msg)}`),
  warn:  (msg) => console.log(`${chalk.bgYellow.bold.black('  WARN  ')} ${chalk.yellow(msg)}`),
  error: (msg) => console.log(`${chalk.bgRed.bold.white('  ERROR ')} ${chalk.red(msg)}`),
  step:  (msg) => console.log(`${chalk.bgMagentaBright.bold.black('  STEP  ')} ${chalk.magentaBright(msg)}`),
  blank: ()    => console.log(''),
};

// ─── BANNER ───────────────────────────────────────────────
const GRADIENT_COLORS = ['#00f0ff', '#00ff9d', '#a78bfa', '#00f0ff'];

export function printBanner(subtitle = '') {
  console.clear();

  const ascii = figlet.textSync('INFRA  CLI', { font: 'ANSI Shadow' });
  const coloredArt = gradient(GRADIENT_COLORS).multiline(ascii);

  const hostname = os.hostname();
  const uptime   = formatUptime(os.uptime());

  const body =
    coloredArt +
    '\n\n' +
    chalk.gray('        Infraestructura de Desarrollo · Docker · DevTools') +
    (subtitle
      ? '\n        ' + chalk.yellow('❯ ') + chalk.white(subtitle)
      : '');

  const box = boxen(body, {
    padding:          { top: 1, bottom: 1, left: 4, right: 4 },
    margin:           { top: 1, left: 2 },
    borderStyle:      'round',
    borderColor:      'cyan',
    title:            gradient(GRADIENT_COLORS)(` ✦  Infra CLI  v1.0.0  ·  ${hostname}  ·  up ${uptime}  ✦ `),
    titleAlignment:   'center',
  });

  console.log(box);
}

// ─── SECTION HEADER ───────────────────────────────────────
export function printSection(icon, title, color = 'cyan') {
  const line = '─'.repeat(50);
  console.log('\n' + chalk[color](`  ${icon}  ${title}`));
  console.log(chalk.gray(`  ${line}`));
}

// ─── CLACK HELPERS ────────────────────────────────────────
export function handleCancel(value, msg = 'Operación cancelada.') {
  if (clack.isCancel(value)) {
    clack.cancel(chalk.yellow(msg));
    return true;
  }
  return false;
}

export async function pause(msg = '↩  Presiona Enter para continuar...') {
  await clack.text({ message: chalk.gray(msg) }).catch(() => {});
}

// ─── FORMAT HELPERS ───────────────────────────────────────
function formatUptime(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export function ramBar(usedPct, width = 20) {
  const used = Math.round((usedPct / 100) * width);
  const pct  = usedPct.toFixed(1);
  const color = usedPct > 80 ? chalk.red : usedPct > 50 ? chalk.yellow : chalk.green;
  const bar = color('█'.repeat(used)) + chalk.gray('░'.repeat(width - used));
  return `[${bar}] ${pct}%`;
}

export function separator() {
  return { value: '__sep__', label: chalk.gray('─────────────────────────────') };
}
