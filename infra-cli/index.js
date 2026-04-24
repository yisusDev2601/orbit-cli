#!/usr/bin/env node

import inquirer from 'inquirer';
import chalk from 'chalk';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import yaml from 'yaml';
import open from 'open';
import os from 'os';

const FALLBACK_DIR = '/Users/jesusruizlopez/Documents/DESARROLLO/UPLAPH/DGM/PROYECTOS/dbs';

function getComposeDir() {
  const currentDir = process.cwd();
  if (fs.existsSync(path.join(currentDir, 'docker-compose.yml'))) return currentDir;
  if (fs.existsSync(path.join(FALLBACK_DIR, 'docker-compose.yml'))) return FALLBACK_DIR;
  console.log(chalk.red('❌ No se encontró docker-compose.yml ni en el directorio actual ni en la ruta por defecto.'));
  process.exit(1);
}

const composeDir = getComposeDir();
const composeFile = path.join(composeDir, 'docker-compose.yml');

function runCmd(cmd, silent = false) {
  try {
    return execSync(cmd, { cwd: composeDir, encoding: 'utf-8', stdio: silent ? 'pipe' : 'inherit' });
  } catch (error) {
    if (!silent) console.error(chalk.red(`Error ejecutando comando: ${cmd}`));
    return null;
  }
}

function getServices() {
  try {
    const file = fs.readFileSync(composeFile, 'utf8');
    const parsed = yaml.parse(file);
    return Object.keys(parsed.services || {});
  } catch (e) {
    console.log(chalk.red('❌ Error leyendo docker-compose.yml'));
    return [];
  }
}

function getParsedCompose() {
  const file = fs.readFileSync(composeFile, 'utf8');
  return yaml.parse(file);
}

function saveCompose(parsed) {
  fs.writeFileSync(composeFile, yaml.stringify(parsed));
}

// ============== MENÚ PRINCIPAL ==============
async function showMainMenu() {
  console.clear();
  console.log(chalk.cyan.bold('\n🚀 Infraestructura & Asistente Dev (CLI)'));
  console.log(chalk.gray(`Directorio: ${composeDir}\n`));
  
  const { action } = await inquirer.prompt([{
    type: 'list',
    name: 'action',
    message: 'Menú Principal:',
    choices: [
      { name: '🐳 [1] Docker Infra (Bases de datos, Colas, Búsqueda)', value: 'docker' },
      { name: '🛠️  [2] Dev Tools (Port Killer, Doctor, Local IP, Cheat Sheet)', value: 'devtools' },
      { name: '📈 [3] System Health (RAM, CPU, Espacio Docker)', value: 'health' },
      new inquirer.Separator(),
      { name: '🚪 Salir', value: 'exit' }
    ]
  }]);

  switch (action) {
    case 'docker': await dockerMenu(); break;
    case 'devtools': await devToolsMenu(); break;
    case 'health': await systemHealthMenu(); break;
    case 'exit': 
      console.log(chalk.green('¡Feliz programación! 👋\n'));
      process.exit(0);
  }
}

// ============== DOCKER INFRA ==============
async function dockerMenu() {
  console.clear();
  console.log(chalk.blue.bold('\n🐳 Gestión de Infraestructura Docker\n'));

  const { action } = await inquirer.prompt([{
    type: 'list',
    name: 'action',
    message: 'Selecciona una acción:',
    choices: [
      { name: '📊 Ver estado general (Status)', value: 'status' },
      { name: '🚀 Iniciar servicios (Selección múltiple)', value: 'up_multiple' },
      { name: '🛑 Detener todos los servicios', value: 'down_all' },
      { name: '⚙️  Gestionar un servicio específico (Logs, Reset, Credenciales)', value: 'manage_service' },
      { name: '🔄 Gestionar Auto-Inicio (Mac Boot)', value: 'auto_start' },
      { name: '🔗 Cómo conectar mis apps (Next/Nest) a la red', value: 'integration' },
      new inquirer.Separator(),
      { name: '⬅️  Volver al menú principal', value: 'back' }
    ]
  }]);

  switch (action) {
    case 'status':
      console.log(chalk.blue.bold('\n📊 Estado de los Contenedores:\n'));
      runCmd('docker compose ps');
      await pause();
      return dockerMenu();
    case 'up_multiple':
      await startMultipleServices();
      return dockerMenu();
    case 'down_all':
      runCmd('docker compose down');
      await pause();
      return dockerMenu();
    case 'manage_service':
      await manageServiceMenu();
      return dockerMenu();
    case 'auto_start':
      await autoStartMenu();
      return dockerMenu();
    case 'integration':
      showIntegrationGuide();
      return dockerMenu();
    case 'back':
      return showMainMenu();
  }
}

