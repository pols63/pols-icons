#!/usr/bin/env node
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const logger_1 = require("./logger");
const commands = __importStar(require("./commands"));
const action = process.argv[2];
if (!action)
    (0, logger_1.logger)({ label: 'POLS-ICONS', description: `Se requiere especifique un comando. Escriba "help" para obtener ayuda.`, theme: logger_1.Themes.error, exit: true });
if (!commands[action]) {
    (0, logger_1.logger)({ label: 'POLS-ICONS', description: `Comando no válido. Escriba "help" para obtener ayuda.`, theme: logger_1.Themes.error, exit: true });
}
else {
    commands[action](...process.argv.filter((arg, i) => i > 2));
}
