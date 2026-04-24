// menus/health.js — System Health menu

import chalk from 'chalk';
import * as clack from '@clack/prompts';
import os from 'os';

import { printBanner, log, pause, handleCancel, ramBar } from '../lib/ui.js';
import { run } from '../lib/compose.js';

export async function systemHealthMenu(backFn) {
  while (true) {
    printBanner('System Health');
    clack.intro(chalk.blueBright('📈  Salud del Sistema y Docker'));

    const freeGB  = (os.freemem()  / 1024 ** 3).toFixed(2);
    const totalGB = (os.totalmem() / 1024 ** 3).toFixed(2);
    const usedPct = ((os.totalmem() - os.freemem()) / os.totalmem()) * 100;

    clack.note(
      [
        `🧠  ${chalk.gray('RAM libre:')}    ${chalk.green(freeGB + ' GB')} de ${chalk.white(totalGB + ' GB')}`,
        `📊  ${chalk.gray('Uso RAM:')}      ${ramBar(usedPct)}`,
        `⚡  ${chalk.gray('CPUs:')}         ${chalk.yellow(os.cpus().length + ' cores')} — ${chalk.gray(os.cpus()[0].model)}`,
        `🖥️   ${chalk.gray('Plataforma:')}  ${chalk.white(os.platform())} ${os.arch()}`,
        `⏱️   ${chalk.gray('Uptime:')}      ${chalk.cyan(formatUptime(os.uptime()))}`,
      ].join('\n'),
      '🖥️  Recursos del Sistema'
    );

    log.info('Espacio en disco de Docker:');
    log.blank();
    run('docker system df', false);
    log.blank();

    const action = await clack.select({
      message: 'Opciones:',
      options: [
        { value: 'prune',        label: '🧹 Limpiar Caché de Docker (Prune)', hint: 'Libera imágenes y contenedores no usados' },
        { value: 'prune_all',    label: '🗑️  Limpieza Completa (Todo)',        hint: '⚠️  Incluye volúmenes no usados' },
        { value: 'refresh',      label: '🔁 Refrescar',                       hint: 'Actualizar datos del sistema' },
        { value: 'back',         label: '⬅️  Volver al menú principal' },
      ],
    });

    if (handleCancel(action) || action === 'back') return backFn?.();

    if (action === 'refresh') continue;

    if (action === 'prune') {
      log.warn('Borrará: contenedores detenidos, redes no usadas, imágenes colgantes.');
      const ok = await clack.confirm({ message: '¿Ejecutar limpieza estándar?', initialValue: false });
      if (!clack.isCancel(ok) && ok) {
        const spin = clack.spinner();
        spin.start('Limpiando caché de Docker...');
        run('docker system prune -f', true);
        spin.stop(chalk.greenBright('✔  Limpieza completada.'));
      }
      await pause();
    }

    if (action === 'prune_all') {
      log.warn('⚠️  LIMPIEZA TOTAL: incluye VOLÚMENES no usados por ningún contenedor activo.');
      const ok = await clack.confirm({ message: chalk.red('¿Ejecutar limpieza COMPLETA con volúmenes?'), initialValue: false });
      if (!clack.isCancel(ok) && ok) {
        const spin = clack.spinner();
        spin.start('Ejecutando limpieza total de Docker...');
        run('docker system prune -af --volumes', true);
        spin.stop(chalk.greenBright('✔  Limpieza total completada.'));
      }
      await pause();
    }
  }
}

function formatUptime(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}