async function startMultipleServices() {
  const services = getServices();
  const { selected } = await inquirer.prompt([{
    type: 'checkbox',
    name: 'selected',
    message: 'Selecciona los servicios que deseas iniciar (Usa barra espaciadora para marcar):',
    choices: services
  }]);

  if (selected && selected.length > 0) {
    console.log(chalk.blue(`\nIniciando: ${selected.join(', ')}...`));
    runCmd(`docker compose up -d ${selected.join(' ')}`);
  } else {
    console.log(chalk.yellow('\nNo seleccionaste ningún servicio.'));
  }
  await pause();
}

async function manageServiceMenu() {
  const services = getServices();
  if (services.length === 0) {
    console.log(chalk.yellow('No se encontraron servicios.'));
    await pause();
    return dockerMenu();
  }

  const { service } = await inquirer.prompt([{
    type: 'list',
    name: 'service',
    message: 'Selecciona un servicio para gestionar:',
    choices: [...services, new inquirer.Separator(), { name: '⬅️  Volver', value: 'back' }]
  }]);

  if (service === 'back') return dockerMenu();
  await serviceActionMenu(service);
}

async function serviceActionMenu(service) {
  console.clear();
  console.log(chalk.magenta.bold(`\n🔧 Gestionando servicio: ${chalk.white.bold(service)}\n`));

  const uis = {
    'minio': 'http://localhost:9001',
    'mongo-express': 'http://localhost:8081',
    'adminer': 'http://localhost:8080',
    'rabbitmq': 'http://localhost:15672',
    'kibana': 'http://localhost:5601',
    'grafana': 'http://localhost:3000',
    'jaeger': 'http://localhost:16686',
    'mailpit': 'http://localhost:8025',
    'keycloak': 'http://localhost:8082',
    'traefik': 'http://localhost:8083'
  };

  const choices = [
    { name: '▶️  Iniciar', value: 'start' },
    { name: '⏹️  Detener', value: 'stop' },
    { name: '🔄 Reiniciar', value: 'restart' },
    { name: '📄 Ver Logs (Tiempo real)', value: 'logs' },
    { name: '📈 Ver Estadísticas (CPU/RAM)', value: 'stats' }
  ];

  if (uis[service]) {
    choices.push({ name: '🌐 Abrir Interfaz Web (UI)', value: 'open_ui' });
  }

  if (['postgres', 'mysql', 'mongodb', 'redis', 'elasticsearch'].includes(service)) {
    choices.push({ name: '🔑 Generar Credenciales/Env (Prisma, Mongoose, etc)', value: 'creds' });
  }

  choices.push({ name: '💣 Borrar Datos Locales (Hard Reset)', value: 'wipe' });
  choices.push(new inquirer.Separator());
  choices.push({ name: '⬅️  Volver atrás', value: 'back' });

  const { action } = await inquirer.prompt([{
    type: 'list',
    name: 'action',
    message: `Acción para ${service}:`,
    choices
  }]);

  switch (action) {
    case 'start': runCmd(`docker compose up -d ${service}`); await pause(); break;
    case 'stop': runCmd(`docker compose stop ${service}`); await pause(); break;
    case 'restart': runCmd(`docker compose restart ${service}`); await pause(); break;
    case 'logs':
      console.log(chalk.yellow(`\nMostrando logs para ${service} (Presiona Ctrl+C para salir):\n`));
      try { execSync(`docker compose logs -f ${service}`, { cwd: composeDir, stdio: 'inherit' }); } catch(e) {}
      break;
    case 'stats':
      console.log(chalk.yellow(`\nMostrando estadísticas para ${service} (Presiona Ctrl+C para salir):\n`));
      try {
        const psOutput = runCmd(`docker compose ps -q ${service}`, true).trim();
        if (psOutput) execSync(`docker stats ${psOutput}`, { stdio: 'inherit' });
        else { console.log(chalk.red('El contenedor no está corriendo.')); await pause(); }
      } catch(e) {}
      break;
    case 'open_ui':
      console.log(chalk.blue(`Abriendo ${uis[service]} en el navegador...`));
      open(uis[service]);
      await pause();
      break;
    case 'creds':
      showCredentials(service);
      await pause();
      break;
    case 'wipe':
      const { confirm } = await inquirer.prompt([{
        type: 'confirm', name: 'confirm', default: false,
        message: chalk.red(`¿Estás seguro? Esto borrará PERMANENTEMENTE los datos locales de ${service} y lo reiniciará limpio.`)
      }]);
      if (confirm) {
        console.log(chalk.yellow(`\nDeteniendo ${service}...`));
        runCmd(`docker compose stop ${service}`, true);
        runCmd(`docker compose rm -f ${service}`, true);
        const rmCmd = `rm -rf ${path.join(composeDir, 'data', service)}`;
        console.log(chalk.yellow(`Borrando volumen local...`));
        try { 
           execSync(rmCmd); 
           console.log(chalk.green('✅ Datos borrados. Levántalo de nuevo para empezar limpio.')); 
        } 
        catch (e) { console.log(chalk.red('Error borrando carpeta de datos.')); }
      }
      await pause();
      break;
    case 'back': return manageServiceMenu();
  }
  await serviceActionMenu(service);
}

