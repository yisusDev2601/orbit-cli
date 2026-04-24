// menus/docker.js — Docker Infra menu

import chalk from 'chalk';
import * as clack from '@clack/prompts';

import { printBanner, log, pause, handleCancel } from '../lib/ui.js';
import { run, getServiceNames, getParsed, saveParsed } from '../lib/compose.js';
import { serviceMenu } from './service.js';

export async function dockerMenu(backFn) {
  while (true) {
    printBanner('Docker Infra');
    clack.intro(chalk.blueBright('🐳  Gestión de Infraestructura Docker'));

    const action = await clack.select({
      message: '¿Qué deseas hacer?',
      options: [
        { value: 'status',      label: '📊 Estado general',              hint: 'docker compose ps' },
        { value: 'start_multi', label: '🚀 Iniciar servicios',           hint: 'Selección múltiple con checkboxes' },
        { value: 'stop_all',    label: '🛑 Detener TODOS los servicios', hint: 'docker compose down' },
        { value: 'service',     label: '⚙️  Gestionar servicio',          hint: 'Logs, Stats, Reset, Credenciales' },
        { value: 'autostart',   label: '🔄 Auto-Inicio en Mac Boot',     hint: 'Qué arranca al encender la Mac' },
        { value: 'connect',     label: '🔗 Conectar mis apps',           hint: 'Guía Next.js · NestJS · Docker' },
        { value: 'back',        label: '⬅️  Volver al menú principal' },
      ],
    });

    if (handleCancel(action) || action === 'back') return backFn?.();

    switch (action) {
      case 'status':
        printBanner('Estado de la Infraestructura');
        log.info('Contenedores activos:');
        log.blank();
        run('docker compose ps');
        log.blank();
        await pause();
        break;

      case 'start_multi':
        await startMultiple();
        break;

      case 'stop_all': {
        const ok = await clack.confirm({
          message: chalk.yellow('¿Detener TODOS los servicios?'),
          initialValue: false,
        });
        if (!clack.isCancel(ok) && ok) {
          const spin = clack.spinner();
          spin.start('Deteniendo todos los contenedores...');
          run('docker compose down', true);
          spin.stop(chalk.greenBright('✔  Todos los servicios detenidos.'));
          await pause();
        }
        break;
      }

      case 'service': {
        const services = getServiceNames();
        const selected = await clack.select({
          message: 'Selecciona un servicio:',
          options: [
            ...services.map(s => ({ value: s, label: s })),
            { value: 'back', label: '⬅️  Volver' },
          ],
        });
        if (!handleCancel(selected) && selected !== 'back') {
          await serviceMenu(selected, () => {});
        }
        break;
      }

      case 'autostart':
        await autoStartMenu();
        break;

      case 'connect':
        showIntegrationGuide();
        await pause();
        break;
    }
  }
}

// ─── INICIAR MÚLTIPLES SERVICIOS ───────────────────────────
async function startMultiple() {
  const services = getServiceNames();

  const selected = await clack.multiselect({
    message: 'Marca los servicios a iniciar (Espacio, Enter para confirmar, ESC para cancelar):',
    options: services.map(s => ({ value: s, label: s })),
    required: false,
  });

  if (handleCancel(selected) || !selected?.length) {
    log.warn('Operación cancelada. No se inició nada.');
    await pause();
    return;
  }

  const spin = clack.spinner();
  spin.start(`Iniciando: ${selected.join(', ')}...`);
  run(`docker compose up -d ${selected.join(' ')}`, true);
  spin.stop(chalk.greenBright(`✔  ${selected.join(', ')} iniciados.`));
  await pause();
}

// ─── AUTO-INICIO ───────────────────────────────────────────
async function autoStartMenu() {
  printBanner('Auto-Inicio en Mac Boot');
  clack.intro(chalk.magentaBright('🔄  Configuración de Auto-Inicio'));

  console.log(
    chalk.gray(
      '  Los servicios marcados arrancarán automáticamente al encender tu Mac.\n' +
      '  Los no marcados permanecerán apagados hasta que los inicies a mano.\n'
    )
  );

  const parsed   = getParsed();
  const services = Object.keys(parsed.services);

  const currentlyActive = services.filter(s => parsed.services[s].restart !== 'no');

  const selected = await clack.multiselect({
    message: 'Servicios con Auto-Arranque:',
    options: services.map(s => ({
      value: s,
      label: s,
      hint:  currentlyActive.includes(s) ? '✔ activo' : 'inactivo',
    })),
    initialValues: currentlyActive,
    required: false,
  });

  if (handleCancel(selected)) {
    log.warn('Sin cambios guardados.');
    return;
  }

  services.forEach(s => {
    parsed.services[s].restart = selected.includes(s) ? 'unless-stopped' : 'no';
  });

  saveParsed(parsed);
  clack.outro(chalk.greenBright('✔  Configuración guardada en docker-compose.yml.'));
}

// ─── GUÍA DE INTEGRACIÓN ───────────────────────────────────
function showIntegrationGuide() {
  printBanner('Conectar mis Apps');

  clack.note(
    [
      chalk.gray('Añade esto al final del docker-compose.yml de TU app (NestJS, Next.js, etc.):\n'),
      chalk.yellow('networks:\n  default:\n    name: infra_dev_network\n    external: true'),
      '',
      chalk.gray('Una vez configurado, usa el nombre del servicio como Host:\n'),
      `  DATABASE_URL= ${chalk.greenBright('"postgresql://devuser:devpassword@postgres:5432/devdb"')}`,
      `  REDIS_URL=    ${chalk.greenBright('"redis://redis:6379"')}`,
      `  MONGO_URI=    ${chalk.greenBright('"mongodb://devuser:devpassword@mongodb:27017/"')}`,
      `  SMTP_HOST=    ${chalk.greenBright('"mailpit"')}   SMTP_PORT=1025`,
      '',
      chalk.gray('Si tu app NO está dockerizada (corre con node/npm en tu Mac):'),
      chalk.dim('  Usa "localhost" en lugar del nombre del servicio. Todos los puertos'),
      chalk.dim('  ya están expuestos en tu máquina por defecto.'),
    ].join('\n'),
    '🔗 Integración de Red — infra_dev_network'
  );
}
