#!/usr/bin/env node

import chalk from 'chalk';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import yaml from 'yaml';
import open from 'open';
import os from 'os';
import figlet from 'figlet';
import boxen from 'boxen';
import gradient from 'gradient-string';
import * as clack from '@clack/prompts';

process.stdin.setMaxListeners(0);

const FALLBACK_DIR = '/Users/jesusruizlopez/Documents/DESARROLLO/UPLAPH/DGM/PROYECTOS/dbs';

// ─────────────────────────────────────────────
//  Logger con badges estilo badge ([ INFO ] etc)
// ─────────────────────────────────────────────
const log = {
  info:  (msg) => console.log(`${chalk.bgBlueBright.bold.black(' INFO  ')} ${chalk.blueBright(msg)}`),
  ready: (msg) => console.log(`${chalk.bgGreenBright.bold.black(' READY ')} ${chalk.greenBright(msg)}`),
  warn:  (msg) => console.log(`${chalk.bgYellow.bold.black(' WARN  ')} ${chalk.yellow(msg)}`),
  error: (msg) => console.log(`${chalk.bgRed.bold.white(' ERROR ')} ${chalk.red(msg)}`),
  dim:   (msg) => console.log(chalk.gray(msg)),
  raw:   (msg) => console.log(msg),
};

// ─────────────────────────────────────────────
//  Helpers de Docker Compose
// ─────────────────────────────────────────────
function getComposeDir() {
  const cwd = process.cwd();
  if (fs.existsSync(path.join(cwd, 'docker-compose.yml'))) return cwd;
  if (fs.existsSync(path.join(FALLBACK_DIR, 'docker-compose.yml'))) return FALLBACK_DIR;
  log.error('No se encontró docker-compose.yml.');
  process.exit(1);
}

const composeDir = getComposeDir();
const composeFile = path.join(composeDir, 'docker-compose.yml');

function runCmd(cmd, silent = false) {
  try {
    return execSync(cmd, { cwd: composeDir, encoding: 'utf-8', stdio: silent ? 'pipe' : 'inherit' });
  } catch {
    if (!silent) log.error(`Error ejecutando: ${cmd}`);
    return null;
  }
}

function getServices() {
  try {
    return Object.keys(yaml.parse(fs.readFileSync(composeFile, 'utf8')).services || {});
  } catch {
    return [];
  }
}

function getParsedCompose() {
  return yaml.parse(fs.readFileSync(composeFile, 'utf8'));
}

function saveCompose(parsed) {
  fs.writeFileSync(composeFile, yaml.stringify(parsed));
}

// ─────────────────────────────────────────────
//  Función de cancel/salida segura
// ─────────────────────────────────────────────
function handleCancel(value) {
  if (clack.isCancel(value)) {
    clack.cancel(chalk.yellow('Operación cancelada.'));
    return true;
  }
  return false;
}

// ─────────────────────────────────────────────
//  Header / Banner
// ─────────────────────────────────────────────
function printBanner(subtitle = '') {
  console.clear();

  const ascii = figlet.textSync('INFRA  CLI', { font: 'ANSI Shadow' });
  const gradientArt = gradient(['#00f0ff', '#00ff9d', '#00f0ff']).multiline(ascii);

  const header = boxen(
    gradientArt + '\n\n' +
    chalk.gray('        Centro de comando · Infraestructura · Desarrollo') +
    (subtitle ? '\n' + chalk.yellow(`        ${subtitle}`) : ''),
    {
      padding: { top: 1, bottom: 1, left: 4, right: 4 },
      margin: { top: 1, left: 2 },
      borderStyle: 'round',
      borderColor: 'cyan',
      title: gradient(['#00f0ff','#00ff9d'])(' ✦ Infra CLI v1.0.0 ✦ '),
      titleAlignment: 'center',
    }
  );

  console.log(header);

  // Barra de info inferior
  const info = `${chalk.gray('Directorio:')} ${chalk.cyan(composeDir)}   ${chalk.gray('Host:')} ${chalk.yellow(os.hostname())}`;
  console.log(chalk.gray('  ' + info));
  console.log('');
}