function showCredentials(service) {
  let text = '';
  let toCopy = '';
  
  if (service === 'postgres') {
    text = `
${chalk.cyan('=== Credenciales para PostgreSQL ===')}

Si corres tu app de NestJS/Next en tu Mac (localhost):
${chalk.green('postgresql://devuser:devpassword@localhost:5432/devdb')}

Si corres tu app en un contenedor (dentro de la misma red):
${chalk.yellow('postgresql://devuser:devpassword@postgres:5432/devdb')}
`;
    toCopy = 'postgresql://devuser:devpassword@localhost:5432/devdb';
  } else if (service === 'mongodb') {
    text = `
${chalk.cyan('=== Credenciales para MongoDB (Mongoose) ===')}

Si corres tu app en tu Mac (localhost):
${chalk.green('mongodb://devuser:devpassword@localhost:27017/')}

Si corres tu app en un contenedor:
${chalk.yellow('mongodb://devuser:devpassword@mongodb:27017/')}
`;
    toCopy = 'mongodb://devuser:devpassword@localhost:27017/';
  } else if (service === 'mysql') {
     text = `\nURL: ${chalk.green('mysql://devuser:devpassword@localhost:3306/devdb')}\n`;
     toCopy = 'mysql://devuser:devpassword@localhost:3306/devdb';
  } else if (service === 'redis') {
     text = `\nURL: ${chalk.green('redis://localhost:6379')}\n`;
     toCopy = 'redis://localhost:6379';
  } else {
     text = chalk.yellow('No hay credenciales específicas guardadas para este servicio.');
  }
  
  console.log(text);
  if (toCopy) {
    try { 
      execSync(`echo "${toCopy}" | pbcopy`); 
      console.log(chalk.magenta('📋 URL de localhost copiada al portapapeles automáticamente.')); 
    } catch(e){}
  }
}

