#!/usr/bin/env node

import inquirer from 'inquirer';
import chalk from 'chalk';
import Table from 'cli-table3';
import { execSync, spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import yaml from 'yaml';

// Define the fallback directory for the infra project
const FALLBACK_DIR = '/Users/jesusruizlopez/Documents/DESARROLLO/UPLAPH/DGM/PROYECTOS/dbs';

function getComposeDir() {
  const currentDir = process.cwd();
  if (fs.existsSync(path.join(currentDir, 'docker-compose.yml'))) {
    return currentDir;
  }
  if (fs.existsSync(path.join(FALLBACK_DIR, 'docker-compose.yml'))) {
    return FALLBACK_DIR;
  }
  console.log(chalk.red('❌ No se encontró docker-compose.yml ni en el directorio actual ni en la ruta por defecto.'));
  process.exit(1);
}

const composeDir = getComposeDir();

function runCmd(cmd, silent = false) {
  try {
    const res = execSync(cmd, { cwd: composeDir, encoding: 'utf-8', stdio: silent ? 'pipe' : 'inherit' });
    return res;
  } catch (error) {
    if (!silent) console.error(chalk.red(`Error ejecutando comando: ${cmd}`));
    return null;
  }
}

function getServices() {
  try {
    const file = fs.readFileSync(path.join(composeDir, 'docker-compose.yml'), 'utf8');
    const parsed = yaml.parse(file);
    return Object.keys(parsed.services || {});
  } catch (e) {
    console.log(chalk.red('❌ Error leyendo docker-compose.yml'));
    return [];
  }
}

async function showMainMenu() {
  console.clear();
  console.log(chalk.cyan.bold('\n🐳 Infraestructura de Desarrollo (CLI)'));
  console.log(chalk.gray(`Directorio: ${composeDir}\n`));

  const { action } = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: '¿Qué deseas hacer?',
      choices: [
        { name: '📊 Ver estado general (Status)', value: 'status' },
        { name: '🚀 Iniciar servicios (Selección múltiple)', value: 'up_multiple' },
        { name: '🛑 Detener todos los servicios', value: 'down_all' },
        { name: '⚙️  Gestionar un servicio específico', value: 'manage_service' },
        new inquirer.Separator(),
        { name: '🚪 Salir', value: 'exit' }
      ]
    }
  ]);

  switch (action) {
    case 'status':
      showStatus();
      break;
    case 'up_multiple':
      await startMultipleServices();
      break;
    case 'down_all':
      runCmd('docker compose down');
      await pause();
      showMainMenu();
      break;
    case 'manage_service':
      await manageServiceMenu();
      break;
    case 'exit':
      console.log(chalk.green('¡Hasta luego! 👋\n'));
      process.exit(0);
  }
}

function showStatus() {
  console.log(chalk.blue.bold('\n📊 Estado de los Contenedores:\n'));
  runCmd('docker compose ps');
  pause().then(showMainMenu);
}

async function startMultipleServices() {
  const services = getServices();
  const { selected } = await inquirer.prompt([
    {
      type: 'checkbox',
      name: 'selected',
      message: 'Selecciona los servicios que deseas iniciar (Usa barra espaciadora para marcar):',
      choices: services
    }
  ]);

  if (selected && selected.length > 0) {
    console.log(chalk.blue(`\nIniciando: ${selected.join(', ')}...`));
    runCmd(`docker compose up -d ${selected.join(' ')}`);
  } else {
    console.log(chalk.yellow('\nNo seleccionaste ningún servicio.'));
  }
  await pause();
  showMainMenu();
}

async function manageServiceMenu() {
  const services = getServices();
  if (services.length === 0) {
    console.log(chalk.yellow('No se encontraron servicios.'));
    await pause();
    return showMainMenu();
  }

  const { service } = await inquirer.prompt([
    {
      type: 'list',
      name: 'service',
      message: 'Selecciona un servicio para gestionar:',
      choices: [...services, new inquirer.Separator(), { name: '⬅️  Volver al menú principal', value: 'back' }]
    }
  ]);

  if (service === 'back') return showMainMenu();

  await serviceActionMenu(service);
}

async function serviceActionMenu(service) {
  console.clear();
  console.log(chalk.magenta.bold(`\n🔧 Gestionando servicio: ${chalk.white.bold(service)}\n`));

  const { action } = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: `Acción para ${service}:`,
      choices: [
        { name: '▶️  Iniciar', value: 'start' },
        { name: '⏹️  Detener', value: 'stop' },
        { name: '🔄 Reiniciar', value: 'restart' },
        { name: '📄 Ver Logs (Tiempo real)', value: 'logs' },
        { name: '📈 Ver Estadísticas (CPU/RAM)', value: 'stats' },
        new inquirer.Separator(),
        { name: '⬅️  Volver atrás', value: 'back' }
      ]
    }
  ]);

  switch (action) {
    case 'start':
      runCmd(`docker compose up -d ${service}`);
      await pause();
      break;
    case 'stop':
      runCmd(`docker compose stop ${service}`);
      await pause();
      break;
    case 'restart':
      runCmd(`docker compose restart ${service}`);
      await pause();
      break;
    case 'logs':
      console.log(chalk.yellow(`\nMostrando logs para ${service} (Presiona Ctrl+C para salir):\n`));
      // Usar spawn para poder matar el proceso o que se quede en loop
      try {
        execSync(`docker compose logs -f ${service}`, { cwd: composeDir, stdio: 'inherit' });
      } catch(e) { /* user aborted */ }
      break;
    case 'stats':
      console.log(chalk.yellow(`\nMostrando estadísticas para ${service} (Presiona Ctrl+C para salir):\n`));
      try {
        // Find container name first
        const psOutput = runCmd(`docker compose ps -q ${service}`, true).trim();
        if (psOutput) {
           execSync(`docker stats ${psOutput}`, { stdio: 'inherit' });
        } else {
           console.log(chalk.red('El contenedor no está corriendo.'));
           await pause();
        }
      } catch(e) { /* user aborted */ }
      break;
    case 'back':
      return manageServiceMenu();
  }
  
  await serviceActionMenu(service);
}

async function pause() {
  const { continue: _ } = await inquirer.prompt([{
    type: 'input',
    name: 'continue',
    message: chalk.gray('Presiona Enter para continuar...')
  }]);
}

showMainMenu().catch(err => console.error(chalk.red('Error no manejado:'), err));
