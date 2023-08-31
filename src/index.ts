#!/usr/bin/env node

import { Themes, logger } from "./logger"
import * as commands from './commands'

const action = process.argv[2]
if (!action) logger({ label: 'POLS-ICONS', description: `Se requiere especifique un comando. Escriba "help" para obtener ayuda.`, theme: Themes.error, exit: true })

/* Lista de comandos */
if (!commands[action]) {
	logger({ label: 'POLS-ICONS', description: `Comando no válido. Escriba "help" para obtener ayuda.`, theme: Themes.error, exit: true })
} else {
	commands[action](...process.argv.filter((arg, i) => i > 2))
}