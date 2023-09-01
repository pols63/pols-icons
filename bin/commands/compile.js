"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const path = require("path");
const iconFont = require("icon.font");
const logger_1 = require("../logger");
const types_1 = require("../types");
const logger = (params) => (0, logger_1.logger)({ ...params, label: 'CREATE' });
const fileConfigName = 'pols-icons-config.json';
const getConfig = (configFilePath) => {
    try {
        return require(configFilePath);
    }
    catch (err) {
        logger({ description: `Ocurrió un error al intentar cargar el archivo "${fileConfigName}"`, body: err, theme: logger_1.Themes.error, exit: true });
    }
};
exports.default = () => {
    const configFilePath = path.join(types_1.workPath, fileConfigName);
    if (!fs.existsSync(configFilePath))
        logger({ description: `Se requiere el archivo "${fileConfigName}" en este directorio.`, theme: logger_1.Themes.error, exit: true });
    const config = getConfig(configFilePath);
    if (!config?.fontName)
        logger({ description: `No se ha definido la propiedad "fontName" en el archivo de configuración. El archivo "${fileConfigName}" no es un archivo válido`, theme: logger_1.Themes.error, exit: true });
    const fontName = config.fontName;
    if (!fontName.match(/^[a-z]+?[a-z0-9\-\_]*$/i))
        logger({ description: `Sólo permitido números, letras y guiones para el nombre de la fuente`, theme: logger_1.Themes.error, exit: true });
    const iconstPath = path.join(types_1.workPath, 'icons');
    if (!fs.existsSync(iconstPath))
        logger({ description: `No se encontró el directorio "ícons"`, theme: logger_1.Themes.error, exit: true });
    const icons = fs.readdirSync(iconstPath);
    if (!icons.filter(icon => icon.match(/\.svg$/)).length)
        logger({ description: `El directorio "icons" debe contener al menos un archivo con extensión "svg".`, theme: logger_1.Themes.error, exit: true });
    const distPath = path.join(types_1.workPath, 'dist');
    if (fs.existsSync(distPath)) {
        const stats = fs.statSync(distPath);
        if (stats.isDirectory())
            fs.rmSync(distPath, { recursive: true });
    }
    fs.mkdirSync(distPath);
    logger({ description: `Se ha creado la carpeta "dist"`, theme: logger_1.Themes.success });
    const mapPath = path.join(types_1.workPath, 'map.json');
    if (!fs.existsSync(mapPath))
        fs.writeFileSync(mapPath, `{}`, { encoding: 'utf-8' });
    iconFont({
        fontName: fontName,
        src: iconstPath,
        dest: distPath,
        configFile: mapPath,
        saveConfig: true,
        image: false,
        html: true,
        htmlTemplate: path.join(__dirname, '../../resources/html.hbs'),
        outputHtml: true,
        css: true,
        cssTemplate: path.join(__dirname, '../../resources/css.hbs'),
        outputCss: true,
        fixedWidth: true,
        normalize: true,
        silent: true,
        types: ['woff2', 'woff', 'ttf', 'eot', 'svg'],
        templateOptions: {
            classPrefix: config.iconClassPrefix ?? 'i-',
            baseSelector: config.baseClass ?? (fontName.toLowerCase() + '-font'),
            pathNameLower: fontName.toLowerCase(),
        },
        codepointRanges: [
            [0xe001, Infinity]
        ]
    }).then(() => {
        const fontsPath = path.resolve(distPath, fontName.toLowerCase());
        fs.mkdirSync(fontsPath);
        const extensions = ['css', 'eot', 'svg', 'ttf', 'woff', 'woff2'];
        for (const extension of extensions) {
            fs.copyFileSync(path.resolve(distPath, fontName + '.' + extension), path.resolve(fontsPath, fontName.toLowerCase() + '.' + extension));
            fs.unlinkSync(path.resolve(distPath, fontName.toLowerCase() + '.' + extension));
        }
        fs.renameSync(path.resolve(distPath, fontName + '.html'), path.resolve(distPath, 'index.html'));
        const cssFilePath = path.join(fontsPath, `${fontName}.css`);
        const content = fs.readFileSync(cssFilePath, { encoding: 'utf8' }).replace(new RegExp(`${fontName}\\.`, 'g'), `${fontName.toLowerCase()}.`);
        fs.writeFileSync(cssFilePath, content, { encoding: 'utf8' });
        logger({ description: "Fuente creada", theme: logger_1.Themes.success });
    }).catch(error => logger({ description: 'Error en la compilación de la fuente', body: error, theme: logger_1.Themes.error }));
};
