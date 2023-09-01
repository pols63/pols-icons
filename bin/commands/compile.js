"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const path = require("path");
const logger_1 = require("../logger");
const logger = (params) => (0, logger_1.logger)({ ...params, label: 'CREATE' });
const getConfig = (configFilePath) => {
    try {
        return require(configFilePath).default;
    }
    catch (err) {
        logger({ description: `Ocurrió un error al intentar cargar el archivo "config.ts".`, body: err, theme: logger_1.Themes.error, exit: true });
    }
};
exports.default = () => {
    const currentPath = path.join(__dirname, '../../test');
    const configFilePath = path.join(currentPath, 'config.ts');
    if (!fs.existsSync(configFilePath))
        logger({ description: `Se requiere el archivo "config.ts" en este directorio.`, theme: logger_1.Themes.error, exit: true });
    const config = getConfig(configFilePath);
    if (!config?.fontName)
        logger({ description: `No se ha definido la propiedad "fontName" en el archivo de configuración. El archivo "config.ts" no es un archivo válido`, theme: logger_1.Themes.error, exit: true });
    const fontName = config.fontName;
    if (!fontName.match(/^[a-z]+?[a-z0-9\-\_]*$/i))
        logger({ description: `Sólo permitido números, letras y guiones para el nombre de la fuente`, theme: logger_1.Themes.error, exit: true });
    if (config.codepointRanges != null && !(config.codepointRanges instanceof Array))
        logger({ description: `La propiedad "codepointRanges" en el archivo de configuraciòn debe ser un arreglo`, theme: logger_1.Themes.error, exit: true });
    for (const [i, range] of config.codepointRanges.entries()) {
        if (!(range instanceof Array))
            logger({ description: `El elemento "codepointRanges[${i}]" debe ser un arreglo en el archivo de configuración`, theme: logger_1.Themes.error, exit: true });
    }
    const iconstPath = path.join(currentPath, 'icons');
    if (!fs.existsSync(iconstPath))
        logger({ description: `No se encontró el directorio "ícons"`, theme: logger_1.Themes.error, exit: true });
    const icons = fs.readdirSync(iconstPath);
    if (!icons.filter(icon => icon.match(/\.svg$/)).length)
        logger({ description: `El directorio "icons" debe contener al menos un archivo con extensión "svg".`, theme: logger_1.Themes.error, exit: true });
};
