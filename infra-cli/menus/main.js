// menus/main.js — Main menu

import chalk from 'chalk';
import * as clack from '@clack/prompts';
import gradient from 'gradient-string';

import { printBanner, handleCancel } from '../lib/ui.js';
import { composeDir } from '../lib/compose.js';
import { dockerMenu } from './docker.js';
import { devToolsMenu } from './devtools.js';
import { systemHealthMenu } from './health.js';

export async function mainMenu() {
  while (true) {
    printBanner();
    clack.intro(gradient(['#00f0ff', '#00ff9d'])('Menú Principal'));

    const action = await clack.select({
      message: 'Selecciona una categoría:',
      options: [
        { value: 'docker',   label: '🐳  Docker Infra',   hint: 'Bases de datos · Colas · Búsqueda · Monitoreo' },
        { value: 'devtools', label: '🛠️   Dev Tools',       hint: 'Port Killer · Doctor · Cheat Sheet' },
        { value: 'health',   label: '📈  System Health',   hint: 'RAM · CPU · Espacio Docker' },
        { value: 'exit',     label: '🚪  Salir',           hint: 'Ctrl+C en cualquier momento' },
      ],
    });

    if (handleCancel(action) || action === 'exit') {
      clack.outro(chalk.greenBright('¡Hasta luego! 👋  Feliz programación.'));
      process.exit(0);
    }

    if (action === 'docker')   await dockerMenu(mainMenu);
    if (action === 'devtools') await devToolsMenu(mainMenu);
    if (action === 'health')   await systemHealthMenu(mainMenu);
  }
}
