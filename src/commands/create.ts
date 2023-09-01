import path = require('path')
import fs = require('fs')
import { LogParams, Themes, logger as originalLogger } from "../logger"
import { workPath } from '../types'

const logger = (params: Partial<LogParams>) => originalLogger({ ...params, label: 'CREATE' })

const createIconsFolder = (iconsPath: string) => {
	fs.mkdirSync(iconsPath)
	logger({ description: `Directorio "icons" creado`, theme: Themes.success })
}

export default (fontName: string) => {
	if (!fontName) logger({ description: `Debe especificar el nombre de la fuente como parámetro de este comando`, theme: Themes.error, exit: true })
	if (!fontName.match(/^[a-z]+?[a-z0-9\-\_]*$/i)) logger({ description: `Sólo permitido números, letras y guiones para el nombre de la fuente`, theme: Themes.error, exit: true })

	/* Valida que no exista ya un archivo de configuración en la ruta deseada */
	const configFilePath = path.join(workPath, 'config.ts')
	if (!fs.existsSync(configFilePath)) {
		/* Carga el template */
		const templateConfig =
			fs.readFileSync(path.join(__dirname, '../../resources', 'config.template'), { encoding: 'utf-8' })
				.replace(/@@fontNameLower/g, fontName.toLowerCase())
				.replace(/@@fontName/g, fontName)
		fs.writeFileSync(configFilePath, templateConfig, { encoding: 'utf8' })
		logger({ description: `Archivo "config.ts" creado.`, theme: Themes.success })
	} else {
		logger({ description: `Ya existe el archivo "config.ts" en este directorio. Si quiere rehacerlo, elimine primero el archivo existente.`, theme: Themes.warning })
	}

	const iconsPath = path.resolve(workPath, 'icons')

	if (!fs.existsSync(iconsPath)) {
		createIconsFolder(iconsPath)
	} else {
		const stats = fs.statSync(iconsPath)
		if (!stats.isDirectory()) {
			createIconsFolder(iconsPath)
		} else {
			logger({ description: `Ya existe el directorio "icons" en este directorio. Si quiere rehacerlo, elimine primero el directorio existente.`, theme: Themes.warning })
		}
	}
}