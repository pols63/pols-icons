#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const logger_1 = require("./logger");
const commands = require("./commands");
const action = process.argv[2];
if (!action)
    (0, logger_1.logger)({ label: 'POLS-ICONS', description: `Se requiere especifique un comando. Escriba "help" para obtener ayuda.`, theme: logger_1.Themes.error, exit: true });
if (!commands[action]) {
    (0, logger_1.logger)({ label: 'POLS-ICONS', description: `Comando no válido. Escriba "help" para obtener ayuda.`, theme: logger_1.Themes.error, exit: true });
}
else {
    commands[action](...process.argv.filter((arg, i) => i > 2));
}
