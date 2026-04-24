// menus/service.js — Single service management menu

import chalk from 'chalk';
import { execSync } from 'child_process';
import * as clack from '@clack/prompts';
import open from 'open';

import { log, pause, printBanner, printSection, handleCancel } from '../lib/ui.js';
import { run, composeDir, getContainerId, getServiceEnv } from '../lib/compose.js';
import { SERVICE_UIS, CRED_SERVICES, formatCredNote, getCredential } from '../lib/credentials.js';

export async function serviceMenu(service, backFn) {
  while (true) {
    printBanner(`Servicio  →  ${service}`);
    clack.intro(chalk.magentaBright(`⚙️   ${service}`));

    // Dynamic status badge
    const isRunning = !!getContainerId(service);
    const statusBadge = isRunning
      ? chalk.bgGreenBright.black(' ▶ CORRIENDO ')
      : chalk.bgGray.white(' ■ DETENIDO  ');
    console.log(`   Estado actual: ${statusBadge}\n`);

    const options = [
      {
        value: 'start',
        label: '▶️  Iniciar',
        hint: isRunning ? 'Ya está corriendo' : 'docker compose up -d',
      },
      {
        value: 'stop',
        label: '⏹️  Detener',
        hint: isRunning ? 'docker compose stop' : 'No está corriendo',
      },
      { value: 'restart', label: '🔄 Reiniciar',           hint: 'docker compose restart' },
      { value: 'logs',    label: '📄 Logs en tiempo real', hint: 'Ctrl+C para salir' },
      { value: 'stats',   label: '📈 CPU / RAM en vivo',   hint: 'Ctrl+C para salir' },
      { value: 'env',     label: '🔐 Variables de Entorno', hint: 'Lee desde docker-compose.yml' },
    ];

    if (SERVICE_UIS[service]) {
      options.push({
        value: 'open_ui',
        label: `🌐 Abrir ${SERVICE_UIS[service].label}`,
        hint:  SERVICE_UIS[service].url,
      });
    }

    if (CRED_SERVICES.includes(service)) {
      options.push({
        value: 'creds',
        label: '🔑 Credenciales y URL de conexión',
        hint:  'Copia al portapapeles',
      });
    }

    options.push({ value: 'wipe',  label: '💣 Hard Reset (Borrar datos)',  hint: '⚠️  Irreversible' });
    options.push({ value: 'back',  label: '⬅️  Volver' });

    const action = await clack.select({ message: 'Selecciona una acción:', options });

    if (handleCancel(action) || action === 'back') {
      return backFn?.();
    }

    switch (action) {
      case 'start': {
        const spin = clack.spinner();
        spin.start(`Iniciando ${service}...`);
        run(`docker compose up -d ${service}`, true);
        spin.stop(chalk.greenBright(`✔  ${service} iniciado.`));
        await pause();
        break;
      }
      case 'stop': {
        const spin = clack.spinner();
        spin.start(`Deteniendo ${service}...`);
        run(`docker compose stop ${service}`, true);
        spin.stop(chalk.greenBright(`✔  ${service} detenido.`));
        await pause();
        break;
      }
      case 'restart': {
        const spin = clack.spinner();
        spin.start(`Reiniciando ${service}...`);
        run(`docker compose restart ${service}`, true);
        spin.stop(chalk.greenBright(`✔  ${service} reiniciado.`));
        await pause();
        break;
      }
      case 'logs':
        printSection('📄', `Logs — ${service}`, 'blue');
        log.dim('Streaming de logs activo. Ctrl+C para volver al menú.\n');
        try {
          execSync(`docker compose logs -f --tail=50 ${service}`, { cwd: composeDir, stdio: 'inherit' });
        } catch {}
        break;

      case 'stats': {
        printSection('📈', `CPU / RAM — ${service}`, 'green');
        const id = getContainerId(service);
        if (id) {
          log.dim('Estadísticas en vivo. Ctrl+C para volver al menú.\n');
          try {
            execSync(`docker stats ${id}`, { stdio: 'inherit' });
          } catch {}
        } else {
          log.warn('El contenedor no está corriendo.');
          await pause();
        }
        break;
      }

      case 'env': {
        const envVars = getServiceEnv(service);
        if (envVars) {
          const lines = Array.isArray(envVars)
            ? envVars.map(v => chalk.yellow(v)).join('\n')
            : Object.entries(envVars).map(([k, v]) => `${chalk.yellow(k)}=${chalk.white(v)}`).join('\n');
          clack.note(lines, `🔐 Variables de Entorno — ${service}`);
        } else {
          log.warn('No hay variables de entorno explícitas para este servicio en docker-compose.yml.');
        }
        await pause();
        break;
      }

      case 'open_ui': {
        const ui = SERVICE_UIS[service];
        log.info(`Abriendo ${ui.label} → ${ui.url}`);
        open(ui.url);
        await pause();
        break;
      }

      case 'creds': {
        const note = formatCredNote(service);
        if (note) {
          clack.note(note, `🔑 Credenciales — ${service}`);
          const c = getCredential(service);
          try {
            execSync(`echo "${c.local}" | pbcopy`);
            log.ready('URL (localhost) copiada al portapapeles.');
          } catch {}
        } else {
          log.warn('Sin credenciales registradas para este servicio.');
        }
        await pause();
        break;
      }

      case 'wipe': {
        log.warn(`ADVERTENCIA: Esto borrará todos los datos de ${service} permanentemente.`);
        const ok = await clack.confirm({
          message: chalk.red('¿Confirmas el borrado completo? No hay vuelta atrás.'),
          initialValue: false,
        });
        if (!clack.isCancel(ok) && ok) {
          const spin = clack.spinner();
          spin.start('Borrando contenedor y volumen local...');
          run(`docker compose stop ${service}`, true);
          run(`docker compose rm -f ${service}`, true);
          try { execSync(`rm -rf ${composeDir}/data/${service}`); } catch {}
          spin.stop(chalk.greenBright('✔  Datos borrados. Levanta el servicio para empezar limpio.'));
        } else {
          log.warn('Operación cancelada.');
        }
        await pause();
        break;
      }
    }
  }
}
