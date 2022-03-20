#!/usr/bin/env node

require('./utilities')
const notifier = require('./notifier')
const fs = require('fs');

const action = process.argv[2]

if (!action) notifier({ title: `Se requiere especifique un comando. Escriba "help" para obtener ayuda.`, error: true, exit: true })

/* Lista de comandos */
const commands = require('./commands')

const toExecute = commands[action]

if (!toExecute) notifier({ title: `No se reconoce el comando "${action}". Escriba "help" para obtener ayuda.`, error: true, exit: true })

toExecute.do(...process.argv.filter((arg, i) => i > 2))