async function autoStartMenu() {
  console.clear();
  console.log(chalk.magenta.bold('\n🔄 Configuración de Auto-Inicio en Mac Boot\n'));
  console.log(chalk.gray('Selecciona qué servicios quieres que se arranquen de forma automática cuando enciendes tu computadora. Los no seleccionados requerirán que los inicies a mano.\n'));

  const parsed = getParsedCompose();
  const services = Object.keys(parsed.services);
  
  const choices = services.map(s => {
    // unless-stopped is default. if it's 'no', it's disabled.
    const isAlways = parsed.services[s].restart !== 'no';
    return { name: s, value: s, checked: isAlways };
  });

  const { selected } = await inquirer.prompt([{
    type: 'checkbox',
    name: 'selected',
    message: 'Servicios con Auto-Arranque (Espacio para seleccionar):',
    choices
  }]);

  services.forEach(s => {
    if (selected.includes(s)) {
      parsed.services[s].restart = 'unless-stopped';
    } else {
      parsed.services[s].restart = 'no';
    }
  });

  saveCompose(parsed);
  console.log(chalk.green('\n✅ Configuración guardada exitosamente en el docker-compose.yml.'));
  await pause();
}

function showIntegrationGuide() {
  console.clear();
  console.log(chalk.cyan(`
=== 🔗 Cómo conectar tus apps a esta infraestructura ===

Si estás creando una app en Next.js, NestJS, etc., y le configuras su 
propio archivo docker-compose.yml, añade este bloque de red al final de TU archivo:

${chalk.yellow(`networks:
  default:
    name: infra_dev_network
    external: true`)}

👉 De esta manera, tus contenedores se fusionarán en la misma red y 
podrán conectarse directamente usando el nombre del servicio como Host.

Ejemplo desde tu NestJS dockerizado hacia Postgres:
  DATABASE_URL="postgresql://devuser:devpassword@postgres:5432/devdb"
  `));
  pause().then(dockerMenu);
}

// ============== DEV TOOLS ==============
async function devToolsMenu() {
  console.clear();
  console.log(chalk.blue.bold('\n🛠️  Developer Tools (Asistente Global)\n'));

  const { action } = await inquirer.prompt([{
    type: 'list',
    name: 'action',
    message: 'Selecciona una herramienta:',
    choices: [
      { name: '🔪 Port Killer (Matar un proceso bloqueando un puerto)', value: 'portkiller' },
      { name: '🩺 Doctor (Versiones del entorno & Tu IP Local)', value: 'doctor' },
      { name: '📚 Cheat Sheet (Soluciones a problemas comunes)', value: 'cheatsheet' },
      new inquirer.Separator(),
      { name: '⬅️  Volver al menú principal', value: 'back' }
    ]
  }]);

  switch (action) {
    case 'portkiller':
      const { port } = await inquirer.prompt([{ type: 'input', name: 'port', message: '¿Qué puerto está bloqueado? (ej. 3000 o 5432):' }]);
      try {
        const pids = execSync(`lsof -t -i:${port}`, { encoding: 'utf-8' }).trim().split('\n');
        if (pids[0]) {
          console.log(chalk.yellow(`\n⚠️ Se encontraron procesos secuestrando el puerto ${port}: PIDs [${pids.join(', ')}]`));
          const { confirm } = await inquirer.prompt([{ type: 'confirm', name: 'confirm', message: `¿Destruir estos procesos?` }]);
          if (confirm) {
            pids.forEach(pid => { try { execSync(`kill -9 ${pid}`); } catch(e){} });
            console.log(chalk.green('\n✅ Procesos eliminados. El puerto ha sido liberado.'));
          }
        } else {
           console.log(chalk.green(`\nEl puerto ${port} está libre.`));
        }
      } catch (e) {
        console.log(chalk.green(`\nEl puerto ${port} está libre o no se detectaron procesos usándolo.`));
      }
      await pause();
      return devToolsMenu();

    case 'doctor':
      console.clear();
      console.log(chalk.cyan.bold('\n🩺 Diagnóstico de Entorno (Doctor)\n'));
      const getV = (cmd) => { try { return execSync(cmd, { encoding:'utf-8' }).trim(); } catch(e){ return chalk.red('No instalado'); } };
      
      console.log(chalk.magenta('--- Versiones ---'));
      console.log(`Node.js:   ${chalk.green(getV('node -v'))}`);
      console.log(`NPM:       ${chalk.green(getV('npm -v'))}`);
      console.log(`Git:       ${chalk.green(getV('git --version'))}`);
      console.log(`Docker:    ${chalk.green(getV('docker --version'))}`);
      
      console.log(chalk.magenta('\n--- Red Local ---'));
      const nets = os.networkInterfaces();
      for (const name of Object.keys(nets)) {
        for (const net of nets[name]) {
          if (net.family === 'IPv4' && !net.internal) {
             console.log(`IP de tu Mac: ${chalk.yellow(net.address)}`);
             console.log(chalk.gray(`(Usa esta IP en tu celular para acceder a tus apps locales, ej: http://${net.address}:3000)`));
          }
        }
      }
      console.log('');
      await pause();
      return devToolsMenu();

    case 'cheatsheet':
      console.clear();
      console.log(chalk.cyan(`
📚 Respuestas Rápidas para Developers:

1. ¿Tu app de Next.js se quedó tonta, no refresca cambios o lanza error de caché?
   -> Corre: ${chalk.yellow('rm -rf .next/')} en la carpeta del proyecto.

2. ¿Hiciste un commit en Git por accidente y quieres deshacerlo SIN perder tus cambios?
   -> Corre: ${chalk.yellow('git reset HEAD~1')}

3. ¿Tienes procesos de Node "zombies" consumiendo tu CPU en el fondo?
   -> Corre: ${chalk.yellow('killall node')}

4. ¿Docker no te deja levantar apps porque dice "No space left on device"?
   -> Ve al menú "System Health" de esta CLI y ejecuta "Limpiar Caché de Docker (Prune)".

5. ¿Cómo borro la carpeta node_modules rápido si se corrompió?
   -> Corre: ${chalk.yellow('rm -rf node_modules package-lock.json && npm install')}
      `));
      await pause();
      return devToolsMenu();

    case 'back':
      return showMainMenu();
  }
}