// ─────────────────────────────────────────────
//  MENÚ PRINCIPAL
// ─────────────────────────────────────────────
async function showMainMenu() {
  printBanner();
  clack.intro(chalk.cyanBright('Menú Principal'));

  const action = await clack.select({
    message: 'Selecciona una categoría:',
    options: [
      { value: 'docker',   label: '🐳  Docker Infra',   hint: 'Bases de datos, Colas, Búsqueda' },
      { value: 'devtools', label: '🛠️   Dev Tools',       hint: 'Port Killer, Doctor, Cheat Sheet' },
      { value: 'health',   label: '📈  System Health',   hint: 'RAM, CPU, Espacio Docker' },
      { value: 'exit',     label: '🚪  Salir',           hint: 'Ctrl+C en cualquier momento' },
    ],
  });

  if (handleCancel(action) || action === 'exit') {
    clack.outro(chalk.greenBright('¡Feliz programación! 👋'));
    process.exit(0);
  }

  if (action === 'docker')   return dockerMenu();
  if (action === 'devtools') return devToolsMenu();
  if (action === 'health')   return systemHealthMenu();
}

// ─────────────────────────────────────────────
//  DOCKER MENU
// ─────────────────────────────────────────────
async function dockerMenu() {
  printBanner('Docker Infra');
  clack.intro(chalk.blue('🐳 Gestión de Infraestructura Docker'));

  const action = await clack.select({
    message: '¿Qué deseas hacer?',
    options: [
      { value: 'status',         label: '📊  Ver estado general',          hint: 'docker compose ps' },
      { value: 'up_multiple',    label: '🚀  Iniciar servicios',           hint: 'Selección múltiple con checkboxes' },
      { value: 'down_all',       label: '🛑  Detener TODOS los servicios', hint: 'docker compose down' },
      { value: 'manage_service', label: '⚙️   Gestionar servicio específico', hint: 'Logs, Stats, Reset, Credenciales' },
      { value: 'auto_start',     label: '🔄  Gestionar Auto-Inicio',       hint: 'Qué arranca al encender la Mac' },
      { value: 'integration',    label: '🔗  Cómo conectar mis apps',      hint: 'Guía Next.js / NestJS' },
      { value: 'back',           label: '⬅️   Volver',                      hint: '' },
    ],
  });

  if (handleCancel(action) || action === 'back') return showMainMenu();

  if (action === 'status') {
    log.info('Estado de los Contenedores:');
    console.log('');
    runCmd('docker compose ps');
    console.log('');
    await clack.note('Presiona Enter para continuar', 'Status');
    await clack.text({ message: '' }).catch(() => {});
    return dockerMenu();
  }

  if (action === 'up_multiple') {
    await startMultipleServices();
    return dockerMenu();
  }

  if (action === 'down_all') {
    const spin = clack.spinner();
    spin.start('Deteniendo todos los servicios...');
    runCmd('docker compose down', true);
    spin.stop(chalk.greenBright('Todos los servicios detenidos.'));
    await pause();
    return dockerMenu();
  }

  if (action === 'manage_service') {
    await manageServiceMenu();
    return dockerMenu();
  }

  if (action === 'auto_start') {
    await autoStartMenu();
    return dockerMenu();
  }

  if (action === 'integration') {
    showIntegrationGuide();
    await pause();
    return dockerMenu();
  }
}

// ─────────────────────────────────────────────
//  Iniciar múltiples servicios
// ─────────────────────────────────────────────
async function startMultipleServices() {
  const services = getServices();

  const selected = await clack.multiselect({
    message: 'Selecciona los servicios a iniciar (Espacio para marcar, Enter para confirmar, ESC para cancelar):',
    options: services.map(s => ({ value: s, label: s })),
    required: false,
  });

  if (handleCancel(selected) || !selected.length) {
    log.warn('Operación cancelada. No se inició nada.');
    return pause();
  }

  const spin = clack.spinner();
  spin.start(`Iniciando: ${selected.join(', ')}...`);
  runCmd(`docker compose up -d ${selected.join(' ')}`, true);
  spin.stop(log.ready(`${selected.join(', ')} iniciados correctamente.`) || '');
  console.log('');
  await pause();
}

