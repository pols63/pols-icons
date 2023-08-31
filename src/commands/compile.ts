import fs = require('fs')
import path = require('path')
import { LogParams, Themes, logger as originalLogger } from "../logger"

const logger = (params: Partial<LogParams>) => originalLogger({ ...params, label: 'CREATE' })

const getConfig = (configFilePath: string): { fontName: string, codepointRanges: [number, number][] } => {
	try {
		return require(configFilePath).default
	} catch (err) {
		logger({ description: `Ocurrió un error al intentar cargar el archivo "config.ts".`, body: err, theme: Themes.error, exit: true })
	}
}

export default () => {
	// const currentPath = process.cwd()
	const currentPath = path.join(__dirname, '../../test')

	/* Carga el archivo de configuración */
	const configFilePath = path.join(currentPath, 'config.ts');
	if (!fs.existsSync(configFilePath)) logger({ description: `Se requiere el archivo "config.ts" en este directorio.`, theme: Themes.error, exit: true })
	const config = getConfig(configFilePath)

	/* Valida el nombre de la fuente */
	if (!config?.fontName) logger({ description: `No se ha definido la propiedad "fontName" en el archivo de configuración. El archivo "config.ts" no es un archivo válido`, theme: Themes.error, exit: true })
	const fontName = config.fontName
	if (!fontName.match(/^[a-z]+?[a-z0-9\-\_]*$/i)) logger({ description: `Sólo permitido números, letras y guiones para el nombre de la fuente`, theme: Themes.error, exit: true })

	/* Valida la estructura de la propiedad "codepointRanges" */
	if (config.codepointRanges != null && !(config.codepointRanges instanceof Array)) logger({ description: `La propiedad "codepointRanges" en el archivo de configuraciòn debe ser un arreglo`, theme: Themes.error, exit: true })
	for (const [i, range] of config.codepointRanges.entries()) {
		if (!(range instanceof Array)) logger({ description: `El elemento "codepointRanges[${i}]" debe ser un arreglo en el archivo de configuración`, theme: Themes.error, exit: true })
	}

	/* Valida la existencia de la carpeta de íconos. */
	const iconstPath = path.join(currentPath, 'icons');
	if (!fs.existsSync(iconstPath)) logger({ description: `No se encontró el directorio "ícons"`, theme: Themes.error, exit: true })

	/* Valida que la carpeta "icons" tenga archivos svg */
	const icons = fs.readdirSync(iconstPath)
	if (!icons.filter(icon => icon.match(/\.svg$/)).length) logger({ description: `El directorio "icons" debe contener al menos un archivo con extensión "svg".`, theme: Themes.error, exit: true })

	// /* Crea la carpeta de destino */
	// const distPath = path.join(currentPath, 'dist')
	// const createDistPath = () => {
	// 	fs.mkdirSync(distPath)
	// 	notifier({ title: `Se ha creado la carpeta "dist".` })
	// }
	// if (fs.existsSync(distPath)) {
	// 	const stats = fs.statSync(distPath)
	// 	if (stats.isDirectory()) fs.rmSync(distPath, { recursive: true })
	// 	createDistPath()
	// } else {
	// 	createDistPath()
	// }

	// /* Si no existe el archivo map.json, se crea */
	// const mapPath = path.join(currentPath, 'map.json')
	// if (!fs.existsSync(mapPath)) fs.writeFileSync(mapPath, `{}`, { encoding: 'utf-8' })

	// /* Crea los íconos */
	// require('icon.font')({
	// 	fontName: fontName,
	// 	src: iconstPath,
	// 	dest: distPath,
	// 	configFile: mapPath,
	// 	saveConfig: true,
	// 	image: false,
	// 	html: true,
	// 	htmlTemplate: path.join(__dirname, '..', 'resources', 'html.hbs'),
	// 	outputHtml: true,
	// 	css: true,
	// 	cssTemplate: path.join(__dirname, '..', 'resources', 'css.hbs'),
	// 	outputCss: true,
	// 	fixedWidth: true,
	// 	normalize: true,
	// 	silent: true,
	// 	types: ['woff2', 'woff', 'ttf', 'eot', 'svg'],
	// 	templateOptions: {
	// 		classPrefix: 'ic-',
	// 		baseSelector: 'pf-' + fontName.toLowerCase(),
	// 		pathNameLower: fontName.toLowerCase()
	// 		//baseClassname: '_icon',
	// 	},
	// 	codepointRanges: config.codepointRanges ?? [
	// 		[97, 122], // a - z
	// 		[65, 90], // A - Z
	// 		[48, 57], // 0 - 9
	// 		[0xe001, Infinity] //57345 - infinito
	// 	]
	// }).then(function () {
	// 	const fontsPath = path.resolve(distPath, fontName.toLowerCase())
	// 	fs.mkdirSync(fontsPath)

	// 	/* Reubica los archivos de las fuentes en un subdirectorio */
	// 	const extensions = ['css', 'eot', 'svg', 'ttf', 'woff', 'woff2']
	// 	for (const extension of extensions) {
	// 		fs.copyFileSync(path.resolve(distPath, fontName + '.' + extension), path.resolve(fontsPath, fontName.toLowerCase() + '.' + extension))
	// 		fs.unlinkSync(path.resolve(distPath, fontName.toLowerCase() + '.' + extension))
	// 	}
	// 	fs.renameSync(path.resolve(distPath, fontName + '.html'), path.resolve(distPath, 'index.html'));

	// 	/* Modifica el archivo css, de forma que los url() apunten a los archivos con minúculas y no con mayúsculas como lo deja esta herramienta */
	// 	const cssFilePath = path.join(fontsPath, `${fontName}.css`)
	// 	const content = fs.readFileSync(cssFilePath, { encoding: 'utf8' }).replace(new RegExp(`${fontName}\\.`, 'g'), `${fontName.toLowerCase()}.`)
	// 	fs.writeFileSync(cssFilePath, content, { encoding: 'utf8' })

	// 	notifier({ title: "Fuente creada." })
	// }).catch(console.error)
}