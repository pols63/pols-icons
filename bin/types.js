"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.workPath = void 0;
const fs = require("fs");
const path = require("path");
const mode = fs.existsSync(path.join(__dirname, 'dev')) ? 'DEV' : 'PROD';
exports.workPath = mode == 'DEV' ? path.join(__dirname, '../test') : process.cwd();