// ─────────────────────────────────────────────
//  Gestionar servicio específico
// ─────────────────────────────────────────────
async function manageServiceMenu() {
  const services = getServices();

  const service = await clack.select({
    message: 'Selecciona un servicio:',
    options: [
      ...services.map(s => ({ value: s, label: s })),
      { value: 'back', label: '⬅️  Volver', hint: '' },
    ],
  });

  if (handleCancel(service) || service === 'back') return;
  await serviceActionMenu(service);
}

const SERVICE_UIS = {
  'minio':        'http://localhost:9001',
  'mongo-express':'http://localhost:8081',
  'adminer':      'http://localhost:8080',
  'rabbitmq':     'http://localhost:15672',
  'kibana':       'http://localhost:5601',
  'grafana':      'http://localhost:3000',
  'jaeger':       'http://localhost:16686',
  'mailpit':      'http://localhost:8025',
  'keycloak':     'http://localhost:8082',
  'traefik':      'http://localhost:8083',
};

const CRED_SERVICES = ['postgres', 'mysql', 'mongodb', 'redis', 'elasticsearch'];

async function serviceActionMenu(service) {
  printBanner(`Servicio: ${service}`);
  clack.intro(chalk.magenta(`⚙️  Gestionando: ${chalk.white.bold(service)}`));

  const options = [
    { value: 'start',   label: '▶️  Iniciar' },
    { value: 'stop',    label: '⏹️  Detener' },
    { value: 'restart', label: '🔄 Reiniciar' },
    { value: 'logs',    label: '📄 Ver Logs',          hint: 'Streaming en tiempo real (Ctrl+C para salir)' },
    { value: 'stats',   label: '📈 Ver Estadísticas',  hint: 'CPU/RAM en vivo (Ctrl+C para salir)' },
    { value: 'env',     label: '🔐 Ver Variables de Entorno' },
  ];

  if (SERVICE_UIS[service])     options.push({ value: 'open_ui', label: '🌐 Abrir Interfaz Web', hint: SERVICE_UIS[service] });
  if (CRED_SERVICES.includes(service)) options.push({ value: 'creds', label: '🔑 Generar Credenciales / .env', hint: 'Copia al portapapeles' });
  options.push({ value: 'wipe',  label: '💣 Borrar Datos Locales (Hard Reset)', hint: '⚠️ Irreversible' });
  options.push({ value: 'back',  label: '⬅️  Volver' });

  const action = await clack.select({ message: `Acción para ${service}:`, options });

  if (handleCancel(action) || action === 'back') return;

  switch (action) {
    case 'start': {
      const spin = clack.spinner();
      spin.start(`Iniciando ${service}...`);
      runCmd(`docker compose up -d ${service}`, true);
      spin.stop(chalk.greenBright(`${service} iniciado.`));
      await pause();
      break;
    }
    case 'stop': {
      const spin = clack.spinner();
      spin.start(`Deteniendo ${service}...`);
      runCmd(`docker compose stop ${service}`, true);
      spin.stop(chalk.greenBright(`${service} detenido.`));
      await pause();
      break;
    }
    case 'restart': {
      const spin = clack.spinner();
      spin.start(`Reiniciando ${service}...`);
      runCmd(`docker compose restart ${service}`, true);
      spin.stop(chalk.greenBright(`${service} reiniciado.`));
      await pause();
      break;
    }
    case 'logs':
      log.info(`Logs de ${service} → Ctrl+C para volver:`);
      console.log('');
      try { execSync(`docker compose logs -f ${service}`, { cwd: composeDir, stdio: 'inherit' }); } catch {}
      break;
    case 'stats':
      log.info(`Stats de ${service} → Ctrl+C para volver:`);
      console.log('');
      try {
        const id = runCmd(`docker compose ps -q ${service}`, true)?.trim();
        if (id) execSync(`docker stats ${id}`, { stdio: 'inherit' });
        else log.warn('El contenedor no está corriendo.');
      } catch {}
      await pause();
      break;
    case 'env': {
      const envVars = getParsedCompose().services[service]?.environment;
      if (envVars) {
        clack.note(
          Array.isArray(envVars)
            ? envVars.map(v => chalk.yellow(v)).join('\n')
            : Object.entries(envVars).map(([k, v]) => `${chalk.yellow(k)}=${v}`).join('\n'),
          `Variables de Entorno — ${service}`
        );
      } else {
        log.warn('No hay variables de entorno explícitas para este servicio.');
      }
      await pause();
      break;
    }
    case 'open_ui':
      log.info(`Abriendo ${SERVICE_UIS[service]} en tu navegador...`);
      open(SERVICE_UIS[service]);
      await pause();
      break;
    case 'creds':
      showCredentials(service);
      await pause();
      break;
    case 'wipe': {
      const ok = await clack.confirm({
        message: chalk.red(`¿Borrar PERMANENTEMENTE los datos locales de ${service}? Esto no tiene vuelta atrás.`),
        initialValue: false,
      });
      if (ok && !clack.isCancel(ok)) {
        const spin = clack.spinner();
        spin.start('Borrando contenedor y volumen local...');
        runCmd(`docker compose stop ${service}`, true);
        runCmd(`docker compose rm -f ${service}`, true);
        try { execSync(`rm -rf ${path.join(composeDir, 'data', service)}`); } catch {}
        spin.stop(chalk.greenBright('Datos borrados. Levanta el servicio para empezar limpio.'));
      } else {
        log.warn('Operación cancelada.');
      }
      await pause();
      break;
    }
  }

  await serviceActionMenu(service);
}

