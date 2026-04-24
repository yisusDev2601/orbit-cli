#!/usr/bin/env node

// index.js — Entry point only

process.stdin.setMaxListeners(0);

import { mainMenu } from './menus/main.js';
import { log } from './lib/ui.js';

mainMenu().catch(err => log.error(`Error no manejado: ${err}`));
