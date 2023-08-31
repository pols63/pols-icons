import fs = require('fs')
import path = require('path')
import { TRecord } from "./types"
import { Utilities } from "./utilities"

export enum Themes {
	info = 'info',
	success = 'success',
	warning = 'warning',
	error = 'error',
	debug = 'debug',
}

export type LogParams = {
	date?: Date
	label: string
	description?: string
	body?: string | TRecord | string[]
	exit?: boolean
	theme?: Themes
	tags?: string[]
	showInConsole?: boolean
	logPath?: string
}

export const logger = ({ label, description, body, exit = false, theme = Themes.info, tags = [], showInConsole = true, logPath, date = null }: LogParams): string => {
	/* Determina el color */
	let bgColor: 'bg-red' | 'bg-yellow' | 'bg-green' | 'bg-cyan' = 'bg-cyan'
	let fgColor: 'fg-white' | 'fg-black' = 'fg-black'
	switch (theme) {
		case Themes.error:
			fgColor = 'fg-white'
			bgColor = 'bg-red'
			break
		case Themes.warning:
			bgColor = 'bg-yellow'
			break
		case Themes.success:
			bgColor = 'bg-green'
			break
	}

	const now = date ?? new Date
	const nowString = Utilities.Date.format(now, '@dd/@mm/@y @hh:@ii:@ss')

	/* Mensaje en consola */
	if (showInConsole) {
		const logMethod = theme == Themes.error ? 'error' : 'log'
		const headers = [
			// Utilities.String.ansiColor(`<bg-black><fg-cyan>[${nowString}]</fg-cyan></bg-black>`),
			Utilities.String.ansiColor(`<${bgColor}><${fgColor}><bright> ${label} >>> </bright></${fgColor}></${bgColor}>`)
		]
		if (description) headers.push(Utilities.String.ansiColor(`<bg-white><fg-black> ${description} </fg-black></bg-white>`))
		headers.push(...tags.map(t => Utilities.String.ansiColor(`<bg-blue><fg-black> ${t} </fg-black></bg-blue>`)))
		console.log(headers.join(' '))
		if (body instanceof Array) {
			for (const b of body) {
				console[logMethod](b)
			}
		} else if (body instanceof Error) {
			console[logMethod](body.stack)
		} else if (typeof body == 'string') {
			console[logMethod](body)
		}
	}

	/* Mensaje en archivo */

	if (logPath) {
		if (!fs.existsSync(logPath)) {
			/* Si no existe la carpeta para los logs, se intentará crear automáticamente */
			try {
				fs.mkdirSync(logPath)
			} catch (err) {
				return logger({ label: 'LOG', description: `Ocurrió un error al intentar crear el directorio para los logs del sistema en '${logPath}'`, body: err, exit: true, showInConsole: true })
			}
		}
	}
	const headers = [
		(() => {
			switch (theme) {
				case Themes.error:
					return '[ ERROR ]'
				case Themes.warning:
					return '[ WARNING ]'
				case Themes.success:
					return '[ SUCCESS ]'
				case Themes.info:
					return '[ INFO ]'
				case Themes.debug:
					return '[ DEBUG ]'
			}
		})(),
		`[ ${nowString} ]`,
		`[ ${label} >>> ]`
	]
	if (description) headers.push(description)
	headers.push(...tags.map(t => `[ ${t} ]`))
	let bodyFile = ''
	if (body instanceof Array) {
		bodyFile = body.join('\n')
	} else if (body instanceof Error) {
		bodyFile = (body as Error).stack ?? ''
	} else if (typeof body == 'string') {
		bodyFile = body
	}
	const response = `${headers.join(' ')}${bodyFile ? `\n${bodyFile}` : ''}`

	if (logPath) fs.appendFileSync(path.join(logPath, `LOGS ${Utilities.Date.format(now, '@y-@mm-@dd')}.log`), `${response}\n`, { encoding: 'utf-8' })

	/* Si se ha dado la opción, se sale del programa */
	if (exit) process.exit()

	return response
}