// ─────────────────────────────────────────────
//  Credenciales
// ─────────────────────────────────────────────
function showCredentials(service) {
  const creds = {
    postgres: {
      local:     'postgresql://devuser:devpassword@localhost:5432/devdb',
      docker:    'postgresql://devuser:devpassword@postgres:5432/devdb',
    },
    mongodb: {
      local:  'mongodb://devuser:devpassword@localhost:27017/',
      docker: 'mongodb://devuser:devpassword@mongodb:27017/',
    },
    mysql: {
      local:  'mysql://devuser:devpassword@localhost:3306/devdb',
      docker: 'mysql://devuser:devpassword@mysql:3306/devdb',
    },
    redis: {
      local:  'redis://localhost:6379',
      docker: 'redis://redis:6379',
    },
    elasticsearch: {
      local:  'http://localhost:9200',
      docker: 'http://elasticsearch:9200',
    },
  };

  const c = creds[service];
  if (!c) { log.warn('No hay credenciales registradas para este servicio.'); return; }

  clack.note(
    `${chalk.gray('En tu Mac (localhost):\n')}${chalk.greenBright(c.local)}\n\n${chalk.gray('App dockerizada (red interna):\n')}${chalk.yellow(c.docker)}`,
    `🔑 Credenciales — ${service}`
  );

  try {
    execSync(`echo "${c.local}" | pbcopy`);
    log.ready('URL localhost copiada al portapapeles.');
  } catch {}
}

// ─────────────────────────────────────────────
//  Auto-inicio
// ─────────────────────────────────────────────
async function autoStartMenu() {
  printBanner('Auto-Inicio en Mac Boot');
  clack.intro(chalk.magenta('🔄 Configuración de Auto-Inicio'));
  console.log(chalk.gray('Los servicios seleccionados arrancarán automáticamente al encender tu Mac.\nLos no seleccionados permanecerán apagados hasta que los inicies manualmente.\n'));

  const parsed = getParsedCompose();
  const services = Object.keys(parsed.services);

  const selected = await clack.multiselect({
    message: 'Servicios que arrancan automáticamente:',
    options: services.map(s => ({
      value: s,
      label: s,
      hint: parsed.services[s].restart !== 'no' ? 'activo' : 'inactivo',
    })),
    initialValues: services.filter(s => parsed.services[s].restart !== 'no'),
    required: false,
  });

  if (handleCancel(selected)) { log.warn('Sin cambios.'); return; }

  services.forEach(s => {
    parsed.services[s].restart = selected.includes(s) ? 'unless-stopped' : 'no';
  });

  saveCompose(parsed);
  clack.outro(chalk.greenBright('✅ Configuración guardada en docker-compose.yml.'));
}

