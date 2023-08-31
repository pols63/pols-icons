"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const fs = require("fs");
const logger_1 = require("../logger");
const logger = (params) => (0, logger_1.logger)({ ...params, label: 'CREATE' });
const createIconsFolder = (iconsPath) => {
    fs.mkdirSync(iconsPath);
    logger({ description: `Directorio "icons" creado`, theme: logger_1.Themes.success });
};
exports.default = (fontName) => {
    if (!fontName)
        logger({ description: `Debe especificar el nombre de la fuente como parámetro de este comando`, theme: logger_1.Themes.error, exit: true });
    if (!fontName.match(/^[a-z]+?[a-z0-9\-\_]*$/i))
        logger({ description: `Sólo permitido números, letras y guiones para el nombre de la fuente`, theme: logger_1.Themes.error, exit: true });
    const pathDest = process.cwd();
    const configFilePath = path.join(pathDest, 'config.ts');
    if (!fs.existsSync(configFilePath)) {
        const templateConfig = fs.readFileSync(path.join(__dirname, '../../resources', 'config.template'), { encoding: 'utf-8' }).replace(/@@fontName/g, fontName);
        fs.writeFileSync(configFilePath, templateConfig, { encoding: 'utf8' });
        logger({ description: `Archivo "config.ts" creado.`, theme: logger_1.Themes.success });
    }
    else {
        logger({ description: `Ya existe el archivo "config.ts" en este directorio. Si quiere rehacerlo, elimine primero el archivo existente.`, theme: logger_1.Themes.warning });
    }
    const iconsPath = path.resolve(pathDest, 'icons');
    if (!fs.existsSync(iconsPath)) {
        createIconsFolder(iconsPath);
    }
    else {
        const stats = fs.statSync(iconsPath);
        if (!stats.isDirectory()) {
            createIconsFolder(iconsPath);
        }
        else {
            logger({ description: `Ya existe el directorio "icons" en este directorio. Si quiere rehacerlo, elimine primero el directorio existente.`, theme: logger_1.Themes.warning });
        }
    }
};
