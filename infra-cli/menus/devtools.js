// menus/devtools.js — Developer Tools menu

import chalk from 'chalk';
import { execSync } from 'child_process';
import * as clack from '@clack/prompts';
import os from 'os';

import { printBanner, log, pause, handleCancel } from '../lib/ui.js';

export async function devToolsMenu(backFn) {
  while (true) {
    printBanner('Developer Tools');
    clack.intro(chalk.blueBright('🛠️   Asistente del Desarrollador'));

    const action = await clack.select({
      message: 'Selecciona una herramienta:',
      options: [
        { value: 'portkiller', label: '🔪 Port Killer',  hint: 'Mata el proceso que secuestra un puerto' },
        { value: 'doctor',     label: '🩺 Doctor',        hint: 'Versiones de tu stack e IP local' },
        { value: 'cheatsheet', label: '📚 Cheat Sheet',   hint: 'Soluciones rápidas a problemas comunes' },
        { value: 'back',       label: '⬅️  Volver' },
      ],
    });

    if (handleCancel(action) || action === 'back') return backFn?.();

    switch (action) {
      case 'portkiller': await portKiller(); break;
      case 'doctor':     await doctor();     break;
      case 'cheatsheet': cheatSheet(); await pause(); break;
    }
  }
}

async function portKiller() {
  const port = await clack.text({
    message: '¿Qué puerto está bloqueado?',
    placeholder: '3000',
    validate: v => isNaN(Number(v)) ? 'Ingresa un número válido.' : undefined,
  });
  if (handleCancel(port)) return;

  try {
    const pids = execSync(`lsof -t -i:${port}`, { encoding: 'utf-8' }).trim().split('\n').filter(Boolean);
    if (pids.length) {
      clack.note(
        `${chalk.gray('Puerto:')} ${chalk.yellow(port)}\n${chalk.gray('PIDs:')}   ${chalk.red(pids.join(', '))}`,
        '🔪 Puerto Secuestrado'
      );
      const ok = await clack.confirm({ message: chalk.red('¿Matar estos procesos?'), initialValue: false });
      if (!clack.isCancel(ok) && ok) {
        pids.forEach(pid => { try { execSync(`kill -9 ${pid}`); } catch {} });
        log.ready(`Puerto ${port} liberado.`);
      }
    } else {
      log.ready(`El puerto ${port} está libre. ✓`);
    }
  } catch { log.ready(`El puerto ${port} está libre.`); }
  await pause();
}

async function doctor() {
  printBanner('Doctor — Diagnóstico');
  const getV = (cmd) => { try { return execSync(cmd, { encoding: 'utf-8' }).trim(); } catch { return chalk.red('No instalado'); } };

  clack.note(
    [
      `⬡  ${chalk.gray('Node.js'.padEnd(10))} ${chalk.greenBright(getV('node -v'))}`,
      `📦  ${chalk.gray('NPM'.padEnd(10))} ${chalk.greenBright(getV('npm -v'))}`,
      `🌿  ${chalk.gray('Git'.padEnd(10))} ${chalk.greenBright(getV('git --version'))}`,
      `🐳  ${chalk.gray('Docker'.padEnd(10))} ${chalk.greenBright(getV('docker --version'))}`,
    ].join('\n'),
    '⚙️  Versiones del Stack'
  );

  const nets = os.networkInterfaces();
  const ipLines = [];
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        ipLines.push(`🌐  ${chalk.gray(name.padEnd(12))} ${chalk.yellow(net.address)}\n    ${chalk.gray(`http://${net.address}:3000  ← desde tu celular`)}`);
      }
    }
  }
  clack.note(ipLines.join('\n\n') || chalk.gray('Sin interfaces detectadas.'), '🌐 Red Local');
  await pause();
}

function cheatSheet() {
  printBanner('Cheat Sheet');
  const items = [
    { t: '¿Caché rota en Next.js?',                    s: 'rm -rf .next/' },
    { t: '¿Deshacer último commit sin perder cambios?', s: 'git reset HEAD~1' },
    { t: '¿Procesos de Node zombies?',                  s: 'killall node' },
    { t: '¿Docker sin espacio en disco?',               s: '→  System Health › Prune' },
    { t: '¿node_modules corrompido?',                   s: 'rm -rf node_modules package-lock.json && npm install' },
    { t: '¿Puerto ocupado?',                            s: '→  Dev Tools › Port Killer' },
    { t: '¿Ver todos los puertos en uso?',              s: 'lsof -i -P | grep LISTEN' },
  ];
  clack.note(
    items.map((i, n) => `${chalk.yellow(`${n + 1}.`)} ${chalk.white(i.t)}\n   ${chalk.greenBright('$ ')}${chalk.greenBright(i.s)}`).join('\n\n'),
    '📚 Soluciones Rápidas'
  );
}