// ============== SYSTEM HEALTH ==============
async function systemHealthMenu() {
  console.clear();
  console.log(chalk.blue.bold('\n📈 System Health & Docker Stats\n'));
  
  const freeRamGB = (os.freemem() / 1024 / 1024 / 1024).toFixed(2);
  const totalRamGB = (os.totalmem() / 1024 / 1024 / 1024).toFixed(2);
  
  console.log(chalk.magenta('--- Rendimiento de tu Mac ---'));
  console.log(`Memoria RAM Libre: ${chalk.yellow(freeRamGB + ' GB')} de ${totalRamGB} GB`);
  console.log(`CPUs Lógicos:      ${os.cpus().length}`);

  console.log(chalk.magenta('\n--- Uso de disco de Docker ---'));
  runCmd('docker system df', false);

  console.log('');
  const { action } = await inquirer.prompt([{
    type: 'list',
    name: 'action',
    message: 'Opciones de salud del sistema:',
    choices: [
      { name: '🧹 Limpiar Caché de Docker (Prune - Libera espacio en disco)', value: 'prune' },
      new inquirer.Separator(),
      { name: '⬅️  Volver al menú principal', value: 'back' }
    ]
  }]);

  if (action === 'prune') {
    console.log(chalk.red('\n¡CUIDADO! Esto borrará:'));
    console.log('- Contenedores detenidos.\n- Redes no usadas.\n- Imágenes "colgantes" (caché de builds viejas).');
    const { confirm } = await inquirer.prompt([{ type: 'confirm', name: 'confirm', message: '¿Ejecutar limpieza?' }]);
    if (confirm) {
      console.log('');
      runCmd('docker system prune -f');
      console.log(chalk.green('\n✅ Limpieza de espacio completada.'));
    }
    await pause();
    return systemHealthMenu();
  } else {
    return showMainMenu();
  }
}

async function pause() {
  await inquirer.prompt([{ type: 'input', name: 'continue', message: chalk.gray('Presiona Enter para continuar...') }]);
}

showMainMenu().catch(err => console.error(chalk.red('Error no manejado:'), err));