// ─────────────────────────────────────────────
//  Guía de integración
// ─────────────────────────────────────────────
function showIntegrationGuide() {
  printBanner('Guía de Integración');
  clack.note(
    `${chalk.gray('Añade esto al final del docker-compose.yml de TU app (NestJS, Next.js, etc.):\n')}
${chalk.yellow(`networks:
  default:
    name: infra_dev_network
    external: true`)}

${chalk.gray('Una vez configurado, conéctate usando el nombre del contenedor como host:')}
  DATABASE_URL="${chalk.greenBright('postgresql://devuser:devpassword@postgres:5432/devdb')}"
  REDIS_URL="${chalk.greenBright('redis://redis:6379')}"
  MONGO_URI="${chalk.greenBright('mongodb://devuser:devpassword@mongodb:27017/')}"`,
    '🔗 Integración de Red'
  );
}

// ─────────────────────────────────────────────
//  DEV TOOLS
// ─────────────────────────────────────────────
async function devToolsMenu() {
  printBanner('Developer Tools');
  clack.intro(chalk.blue('🛠️  Asistente del Desarrollador'));

  const action = await clack.select({
    message: 'Selecciona una herramienta:',
    options: [
      { value: 'portkiller', label: '🔪 Port Killer',   hint: 'Mata el proceso que ocupa un puerto' },
      { value: 'doctor',     label: '🩺 Doctor',         hint: 'Versiones del entorno e IP local' },
      { value: 'cheatsheet', label: '📚 Cheat Sheet',    hint: 'Soluciones rápidas a problemas comunes' },
      { value: 'back',       label: '⬅️  Volver',         hint: '' },
    ],
  });

  if (handleCancel(action) || action === 'back') return showMainMenu();

  if (action === 'portkiller') {
    const port = await clack.text({
      message: '¿Qué puerto está bloqueado?',
      placeholder: '3000',
      validate: v => isNaN(Number(v)) ? 'Ingresa un número de puerto válido.' : undefined,
    });
    if (handleCancel(port)) return devToolsMenu();

    try {
      const pids = execSync(`lsof -t -i:${port}`, { encoding: 'utf-8' }).trim().split('\n').filter(Boolean);
      if (pids.length) {
        log.warn(`Puerto ${port} ocupado por PIDs: [${pids.join(', ')}]`);
        const ok = await clack.confirm({ message: '¿Matar estos procesos?', initialValue: false });
        if (!clack.isCancel(ok) && ok) {
          pids.forEach(pid => { try { execSync(`kill -9 ${pid}`); } catch {} });
          log.ready(`Puerto ${port} liberado exitosamente.`);
        }
      } else {
        log.ready(`El puerto ${port} está libre. No hay procesos bloqueándolo.`);
      }
    } catch {
      log.ready(`El puerto ${port} está libre.`);
    }
    await pause();
    return devToolsMenu();
  }

  if (action === 'doctor') {
    printBanner('Doctor — Diagnóstico de Entorno');
    const getV = (cmd) => { try { return execSync(cmd, { encoding: 'utf-8' }).trim(); } catch { return chalk.red('No instalado'); } };

    clack.note(
      [
        `${chalk.gray('Node.js:')}   ${chalk.green(getV('node -v'))}`,
        `${chalk.gray('NPM:')}       ${chalk.green(getV('npm -v'))}`,
        `${chalk.gray('Git:')}       ${chalk.green(getV('git --version'))}`,
        `${chalk.gray('Docker:')}    ${chalk.green(getV('docker --version'))}`,
      ].join('\n'),
      '⚙️ Versiones del Stack'
    );

    const nets = os.networkInterfaces();
    const ips = [];
    for (const name of Object.keys(nets)) {
      for (const net of nets[name]) {
        if (net.family === 'IPv4' && !net.internal) {
          ips.push(`${chalk.gray(name + ':')} ${chalk.yellow(net.address)}`);
        }
      }
    }
    clack.note(
      ips.join('\n') + `\n\n${chalk.gray('Úsala en tu celular: ')}${chalk.greenBright('http://<ip>:3000')}`,
      '🌐 Red Local'
    );

    await pause();
    return devToolsMenu();
  }

  if (action === 'cheatsheet') {
    printBanner('Cheat Sheet');
    clack.note(
      [
        `${chalk.yellow('1. Caché de Next.js rota:')}`,
        `   ${chalk.greenBright('rm -rf .next/')}`,
        '',
        `${chalk.yellow('2. Deshacer último commit (sin perder cambios):')}`,
        `   ${chalk.greenBright('git reset HEAD~1')}`,
        '',
        `${chalk.yellow('3. Matar todos los procesos de Node:')}`,
        `   ${chalk.greenBright('killall node')}`,
        '',
        `${chalk.yellow('4. Docker sin espacio en disco:')}`,
        `   ${chalk.greenBright('→ System Health > Prune')}`,
        '',
        `${chalk.yellow('5. Reinstalar node_modules corrompido:')}`,
        `   ${chalk.greenBright('rm -rf node_modules package-lock.json && npm install')}`,
      ].join('\n'),
      '📚 Soluciones Rápidas'
    );
    await pause();
    return devToolsMenu();
  }
}

