import fs = require('fs')
import stream = require('stream')
import { TRecord } from './types'

export type Languages = 'spanish' | 'english'

const Days = {
	spanish: ['lunes', 'martes', 'mierrcoles', 'jueves', 'viernes', 'sabado', 'domingo'],
	english: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
}

const Months = {
	spanish: ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'],
	english: ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'],
}

export type IterationFunction<T> = (element: T, index: number) => boolean

export type ToMatch = {
	ne?: string | number,
	eq?: string | number,
	lt?: string | number,
	lte?: string | number,
	gt?: string | number,
	gte?: string | number,
	in?: number[],
}

export const Utilities = {
	FS: {
		existsDirectory: (filePath: string): boolean => {
			if (!fs.existsSync(filePath)) return false
			const stats = fs.statSync(filePath)
			return stats.isDirectory()
		},
		existsFile: (filePath: string): boolean => {
			if (!fs.existsSync(filePath)) return false
			const stats = fs.statSync(filePath)
			return stats.isFile()
		}
	},
	Object: {
		clone(obj: TRecord): TRecord {
			const cloned: TRecord = {}
			for (const property in obj) {
				const reference = obj[property]
				if (typeof reference == 'object') {
					cloned[property] = Utilities.Object.clone(reference as TRecord)
				} else {
					cloned[property] = reference
				}
			}
			return cloned
		},
		getValue(target: TRecord, path: string, stringToObject = true): unknown {
			const arr = path.split(/\./)
			let reference: unknown = target
			if (!reference) return
			if (reference instanceof Array) reference = reference[0]
			for (let i = 0; i < arr.length; i++) {
				reference = (reference as TRecord)[arr[i]]
				if (reference instanceof Array && i < arr.length - 1) {
					reference = reference[0]
				} else if (typeof reference == 'string' && i < arr.length - 1 && stringToObject) {
					/* Si la referencia es una cadena y aún hay más propiedades para recorrer, se intenta convertir la cadena en objeto */
					try {
						reference = JSON.parse(reference)
					} catch { /**/ }
				}
				if (!reference) return reference
			}
			return reference
		},
		setValue(target: TRecord, path: string, value: unknown): void {
			const arr = path.split(/\./)
			let reference: unknown = target
			if (!reference) return
			for (let i = 0; i < arr.length - 1; i++) {
				if ((reference as TRecord)[arr[i]] === undefined && i < arr.length - 1) {
					(reference as TRecord)[arr[i]] = {}
				}
				reference = (reference as TRecord)[arr[i]]
				if (reference instanceof Array) reference = reference[0]
				if (!reference) return
			}
			if (value !== undefined) {
				(reference as TRecord)[arr[arr.length - 1]] = value
			} else {
				delete (reference as TRecord)[arr[arr.length - 1]]
			}
		}
	},
	Array: {
		swapItems(array: unknown[], oldIndex: number, newIndex: number) {
			if (oldIndex < 0 || oldIndex >= array.length) throw new Error(`'oldIndex' está fuera de los límites permitidos`)
			if (Math.ceil(oldIndex) != oldIndex) throw new Error(`'oldIndex' debe ser un número entero`)
			if (newIndex < 0 || newIndex >= array.length) throw new Error(`'oldIndex' está fuera de los límites permitidos`)
			if (Math.ceil(newIndex) != newIndex) throw new Error(`'oldIndex' debe ser un número entero`)
			if (oldIndex == newIndex) throw new Error(`'oldIndex' y 'newIndex' no deben tener el mismo valor`)

			const el1 = array[oldIndex]
			const el2 = array[newIndex]
			array.splice(newIndex, 1, el1)
			if (el2) {
				array.splice(oldIndex, 1, el2)
			} else {
				array.splice(oldIndex, 1)
			}
		},
		moveItem(array: unknown[], oldIndex: number, newIndex: number) {
			if (oldIndex < 0 || oldIndex >= array.length) throw new Error(`'oldIndex' está fuera de los límites permitidos`)
			if (Math.ceil(oldIndex) != oldIndex) throw new Error(`'oldIndex' debe ser un número entero`)
			if (newIndex < 0 || newIndex >= array.length) throw new Error(`'oldIndex' está fuera de los límites permitidos`)
			if (Math.ceil(newIndex) != newIndex) throw new Error(`'oldIndex' debe ser un número entero`)
			if (oldIndex == newIndex) throw new Error(`'oldIndex' y 'newIndex' no deben tener el mismo valor`)

			const el1 = array[oldIndex]
			array.splice(oldIndex, 1)
			array.splice(newIndex, 0, el1)
		},
		queryOne<T>(array: T[], query: Partial<T> | IterationFunction<T>) {
			for (const [i, element] of array.entries()) {
				let success = true
				if (typeof query == 'object') {
					if (typeof element != 'object') continue
					for (const p in query) {
						const valueOfElement = Utilities.Object.getValue((element as unknown) as TRecord, p)
						const queryProperty = query[p]
						if (queryProperty == null && valueOfElement == null) continue
						if (queryProperty instanceof RegExp && typeof valueOfElement == 'string' && valueOfElement.match(queryProperty)) continue
						if (valueOfElement !== queryProperty) {
							success = false
							break
						}
					}
				} else {
					success = !!query(element, i)
				}
				if (success) {
					return element
				}
			}
			return null
		},
		query<T>(array: T[], query: Partial<T> | IterationFunction<T>) {
			const results: T[] = []
			for (const [i, element] of array.entries()) {
				let success = true
				if (typeof query == 'object') {
					if (typeof element != 'object') continue
					for (const p in query) {
						const valueOfElement = Utilities.Object.getValue((element as unknown) as TRecord, p)
						const queryProperty = query[p]
						if (queryProperty == null && valueOfElement == null) continue
						if (queryProperty instanceof RegExp && typeof valueOfElement == 'string' && valueOfElement.match(queryProperty)) continue
						if (valueOfElement !== query[p]) {
							success = false
							break
						}
					}
				} else {
					success = !!query(element, i)
				}
				if (success) results.push(element)
			}
			return results
		},
		extractOne<T>(array: T[], query: Partial<T> | IterationFunction<T>) {
			if (array == null) return null
			for (const [i, element] of array.entries()) {
				let success = true
				if (typeof query == 'object') {
					if (typeof element != 'object') continue
					for (const p in query) {
						if (Utilities.Object.getValue((element as unknown) as TRecord, p) !== query[p]) {
							success = false
							break
						}
					}
				} else {
					success = !!query(element, i)
				}
				if (success) return array.splice(i, 1)[0]
			}
			return null
		},
		extract<T>(array: T[], query: Partial<T> | IterationFunction<T>) {
			let i = 0
			const results: T[] = []
			while (i < array.length) {
				const element = array[i]
				let success = true
				if (typeof query == 'object') {
					if (typeof element != 'object') continue
					for (const p in query) {
						if (Utilities.Object.getValue((element as unknown) as TRecord, p) !== query[p]) {
							success = false
							break
						}
					}
				} else {
					success = !!query(element, i)
				}
				if (success) {
					results.push(array.splice(i, 1)[0])
				} else {
					i++
				}
			}
			return results
		},
		groupBy<T>(array: T[], setterPropertyName: (element: T, index?: number) => string | number | symbol) {
			const results: Record<string | number | symbol, T[]> = {}
			for (const [i, element] of array.entries()) {
				const propertyName = setterPropertyName(element, i)
				let reference = results[propertyName]
				if (!reference) {
					reference = []
					results[propertyName] = reference
				}
				reference.push(element)
			}
			return results
		},
		toggleElement<T>(array: T[], element: T, check: (element: T, index?: number) => boolean) {
			let index: number | null = null
			/* Busca el elemento en el arreglo y captura su índice */
			for (const [i, currentElement] of array.entries()) {
				if (check(currentElement, i)) {
					index = i
					break
				}
			}

			if (index != null) {
				array.splice(index, 1)
			} else {
				array.push(element)
			}
		},
		chunks<T>(array: T[], length: number): T[][] {
			const chunks: T[][] = []
			const currentLength = array.length
			let i = 0
			while (i < currentLength) {
				chunks.push(array.slice(i, i += length))
			}
			return chunks
		}
	},
	Date: {
		format(date: Date, mask: string, language: Languages = 'spanish'): string {
			const hours = date.getHours()
			const hours12 = (hours % 12) || 12
			const pm = hours >= 12
			if (isNaN(date.getTime())) return ''
			return mask
				.replace(/@y/g, date.getFullYear().toString())
				.replace(/@mmmm/g, Utilities.monthName(date.getMonth() + 1, false, language))
				.replace(/@mmm/g, Utilities.monthName(date.getMonth() + 1, true, language))
				.replace(/@mm/g, Utilities.padLeft(date.getMonth() + 1, 2, "0"))
				.replace(/@m/g, (date.getMonth() + 1).toString())
				.replace(/@dddd/g, Utilities.dayName(date.getDay(), false, language))
				.replace(/@ddd/g, Utilities.dayName(date.getDay(), true, language))
				.replace(/@dd/g, Utilities.padLeft(date.getDate(), 2))
				.replace(/@d/g, date.getDate().toString())
				/* 24 horas */
				.replace(/@hh/g, Utilities.padLeft(date.getHours(), 2))
				.replace(/@h/g, date.getHours().toString())
				/* 12 horas */
				.replace(/@oo/g, Utilities.padLeft(hours12, 2))
				.replace(/@o/g, hours.toString())
				.replace(/@ii/g, Utilities.padLeft(date.getMinutes(), 2))
				.replace(/@i/g, date.getMinutes().toString())
				.replace(/@ss/g, Utilities.padLeft(date.getSeconds(), 2))
				.replace(/@s/g, date.getSeconds().toString())
				.replace(/@lll/g, Utilities.padLeft(date.getMilliseconds(), 3))
				.replace(/@ll/g, Utilities.padLeft(date.getMilliseconds(), 2))
				.replace(/@l/g, date.getMilliseconds().toString())
				.replace(/@ww/g, Utilities.padLeft(Utilities.Date.getWeek(date), 2))
				.replace(/@w/g, Utilities.Date.getWeek(date).toString())
				.replace(/@eee/g, pm ? 'p.m.' : 'a.m.')
				.replace(/@ee/g, pm ? 'pm' : 'am')
				.replace(/@e/g, pm ? 'p' : 'a')
				.replace(/@EEE/g, pm ? 'P.M.' : 'A.M.')
				.replace(/@EE/g, pm ? 'PM' : 'AM')
				.replace(/@E/g, pm ? 'P' : 'A')
		},
		getWeek(date: Date) {
			const onejan = new Date(date.getFullYear(), 0, 1)
			return Math.ceil(((date.getTime() - onejan.getTime()) / 86400000 + onejan.getDay() + 1) / 7)
		},
		setTimeFromString(date: Date, time: string) {
			const temp = new Date(`${Utilities.Date.format(date, '@y-@mm-@dd')} ${time}`)
			if (isNaN(temp.getTime())) throw new Error("El valor no tiene un formato de hora válido.")
			date.setTime(temp.getTime())
		},
		clone(date: Date) {
			return new Date(date.getTime())
		},
		monthName(date: Date, shortName = false, language: Languages = 'spanish') {
			return Utilities.monthName(date.getMonth() + 1, shortName, language)
		},
		dayName(date: Date, shortName: boolean, language: Languages = 'spanish') {
			return Utilities.dayName(date.getDate(), shortName, language)
		},
		createFromTemplate(value: string, template: string) {
			let year = ''
			let month = ''
			let day = ''
			let hour = ''
			let minute = ''
			let second = ''
			let milisecond = ''
			for (let i = 0; i < template.length; i++) {
				switch (template[i]) {
					case 'y':
						year += value[i] ?? ''
						break
					case 'm':
						month += value[i] ?? ''
						break
					case 'd':
						day += value[i] ?? ''
						break
					case 'h':
						hour += value[i] ?? ''
						break
					case 'i':
						minute += value[i] ?? ''
						break
					case 's':
						second += value[i] ?? ''
						break
					case 'l':
						milisecond += value[i] ?? ''
						break
				}
			}
			if (!year) throw new Error(`No se ha encontrado el valor de año en 'template'`)
			if (!month) throw new Error(`No se ha encontrado el valor de mes en 'template'`)
			if (milisecond && !second) throw new Error(`Se debe especificar el valor de segundo cuando se ha encontrado milisegundo`)
			if (second && !minute) throw new Error(`Se debe especificar el valor de minuto cuando se ha encontrado segundo`)
			if (minute && !hour) throw new Error(`Se debe especificar el valor de hora cuando se ha encontrado minuto`)
			if (hour && !day) throw new Error(`Se debe especificar el valor de día cuando se ha encontrado hora`)

			if (!day) return new Date(Number(year), Number(month) - 1)
			if (!hour) return new Date(Number(year), Number(month) - 1, Number(day))
			if (!minute) return new Date(Number(year), Number(month) - 1, Number(day), Number(hour))
			if (!second) return new Date(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute))
			if (!milisecond) return new Date(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute), Number(second))
			return new Date(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute), Number(second), Number(milisecond))
		},
		createFromString(value: string | number) {
			if (typeof value == 'string') {
				value = value.trim()
			} else {
				value = value.toString()
			}
			const parts = value.match(/^([0-9]{2,4})([-/]?)([0-9]{2})\2([0-9]{2,4})$/)
			if (parts) {
				let year: number
				let month: number
				let day: number
				if (parts[2] == '/') {
					/* Formato de tipo de fecha DD/MM/YYYY */
					year = Number(parts[4])
					month = Number(parts[3]) - 1
					day = Number(parts[1])
				} else {
					/* Formato de tipo de fecha YYYY-MM-DD o YYYYMMDD */
					year = Number(parts[1])
					month = Number(parts[3]) - 1
					day = Number(parts[4])
				}
				const newDate = new Date(year, month, day)
				if (newDate.getDate() === day && newDate.getMonth() === month && newDate.getFullYear() === year) {
					return newDate
				}
			} else {
				const newDate = new Date(value.replace(/t|z/gi, ' '))
				if (isNaN(newDate.getTime())) {
					return
				} else {
					return newDate
				}
			}
		}
	},
	String: {
		ucWords(value: string) {
			return value.replace(/(\s|^)./g, (letter: string) => letter.toUpperCase())
		},
		left(value: string, length: number) {
			return value.substring(0, length)
		},
		right(value: string, length: number) {
			return value.substring(value.length - length)
		},
		highlight(value: string, startMark = "'", endMark = "'", tag = 'b') {
			return value.replace(new RegExp(`\\${startMark}(.+?)\\${endMark}`, 'g'), (_a: string, b: string) => `${tag}${b}${tag}`)
		},
		/* Colores para la consola */
		ansiColor(value: string) {
			const tags: Record<string, number> = {
				bright: 1,
				dim: 2,
				underscore: 4,
				blink: 5,
				'fg-black': 30,
				'fg-red': 31,
				'fg-green': 32,
				'fg-yellow': 33,
				'fg-blue': 34,
				'fg-magenta': 35,
				'fg-cyan': 36,
				'fg-white': 37,
				'bg-black': 40,
				'bg-red': 41,
				'bg-green': 42,
				'bg-yellow': 43,
				'bg-blue': 44,
				'bg-magenta': 45,
				'bg-cyan': 46,
				'bg-white': 47,
			}
			let doing = true
			while (doing) {
				const match = value.match(new RegExp(`<(${Object.keys(tags).join('|')})>(.*?)<\\/(\\1)>`, 'i'))
				if (!match) {
					doing = false
					break
				}
				const num = tags[match[1].toLowerCase()].toString()
				value = value.substring(0, match.index) + `\x1b[${num}m${match[2]}\x1b[0m` + value.substring((match.index ?? 0) + match[0].length)
			}
			return value
		},
		capitalize(value: string) {
			return value.toLowerCase().replace(/(\s|^)[a-záéíóúñ]/g, (c) => c.toUpperCase())
		},
		withoutAccentMark(value?: string) {
			const accentMarks: Record<string, string> = { Á: 'A', É: 'E', Í: 'I', Ó: 'O', Ú: 'U', á: 'a', é: 'e', í: 'i', ó: 'o', ú: 'u' }
			return value?.replace(/Á|É|Í|Ó|Ú/g, (v) => accentMarks[v])
		},
		smartMatch(subject: string, match: string) {
			const accentMarks: Record<string, string> = { á: '(a|á)', é: '(e|é)', í: '(i|í)', ó: '(o|ó)', ú: '(u|ú)', a: '(a|á)', e: '(e|é)', i: '(i|í)', o: '(o|ó)', u: '(u|ú)' }
			match = match.trim().toLowerCase()
				.replace(/\.|\?|\+|\*|\(|\)|\{|\}|\[|\]/g, ' ')
				.replace(/á|é|í|ó|ú|a|e|i|o|u/g, (v) => accentMarks[v])
				.replace(/\s+/g, ' ')
				.replace(/\s/g, '.*?')
			return subject.match(new RegExp(match, 'gi'))
		},
		compareWithoutAccentMark(value1: string, value2: string) {
			return this.withoutAccentMark(value1) === this.withoutAccentMark(value2)
		},
	},
	Number: {
		round(value: number, decimals = 0) {
			const pow = Math.pow(10, decimals)
			return Math.round(value * pow) / pow
		},
		noScientistNotation(value: number) {
			const numberString = value.toString()
			/* Descomposición del número completo */
			const matches = numberString.match(/(-?)([0-9]*\.?[0-9]+)e([-+]?)([0-9]+)/)
			if (!matches) return numberString
			const sign = matches[1]
			let number = matches[2]
			const exponentialSign = matches[3]
			let exponentialNumber = Number(matches[4])
			/* Descomposición del número base */
			const matches2 = number.match(/\./)
			if (matches2) {
				exponentialNumber += (number.length - (matches2.index ?? 0) - 1) * (exponentialSign === '-' ? 1 : -1)
				number = number.replace('.', '')
			}
			/* Construye el número a presentar */
			if (exponentialSign === '-') {
				number = Utilities.padLeft(number, exponentialNumber + 1)
				const index = number.length - exponentialNumber
				number = number.substring(0, index) + '.' + number.substring(index)
			} else {
				number += Utilities.padRight('', exponentialNumber)
			}
			return `${sign}${number}`
		},
		format(value: number, decimals = 0, decimalSeparator = '.', millarSeparator = ',', significativeNumber = false) {
			const temp = Utilities.Number.round(value, decimals).toFixed(decimals)
			const matches = temp.match(/(-?)([0-9]*)\.?([0-9]*)/)
			if (matches) {
				const signal = matches[1]
				const integer = matches[2]
				const decimal = matches[3]
				let finalInteger = ''
				let count = 0
				for (let i = integer.length - 1; i >= 0; i--) {
					finalInteger = `${integer[i]}${count % 3 === 0 && count > 0 ? millarSeparator : ''}${finalInteger}`
					count++
				}
				const result = `${signal}${finalInteger}${decimals ? `${typeof decimalSeparator === 'string' ? decimalSeparator : '.'}${decimal}` : ''}`
				if (significativeNumber === true) {
					return result.replace(/(\.)([0-9]*?)0+$/, (_a, _b, c) => c ? `.${c}` : '')
				} else {
					return result
				}
			} else {
				return ''
			}
		},
		write(value: number, decimals: number) {
			const text = Utilities.Number.format(value, decimals, '.', '')

			/* Separa la parte decimal */
			const arr1 = text.split('.')
			const parts = {
				integer: Utilities.padLeft(arr1[0], Math.ceil(arr1[0].length / 3) * 3),
				decimal: arr1[1]
			}

			/* Se divide cada tres caracteres la parte entera */
			const groups = parts.integer.match(/.{1,3}/g) ?? []

			const results: string[] = []
			for (const group of groups) {
				const hundred = Number(group[0])
				const ten = Number(group[1])
				const unity = Number(group[2])

				const hundredString = ['', (ten || unity) ? 'CIENTO' : 'CIEN', 'DOCIENTOS', 'TRECIENTOS', 'CUATROCIENTOS', 'QUINIENTOS', 'SEICIENTOS', 'SETECIENTOS', 'OCHOCIENTOS', 'NOVECIENTOS'][hundred]

				const tenString = ['', unity ? '' : 'DIEZ', unity ? 'VEINTI' : 'VEINTE', 'TREINTA', 'CUARENTA', 'CINCUENTA', 'SESENTA', 'SETENTA', 'OCHENTA', 'NOVENTA'][ten]

				let unityString
				if (unity && ten === 1) {
					unityString = ['', 'ONCE', 'DOCE', 'TRECE', 'CATORCE', 'QUINCE', 'DIECISEIS', 'DIECISIETE', 'DIECIOCHO', 'DIECINUEVE'][unity]
				} else {
					unityString = ['', 'UNO', 'DOS', 'TRES', 'CUATRO', 'CINCO', 'SEIS', 'SIETE', 'OCHO', 'NUEVE'][unity]
				}

				results.push(`${hundredString}${(hundred && (ten || unity)) ? ' ' : ''}${tenString}${(ten > 2 && unity) ? ' Y ' : ''}${unityString}`)
			}

			const separators = ['', 'MIL', 'MILLÓN', 'BILLÓN', 'TRILLÓN', 'CUATRILLÓN', 'QUINTILLÓN', 'SEXTILLÓN', 'SEPTILLÓN', 'OCTILLÓN', 'NONILLÓN']
			return results.map((r, i) => {
				const indexSeparator = results.length - i - 1
				let separator = separators[indexSeparator]
				const num = Number(groups[i])
				if (indexSeparator === 1 && num === 1) {
					r = separator === 'MIL' ? '' : 'UN'
				} else if (indexSeparator > 1 && num > 1) {
					separator = separator.replace('ÓN', 'ONES')
				}
				return `${r} ${separator}`
			}).join(' ').trim() + (decimals ? ` CON ${parts.decimal}/${Utilities.padRight('1', decimals + 1)}` : '')
		},
		/* Compara el número con los valores pasados en params en función al nombre del parámetro */
		compare(value: number, params: ToMatch | string[] | string) {
			if (isNaN(value)) return false
			if (typeof params == 'string') params = params.split(';')

			if (params instanceof Array) {
				const newParams: ToMatch = {}
				const expression = /^([<>]=?|=)(-?[0-9]*\.?[0-9]+)$/
				for (const [i, param] of params.entries()) {
					if (typeof param !== 'string') throw new Error(`El elemento ${i} no es de tipo 'string'`)
					const parts = param.match(expression)
					const part2 = Utilities.forceNumber(parts?.[2])
					switch (parts?.[1]) {
						case '!=':
							newParams.ne = part2
							break
						case '=':
							newParams.eq = part2
							break
						case '<':
							newParams.lt = part2
							break
						case '<=':
							newParams.lte = part2
							break
						case '>':
							newParams.gt = part2
							break
						case '>=':
							newParams.gte = part2
							break
					}
				}
				params = newParams
			}

			const properties: string[] = Object.keys(params)
			for (const property of properties) {
				const param = params[property as keyof ToMatch]
				switch (property) {
					case 'lt':
					case 'lte':
					case 'gt':
					case 'gte':
					case 'eq':
					case 'ne':
						if (typeof param !== 'number') throw new Error(`El parámetro '${property}' debe ser de tipo 'number'.`)
						break
					case 'in':
						if (Utilities.getType(param) !== 'Array') throw new Error(`El parámetro '${property}' debe ser de tipo 'Array'.`)
						break
					default:
						throw new Error(`No se reconoce la propiedad '${property}'.`)
				}

				/* Valida si la comparación falla */
				switch (property) {
					case 'lt':
						if (value >= (param as number)) return false
						break
					case 'lte':
						if (value > (param as number)) return false
						break
					case 'gt':
						if (value <= (param as number)) return false
						break
					case 'gte':
						if (value < (param as number)) return false
						break
					case 'eq':
						if (value != param) return false
						break
					case 'ne':
						if (value == param) return false
						break
					case 'in':
						if (!(param as number[]).includes(value)) return false
						break
				}
			}
			return true
		},
		asElapsedTime(value: number, mask: string) {
			if (typeof mask !== 'string') throw new Error(`'mask' debe ser de tipo 'string'.`)
			if (isNaN(value)) return ''

			let rest = Math.abs(value)
			const parts: {
				years: number,
				months: number,
				weeks: number,
				days: number,
				hours: number,
				minutes: number,
				seconds: number,
				miliseconds: number,
			} = {
				years: 0,
				months: 0,
				weeks: 0,
				days: 0,
				hours: 0,
				minutes: 0,
				seconds: 0,
				miliseconds: 0,
			}
			if (mask.match(/@y/)) {
				parts.years = Math.floor(rest / 366 / 24 / 60 / 60 / 1000)
				rest = rest % (366 * 24 * 60 * 60 * 1000)
			}
			if (mask.match(/@m/)) {
				parts.months = Math.floor(rest / 30.5 / 24 / 60 / 60 / 1000)
				rest = rest % (30.5 * 24 * 60 * 60 * 1000)
			}
			if (mask.match(/@w/)) {
				parts.weeks = Math.floor(rest / 7 / 24 / 60 / 60 / 1000)
				rest = rest % (7 * 24 * 60 * 60 * 1000)
			}
			if (mask.match(/@d/)) {
				parts.days = Math.floor(rest / 24 / 60 / 60 / 1000)
				rest = rest % (24 * 60 * 60 * 1000)
			}
			if (mask.match(/@h/)) {
				parts.hours = Math.floor(rest / 60 / 60 / 1000)
				rest = rest % (60 * 60 * 1000)
			}
			if (mask.match(/@i/)) {
				parts.minutes = Math.floor(rest / 60 / 1000)
				rest = rest % (60 * 1000)
			}
			if (mask.match(/@s/)) {
				parts.seconds = Math.floor(rest / 1000)
				rest = rest % 1000
			}
			if (mask.match(/@l/)) {
				parts.miliseconds = rest
			}

			if (value < 0) mask = mask.replace(/^/g, '-')

			return mask
				.replace(/@yy/g, Utilities.padLeft(parts.years, 2))
				.replace(/@y/g, parts.years.toString())
				.replace(/@mm/g, Utilities.padLeft(parts.months, 2))
				.replace(/@m/g, parts.months.toString())
				.replace(/@ww/g, Utilities.padLeft(parts.weeks, 2))
				.replace(/@w/g, parts.weeks.toString())
				.replace(/@dd/g, Utilities.padLeft(parts.days, 2))
				.replace(/@d/g, parts.days.toString())
				.replace(/@hh/g, Utilities.padLeft(parts.hours, 2))
				.replace(/@h/g, parts.hours.toString())
				.replace(/@ii/g, Utilities.padLeft(parts.minutes, 2))
				.replace(/@i/g, parts.minutes.toString())
				.replace(/@ss/g, Utilities.padLeft(parts.seconds, 2))
				.replace(/@s/g, parts.seconds.toString())
				.replace(/@ll/g, Utilities.padLeft(parts.miliseconds, 2))
				.replace(/@l/g, parts.miliseconds.toString())
		},
		isInteger(value: number) {
			return Math.ceil(value) == value
		},
		isPositive(value: number) {
			return value >= 0
		},
		isNegative(value: number) {
			return value < 0
		},
		isGreaterThan(value: number, reference: number) {
			return value > reference
		},
	},
	ReadableStream: {
		toString(readableStream: stream.Readable): Promise<string> {
			const chunks = []

			return new Promise((resolve, reject) => {
				readableStream.on('data', chunk => {
					chunks.push(chunk)
				})

				readableStream.on('end', () => {
					resolve(Buffer.concat(chunks).toString())
				})

				readableStream.on('error', reject)
			})
		},
		toArrayBuffer(readableStream: stream.Readable): Promise<ArrayBuffer> {
			const chunks = []

			return new Promise((resolve, reject) => {
				readableStream.on('data', chunk => {
					chunks.push(chunk)
				})

				readableStream.on('end', () => {
					resolve(Buffer.concat(chunks))
				})

				readableStream.on('error', reject)
			})
		},
	},
	monthName(monthNumber: number, shortName = false, language: Languages = 'spanish'): string {
		const monthName = Months[language]?.[Math.abs(monthNumber - 1) % 12]
		if (!monthName) return ''
		return shortName ? monthName.substring(0, 3) : monthName
	},
	dayName: (dayNumber: number, shortName = false, language: Languages = 'spanish'): string => {
		const dayName = Days[language]?.[Math.abs(dayNumber) % 7]
		if (!dayName) return ''
		return shortName ? dayName.substring(0, 3) : dayName
	},
	getType: (obj: unknown) => {
		const type = toString.call(obj).match(/\s([a-zA-Z0-9]+)/)?.[1].replace(/HTML[a-zA-Z]*Element/, "HTMLElement")
		return (['Object', 'Array'].includes(type ?? '') ? (obj as TRecord).constructor.name : type) ?? null
	},
	// eslint-disable-next-line @typescript-eslint/ban-types
	throttle: (func: Function, delay: number) => {
		let idTimeout: NodeJS.Timer | null
		return function (...args: unknown[]) {
			if (!idTimeout) {
				idTimeout = setTimeout(() => idTimeout = null, delay)
			} else {
				return
			}
			return func(...args)
		}
	},
	// eslint-disable-next-line @typescript-eslint/ban-types
	debounce: (func: Function, delay: number) => {
		let idTimeout: NodeJS.Timeout | null
		return function (...args: unknown[]) {
			if (idTimeout) clearTimeout(idTimeout)
			idTimeout = setTimeout(() => func(...args), delay)
		}
	},
	formula: (toEval: string, parameters: TRecord) => {
		if (parameters) {
			parameters = (() => {
				const neoParameters: TRecord = {}
				for (const propertyName in parameters) {
					let value = parameters[propertyName]
					switch (typeof value) {
						case 'string':
							value = value.trim()
							if (!value) {
								neoParameters[propertyName] = 0
							} else {
								const num = Number(value)
								neoParameters[propertyName] = isNaN(num) ? value : num
							}
							break
						case 'number':
							neoParameters[propertyName] = value
							break
						default:
							neoParameters[propertyName] = 0
							break
					}
				}
				return neoParameters
			})()
		}
		if (typeof toEval !== 'string') throw new Error(`El primer parámetro debe ser de tipo 'string'`)
		const keywords = {
			avg: (...values: number[]) => values.reduce((ac, value) => ac + value, 0) / values.length,
			pow: Math.pow,
			e: () => Math.E,
			pi: () => Math.PI,
		}

		const patronDeReferencias = /\$\b[a-zA-Z]+?[a-zA-Z0-9]*\b/g

		/* Función que se utilizará de forma recursiva */
		const replaceRefereces = (references: string[] | null) => {
			if (references == null) return
			for (const reference of references) {
				const propertyName = reference.substring(1)
				toEval = toEval.replace(new RegExp(`\\${reference}`, 'g'), parameters?.[propertyName]?.toString().trim() || '0')
			}
			references = toEval.match(patronDeReferencias)
			if (references) replaceRefereces(references)
		}

		/* Busca las referencias */
		const references = toEval.match(patronDeReferencias)

		/* Sustituye las referencias con los parámetros */
		if (references) replaceRefereces(references)

		/* Busca todos los tokens */
		const tokens = new Set(toEval.match(/\b[a-z]+?[a-z0-9]*\b\(/ig) ?? [])

		if (tokens.size) {
			for (let token of Array.from(tokens)) {
				token = token.substring(0, token.length - 1).toLowerCase()
				if (!(token in keywords)) throw new Error(`No existe la función '${token}'`)
				toEval = toEval.replace(new RegExp(token, 'ig'), `keywords.${token}`)
			}
		}

		const result = new Function(toEval)()
		return (isNaN(result) && typeof result !== 'string') ? null : result
	},
	forceNumber: (value?: unknown) => {
		const transformed = Number(value)
		return isNaN(transformed) ? 0 : transformed
	},
	objectToUrlParameters: (obj: TRecord) => {
		return Object.keys(obj).map(key => {
			const value = obj[key]
			let valueToEncode: string | number | boolean = ''
			if (typeof value == 'object') {
				valueToEncode = JSON.stringify(value)
			} else if (typeof value == 'string' || typeof value == 'boolean' || typeof value == 'number') {
				valueToEncode = value
			}
			return `${encodeURIComponent(key)}=${obj[key] == null ? '' : encodeURIComponent(valueToEncode)}`
		}).join("&")
	},
	urlParametersToObject: (value: string): TRecord => {
		const query = value.match(/^\??(.*)$/)?.[1]
		if (!query) return {}
		const parts = query.split('&')
		const result: TRecord = {}
		for (const part of parts) {
			const subparts = part.split('=')
			result[subparts[0]] = subparts[1] ?? null
		}
		return result
	},
	padLeft(value: string | number, length: number, text = '0'): string {
		if (length < 0) throw new Error(`'length' debe ser positivo`)
		if (Math.ceil(length) != length) throw new Error(`'length' debe ser un número entero`)
		const target = typeof value == 'number' ? value.toString() : value
		if (target.length > length || text == '') return target
		const chain = Array(length + 1).join(text)
		return Utilities.String.right(`${chain}${target}`, length)
	},
	padRight(value: string | number, length: number, text = '0'): string {
		if (length < 0) throw new Error(`'length' debe ser positivo`)
		if (Math.ceil(length) != length) throw new Error(`'length' debe ser un número entero`)
		const target = typeof value == 'number' ? value.toString() : value
		if (target.length > length || text == '') return target
		const chain = Array(length + 1).join(text)
		return Utilities.String.left(`${target}${chain}`, length)
	},
}