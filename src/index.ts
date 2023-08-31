#!/usr/bin/env node

import { Themes, logger } from "./logger"
import * as commands from './commands'

const action = process.argv[2]
if (!action) logger({ label: 'POLS-ICONS', description: `Se requiere especifique un comando. Escriba "help" para obtener ayuda.`, theme: Themes.error, exit: true })

/* Lista de comandos */
if (action == 'help') {

}

// const toExecute = commands[action]

// if (!toExecute) notifier({ title: `No se reconoce el comando "${action}". Escriba "help" para obtener ayuda.`, error: true, exit: true })

// toExecute.do(...process.argv.filter((arg, i) => i > 2))