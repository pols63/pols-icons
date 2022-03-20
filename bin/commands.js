const fs = require('fs')
const path = require('path')
const notifier = require('./notifier')

const commands = {
	create: {
		description: 'Crea el archivo "config.json" y la carpeta "icons" en el directorio actual. Requiere especifique el nombre de la fuente de íconos.',
		do(fontName) {
			if (!fontName) notifier({ title: `Debe especificar el nombre de la fuente a crear.`, error: true, exit: true })
			if (!fontName.match(/^[a-z]+?[a-z0-9\-\_]*$/)) notifier({ title: `Sólo permitido números, letras y guiones para el nombre de la fuente.`, error: true, exit: true })

			const pathDest = process.cwd()

			/* Valida que no exista ya un archivo de configuración en la ruta deseada */
			const configFilePath = path.join(pathDest, 'config.js')
			if (!fs.existsSync(configFilePath)) {
				/* CArga el template */
				const templateConfig = fs.readFileSync(path.join(__dirname, '..', 'resources', 'config.template'), { encoding: 'utf-8' }).replace(/@@fontName/g, fontName)
				fs.writeFileSync(configFilePath, templateConfig, { encoding: 'utf8' })
				notifier({ title: `Archivo "config.js" creado.` })
			} else {
				notifier({ title: `Ya existe el archivo "config.js" en este directorio. Si quiere rehacerlo, elimine primero el archivo existente.`, error: true })
			}

			const iconsPath = path.resolve(pathDest, 'icons')
			const createIconsFolder = () => {
				fs.mkdirSync(iconsPath)
				notifier({ title: `Carpeta "icons" creada.` })
			}

			if (!fs.existsSync(iconsPath)) {
				createIconsFolder()
			} else {
				const stats = fs.statSync(iconsPath)
				if (!stats.isDirectory()) {
					createIconsFolder()
				} else {
					notifier({ title: `Ya existe la carpeta "icons" en este directorio. Si quiere rehacerlo, elimine primero el directorio existente.`, error: true })
				}
			}
		}
	},
	compile: {
		description: 'Crea la fuente de íconos según el contenido en la carpeta "icons" y lo definido en el archivo "config.js". En caso se encuentre, utilizará el archivo "map.json".',
		do() {
			const currentPath = process.cwd()

			/* Carga el archivo de configuración */
			const configFilePath = path.join(currentPath, 'config.js');
			if (!fs.existsSync(configFilePath)) notifier({ title: `Se requiere el archivo "config.js" en este directorio.`, error: true, exit: true })
			const config = (_ => {
				try {
					return require(configFilePath);
				} catch (err) {
					notifier({ title: `Ocurrió un error al intentar cargar el archivo "config.js".`, body: err, error: true, exit: true })
				}
			})();

			/* Valida la existencia de la carpeta de íconos. */
			const iconstPath = path.join(currentPath, 'icons');
			if (!fs.existsSync(iconstPath)) notifier({ title: `Se requiere la existencia de la carpeta de "ícons".`, error: true, exit: true })

			/* Valida que la carpeta "icons" tenga archivos svg */
			const icons = fs.readdirSync(iconstPath)
			if (!icons.filter(icon => icon.match(/\.svg$/)).length) notifier({ title: `La carpeta "icons" debe contener al menos un archivo ".svg".`, error: true, exit: true })

			/* Validaciones */
			if (!config.fontName) notifier({ title: `No se ha definido la propiedad "fontName" en el archivo de configuración.`, error: true, exit: true })
			const fontName = config.fontName

			if (config.codepointRanges != null && Utilities.getType(config.codepointRanges) !== 'Array') notifier({ title: `La propiedad "codepointRanges" en el archivo de configuraciòn debe ser un arreglo.`, error: true, exit: true })
			for (const [i, range] of config.codepointRanges.entries()) {
				if (Utilities.getType(range) !== 'Array') notifier({ title: `El elemento "codepointRanges[${i}]" debe ser un arreglo en el archivo de configuración`, error: true, exit: true })
			}

			/* Crea la carpeta de destino */
			const distPath = path.join(currentPath, 'dist')
			const createDistPath = () => {
				fs.mkdirSync(distPath)
				notifier({ title: `Se ha creado la carpeta "dist".` })
			}
			if (fs.existsSync(distPath)) {
				const stats = fs.statSync(distPath)
				if (stats.isDirectory()) fs.rmSync(distPath, { recursive: true })
				createDistPath()
			} else {
				createDistPath()
			}

			/* Si no existe el archivo map.json, se crea */
			const mapPath = path.join(currentPath, 'map.json')
			if (!fs.existsSync(mapPath)) fs.writeFileSync(mapPath, `{}`, { encoding: 'utf-8' })

			/* Crea los íconos */
			require('icon.font')({
				fontName: fontName,
				src: iconstPath,
				dest: distPath,
				configFile: mapPath,
				saveConfig: true,
				image: false,
				html: true,
				htmlTemplate: path.join(__dirname, '..', 'resources', 'html.hbs'),
				outputHtml: true,
				css: true,
				cssTemplate: path.join(__dirname, '..', 'resources', 'css.hbs'),
				outputCss: true,
				fixedWidth: true,
				normalize: true,
				silent: true,
				types: ['woff2', 'woff', 'ttf', 'eot', 'svg'],
				templateOptions: {
					classPrefix: 'ic-',
					baseSelector: 'pf-' + fontName.toLowerCase(),
					pathNameLower: fontName.toLowerCase()
					//baseClassname: '_icon',
				},
				codepointRanges: config.codepointRanges ?? [
					[97, 122], // a - z
					[65, 90], // A - Z
					[48, 57], // 0 - 9
					[0xe001, Infinity] //57345 - infinito
				]
			}).then(function () {
				const fontsPath = path.resolve(distPath, fontName.toLowerCase())
				fs.mkdirSync(fontsPath)

				/* Reubica los archivos de las fuentes en un subdirectorio */
				const extensions = ['css', 'eot', 'svg', 'ttf', 'woff', 'woff2']
				for (const extension of extensions) {
					fs.copyFileSync(path.resolve(distPath, fontName + '.' + extension), path.resolve(fontsPath, fontName.toLowerCase() + '.' + extension))
					fs.unlinkSync(path.resolve(distPath, fontName.toLowerCase() + '.' + extension))
				}
				fs.renameSync(path.resolve(distPath, fontName + '.html'), path.resolve(distPath, 'index.html'));

				/* Modifica el archivo css, de forma que los url() apunten a los archivos con minúculas y no con mayúsculas como lo deja esta herramienta */
				const cssFilePath = path.join(fontsPath, `${fontName}.css`)
				const content = fs.readFileSync(cssFilePath, { encoding: 'utf8' }).replace(new RegExp(`${fontName}\\.`, 'g'), `${fontName.toLowerCase()}.`)
				fs.writeFileSync(cssFilePath, content, { encoding: 'utf8' })

				notifier({ title: "Fuente creada." })
			}).catch(console.error)
		}
	},
	help: {
		description: 'Muestra el documento de ayuda',
		do() {
			notifier({
				title: `Especifique uno de los siguientes comandos:`, exit: true, body: Object.keys(commands).map(command => {
					return ` ${command.fgYellow}: ${commands[command].description}`
				}).join('\n')
			})
		}
	}
}

module.exports = commands