// ─────────────────────────────────────────────
//  SYSTEM HEALTH
// ─────────────────────────────────────────────
async function systemHealthMenu() {
  printBanner('System Health');
  clack.intro(chalk.blue('📈 Salud del Sistema y Docker'));

  const freeGB  = (os.freemem()  / 1024 ** 3).toFixed(2);
  const totalGB = (os.totalmem() / 1024 ** 3).toFixed(2);
  const usedPct = (((os.totalmem() - os.freemem()) / os.totalmem()) * 100).toFixed(1);

  const ramBar = () => {
    const used = Math.round((Number(usedPct) / 100) * 20);
    const bar  = chalk.red('█'.repeat(used)) + chalk.gray('░'.repeat(20 - used));
    return `[${bar}] ${usedPct}% usado`;
  };

  clack.note(
    [
      `${chalk.gray('RAM libre:')}  ${chalk.green(freeGB + ' GB')} de ${chalk.white(totalGB + ' GB')}`,
      `${chalk.gray('Uso RAM:')}    ${ramBar()}`,
      `${chalk.gray('CPUs:')}       ${chalk.yellow(os.cpus().length + ' cores')} — ${os.cpus()[0].model}`,
    ].join('\n'),
    '🖥️  Recursos del Sistema'
  );

  log.info('Uso de disco de Docker:');
  console.log('');
  runCmd('docker system df', false);
  console.log('');

  const action = await clack.select({
    message: 'Opciones:',
    options: [
      { value: 'prune', label: '🧹 Limpiar Caché de Docker (Prune)', hint: 'Libera espacio en disco' },
      { value: 'back',  label: '⬅️  Volver al menú principal' },
    ],
  });

  if (handleCancel(action) || action === 'back') return showMainMenu();

  if (action === 'prune') {
    log.warn('Esto borrará contenedores detenidos, redes no usadas e imágenes colgantes.');
    const ok = await clack.confirm({ message: '¿Ejecutar limpieza?', initialValue: false });
    if (!clack.isCancel(ok) && ok) {
      const spin = clack.spinner();
      spin.start('Limpiando caché de Docker...');
      runCmd('docker system prune -f', true);
      spin.stop(chalk.greenBright('Limpieza completada. Espacio liberado.'));
    } else {
      log.warn('Limpieza cancelada.');
    }
    await pause();
    return systemHealthMenu();
  }
}

// ─────────────────────────────────────────────
//  Pausa helper
// ─────────────────────────────────────────────
async function pause() {
  await clack.text({ message: chalk.gray('↩  Presiona Enter para continuar...') }).catch(() => {});
}

// ─────────────────────────────────────────────
//  Entry point
// ─────────────────────────────────────────────
showMainMenu().catch(err => log.error(`Error no manejado: ${err}`));
