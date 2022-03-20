/* Funciones adicionales para los números */
Object.defineProperties(Number.prototype, {
	padLeft: {
		value: function (n, str = "0") {
			return Array(Math.max(n - String(this).length + 1, 0)).join(str[0]) + this
		},
		writable: false
	},
	padRight: {
		value: function (n, str = "0") {
			return this + Array(Math.max(n - String(this).length + 1, 0)).join(str[0] || "0")
		},
		writable: false
	},
	zeroPad: {
		value: function (n) {
			const sign = this < 0 ? -1 : 1
			return `${sign < 0 ? '-' : ''}${Math.abs(this).padLeft(sign < 0 ? Math.max(0, n - 1) : n, "0")}`
		},
		writable: false
	},
	round: {
		value: function (decimals = 0) {
			let pow = Math.pow(10, decimals)
			return Math.round(this * pow) / pow
		},
		writable: false
	},
	noScientificNotation: {
		value: function () {
			let sign = this < 0 ? "-" : "",
				positive = Math.abs(this)
			if (positive < 1.0) {
				let e = parseInt(positive.toString().split("e-")[1])
				if (e) {
					positive *= Math.pow(10, e - 1)
					positive = "0." + new Array(e).join("0") + positive.toString().substring(2)
				}
			} else {
				let e = parseInt(positive.toString().split("+")[1])
				if (e > 20) {
					e -= 20
					positive /= Math.pow(10, e)
					positive += new Array(e + 1).join("0")
				}
			}
			return sign + positive
		},
		writable: false
	},
	format: {
		value: function (decimals = 0, decimalSeparator = '.', millarSeparator = ',') {
			let temp = Utilities.forceNumber(this).round(decimals).toFixed(decimals)
			let matches = temp.match(/(\-?)([0-9]*)\.?([0-9]*)/)
			if (matches) {
				let signal = matches[1]
				let integer = matches[2]
				let decimal = matches[3]
				let finalInteger = ''
				let count = 0
				for (let i = integer.length - 1; i >= 0; i--) {
					finalInteger = `${integer[i]}${count % 3 === 0 && count > 0 ? millarSeparator : ''}${finalInteger}`
					count++
				}
				const result = `${signal}${finalInteger}${decimals ? `${typeof decimalSeparator === 'string' ? decimalSeparator : '.'}${decimal}` : ''}`
				if (decimalSeparator === true) {
					return result.replace(/(\.)([0-9]*?)0+$/, (a, b, c) => c ? `.${c}` : '')
				} else {
					return result
				}
			} else {
				return ''
			}
		},
		writable: false
	},
	nonZeroFormat: {
		value: function (decimals = 0, decimalSeparator = '.', millarSeparator = ',') {
			return this.valueOf() ? this.format(decimals, decimalSeparator, millarSeparator) : ''
		},
		writable: false
	},
	write: {
		value: function (decimals) {
			const text = this.format(decimals, '.', '')

			/* Separa la parte decimal */
			const arr1 = text.split('.')
			const parts = {
				integer: arr1[0].padLeft(Math.ceil(arr1[0].length / 3) * 3),
				decimal: arr1[1]
			}

			/* Se divide cada tres caracteres la parte entera */
			const groups = parts.integer.match(/.{1,3}/g)

			const results = []
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
			}).join(' ').trim() + (decimals ? ` CON ${parts.decimal}/${'1'.padRight(decimals + 1)}` : '')
		},
		writable: false
	},
	/* Compara el número con los valores pasados en params en función al nombre del parámetro */
	compare: {
		value(params) {
			if (isNaN(this)) return false
			if (typeof params === 'string') params = params.split(';')

			const typeOfParams = Utilities.getType(params)
			if (!['Array', 'Object', 'String'].includes(typeOfParams)) throw new Error(`El argumento debe ser un 'arreglo' o un 'object'.`)

			if (typeOfParams === 'Array') {
				const newParams = {}
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

			const properties = Object.keys(params)
			let result = true
			loopFor:
			for (const property of properties) {
				const param = params[property]
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
						if (this.valueOf() >= param) {
							result = false
							break loopFor
						}
						break
					case 'lte':
						if (this.valueOf() > param) {
							result = false
							break loopFor
						}
						break
					case 'gt':
						if (this.valueOf() <= param) {
							result = false
							break loopFor
						}
						break
					case 'gte':
						if (this.valueOf() < param) {
							result = false
							break loopFor
						}
						break
					case 'eq':
						if (this.valueOf() !== param) {
							result = false
							break loopFor
						}
						break
					case 'ne':
						if (this.valueOf() === param) {
							result = false
							break loopFor
						}
						break
					case 'in':
						if (!param.includes(this.valueOf())) {
							result = false
							break loopFor
						}
						break
				}
			}
			return result
		},
		writable: false
	},
	asTime: {
		value: function (mask) {
			if (typeof mask !== 'string') throw new Error(`'mask' debe ser de tipo 'string'.`)
			if (isNaN(this)) return ''

			let rest = Math.abs(this)
			const parts = {}
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

			if (this < 0) mask = mask.replace(/^/g, '-')

			return mask
				.replace(/@yy/g, parts.years?.zeroPad(2))
				.replace(/@y/g, parts.years)
				.replace(/@mm/g, parts.months?.zeroPad(2))
				.replace(/@m/g, parts.months)
				.replace(/@ww/g, parts.weeks?.zeroPad(2))
				.replace(/@w/g, parts.weeks)
				.replace(/@dd/g, parts.days?.zeroPad(2))
				.replace(/@d/g, parts.days)
				.replace(/@hh/g, parts.hours?.zeroPad(2))
				.replace(/@h/g, parts.hours)
				.replace(/@ii/g, parts.minutes?.zeroPad(2))
				.replace(/@i/g, parts.minutes)
				.replace(/@ss/g, parts.seconds?.zeroPad(2))
				.replace(/@s/g, parts.seconds)
				.replace(/@ll/g, parts.miliseconds?.zeroPad(2))
				.replace(/@l/g, parts.miliseconds)
		},
		writable: false
	},
	forceNumber: {
		value: function () {
			return isNaN(this) ? 0 : this
		},
		writable: false
	},
	toNumber: {
		value: function () {
			return this.valueOf()
		},
		writable: false
	}
})

/* Librería de funciones */
const Utilities = {
	getValue: (obj, path, stringToJson) => {
		if (typeof path !== 'string') throw new Error("'path' debe ser un 'string'.")
		let arr = path.split(/\./)
		let reference = obj
		if (!reference) return
		if (Utilities.getType(reference) === 'Array') reference = reference[0]
		for (let i = 0; i < arr.length; i++) {
			reference = reference[arr[i]]
			if (Utilities.getType(reference) === 'Array' && i < arr.length - 1) {
				reference = reference[0]
			} else if (typeof reference === 'string' && i < arr.length - 1 && stringToJson) {
				/* Si la referencia es una cadena y aún hay más propiedades para recorrer, se intenta convertir la cadena en objeto */
				try {
					reference = JSON.parse(reference)
				} catch { }
			}
			if (!reference) return reference
		}
		return reference
	},
	setValue(obj, path, value) {
		if (typeof path !== 'string') throw new Error("'path' debe ser un 'string'.")
		let arr = path.split(/\./)
		let reference = obj
		if (!reference) return
		for (let i = 0; i < arr.length - 1; i++) {
			if (reference[arr[i]] === undefined && i < arr.length - 1) {
				if (typeof Vue !== 'undefined') {
					Vue.set(reference, arr[i], {})
				} else {
					reference[arr[i]] = {}
				}
			}
			reference = reference[arr[i]]
			if (Utilities.getType(reference) === 'Array') reference = reference[0]
			if (!reference) return
		}
		if (value !== undefined) {
			if (typeof Vue !== 'undefined') {
				Vue.set(reference, arr[arr.length - 1], value)
			} else {
				reference[arr[arr.length - 1]] = value
			}
		} else {
			delete reference[arr[arr.length - 1]]
		}
	},
	collections: {
		days: {
			spanish: ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"],
			english: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
		},
		months: {
			spanish: ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"],
			english: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
		},
	},
	monthName(monthNumber, shortName = false, language = 'spanish') {
		const monthName = Utilities.collections.months[language]?.[Math.abs(monthNumber - 1) % 12]
		return monthName ? (shortName ? monthName.substr(0, 3) : monthName) : null
	},
	dayName(dayNumber, shortName = false, language = 'spanish') {
		const dayName = Utilities.collections.days[language]?.[Math.abs(dayNumber) % 7]
		return dayName ? (shortName ? dayName.substr(0, 3) : dayName) : null
	},
	isMobile: {
		Android: () => navigator.userAgent.match(/Android/i),
		BlackBerry: () => navigator.userAgent.match(/BlackBerry/i),
		iOS: () => navigator.userAgent.match(/iPhone|iPad|iPod/i),
		Opera: () => navigator.userAgent.match(/Opera Mini/i),
		Windows: () => navigator.userAgent.match(/IEMobile/i),
		Any() {
			return this.Android() || this.BlackBerry() || this.iOS() || this.Opera() || this.Windows()
		}
	},
	forceNumber(value) {
		value || (value = "0")
		let number = Number(value)
		return isNaN(number) ? 0 : number
	},
	getType(obj) {
		let type = toString.call(obj).match(/\s([a-zA-Z0-9]+)/)[1].replace(/HTML[a-zA-Z]*Element/, "HTMLElement")
		return ['Object', 'Array'].includes(type) ? obj.constructor.name : type
	},
	isInvalid(obj) {
		if (typeof obj === 'string') obj = obj.trim()
		return ([undefined, '', null]).includes(obj) || (this.getType(obj) === "Array" && obj.length === 0)
	},
	isValid(obj) {
		return !this.isInvalid(obj)
	},
	isNumber(value) {
		return isNaN(Number(value)) ? false : true
	},
	jsonToGetParameters(jsonObject) {
		if (getType(jsonObject) === "Object") {
			return Object.keys(jsonObject)
				.map(function (key) {
					return (
						encodeURIComponent(key) +
						"=" +
						(isInvalid(jsonObject[key])
							? ""
							: encodeURIComponent(this.getType(jsonObject[key]) === "Object" || this.getType(jsonObject[key]) === "Array" ? JSON.stringify(jsonObject[key]) : jsonObject[key]))
					)
				})
				.join("&")
		} else {
			return ""
		}
	},
	/* Busca un objeto dentro de un arreglo de objetos. El parámetro properties es un listado de propiedades cuyos valores serán comparados en el momento de la búsqueda. El cuarto parámetro indica
	el índice correspondiente al elemento ubicado dentro de los resultados en tal posición, siendo ese elemento el que se devolverá como respuesta. */
	findObjectInArray: function (needle, origin, properties, index = null) {
		if (Utilities.getType(origin) !== 'Array' || !(['Array', 'Object']).includes(Utilities.getType(properties)) || Utilities.getType(needle) !== 'Object') return []

		let results = origin.filter(element => {
			if (Utilities.getType(element) !== "Object") return false
			if (Utilities.getType(properties) === 'Array') {
				for (let i = 0; i < properties.length; i++) {
					let property = properties[i]
					if (needle[property] === undefined || element[property] !== needle[property]) return false
				}
			} else {
				for (let prop1 in properties) {
					let prop2 = properties[prop1]
					if (needle[prop1] !== element[prop2]) return false
				}
			}
			return true
		})
		if (typeof index === 'number') {
			return results[index]
		} else {
			return results
		}
	},
	/* Busca un objeto dentro de un arreglo de objetos. */
	deleteObjectInArray: function (needle, origin, properties) {
		if (typeof origin !== "object" || origin.constructor.name !== "Array") return []
		if (typeof properties !== "object" || properties.constructor.name !== "Array") return []

		let idxs = []
		origin.forEach(function (element, idxElement) {
			if (typeof element === "undefined" || element === null) return
			let finded = true
			properties.forEach(function (property, idxProperty) {
				if (element[property] !== needle[property]) finded = false
			})
			if (finded) idxs.push(idxElement)
		})
		idxs.forEach(function (idx, idxIdx) {
			origin.splice(idx, 1)
		})
	},
	/* Agrega los elementos de un array a otro array, pero utiliza el argumento "properties" para verificar si previamente no existe. */
	addArrayElementsToArray: function (origin, destiny, properties) {
		if (this.getType(origin) !== "Array" || this.getType(destiny) !== "Array") return

		origin.forEach(element => {
			if (!this.findObjectInArray(element, destiny, properties).length) destiny.push(element)
		})
	},
	/* Elimina los elementos de un array en otro array utilizando el argumento de comparación "properties". */
	deleteArrayElementsFromArray: function (origin, destiny, properties) {
		if (typeof origin !== "object" || origin.constructor.name !== "Array") return []
		if (typeof destiny !== "object" || destiny.constructor.name !== "Array") return []

		origin.forEach(element => {
			this.deleteObjectInArray(element, destiny, properties)
		})
	},
	/* Agrega un elemento a un array, siempre que éste no exista previamente */
	addElementToArray: function (element, destiny) {
		if (typeof destiny !== "object" || destiny.constructor.name !== "Array") return
		if (destiny.indexOf(element) === -1) destiny.push(element)
	},
	/* Borra un elemento de un array */
	deleteElementFromArray: function (element, origin) {
		if (typeof origin !== "object" || origin.constructor.name !== "Array") return
		let index = origin.indexOf(element)
		if (index > -1) origin.splice(index, 1)
	},
	/* Busca un elemento en cada arreglo pasado como parámetro, Si no lo encuentra en ninguno, lo inserta en el primer arreglo. Si se encuentra en el primer arreglo, lo elimina del primero y lo 
	almacena en el segundo arreglo, si lo encuentra en el arreglo N, lo elimina del arreglo N y lo almacena en el arreglo N+1, y así sucesivamente de forma que el elemento sólo exista en uno de los 
	arreglos. Si lo encuentra en el último arreglo luego de eliminarlo del último arreglo, en caso "getOut" sea "false", lo inserta en el primer arreglo, si es "true" ya no realiza la inserción. */
	toggleElementBetweenArrays: function (element, getOut = false, ...arrays) {
		/* Busca en qué array está el elemento */
		let currentArray
		let currentIndexOfArray = null
		let currentIndexOfElement
		for (let i = 0; i < arrays.length; i++) {
			let arr = arrays[i]
			if (Utilities.getType(arr) !== "Array") continue
			let index = arr.indexOf(element)
			if (index > -1) {
				currentArray = arr
				currentIndexOfArray = i
				currentIndexOfElement = index
				break
			}
		}
		/* Si el array donde se encuentra el elemento es el último, se elimina simplemente, caso contrario, se agrega el elemento al siguiente array de la vista.  */
		if (currentIndexOfArray !== null) {
			currentArray.splice(currentIndexOfElement, 1)
			if (currentIndexOfArray < arrays.length - 1) {
				arrays[currentIndexOfArray + 1].push(element)
			} else {
				if (!getOut) arrays[0].push(element)
			}
		} else {
			arrays[0].push(element)
		}
	},
	createElementNS(ns, tagName, attrs = {}) {
		const namespaces = {
			'html': 'http://www.w3.org/1999/xhtml',
			'svg': 'http://www.w3.org/2000/svg',
		}
		const element = document.createElementNS(namespaces[ns], tagName)
		if (typeof attrs === 'object') {
			for (const attrName in attrs) {
				element.setAttribute(attrName, attrs[attrName])
			}
		}
		return element
	},
	throttle(func, delay) {
		if (!['AsyncFunction', 'Function'].includes(Utilities.getType(func))) throw new Error(`El parámetro 'func' debe ser una función.`)
		let idTimeout
		return function (...args) {
			if (!idTimeout) {
				idTimeout = setTimeout(() => idTimeout = undefined, delay)
			} else {
				return
			}
			return func(...args)
		}
	},
	debounce(func, delay) {
		if (!['AsyncFunction', 'Function'].includes(Utilities.getType(func))) throw new Error(`El parámetro 'func' debe ser una función.`)
		let idTimeout
		return function (...args) {
			if (idTimeout) clearTimeout(idTimeout)
			idTimeout = setTimeout(() => func(...args), delay)
		}
	},
	formula(toEval, parameters) {
		if (parameters) {
			parameters = (_ => {
				const neoParameters = {}
				for (let propertyName in parameters) {
					let value = parameters[propertyName]
					switch (typeof value) {
						case 'string':
							value = value.trim()
							if (!value) {
								neoParameters[propertyName] = 0
							} else {
								let num = value.toNumber()
								// neoParameters[propertyName] = isNaN(num) ? `'${value.replace(/["'`]/g, '')}'` : num
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
			avg: (...values) => values.reduce((ac, value) => ac + value, 0) / values.length,
			pow: Math.pow,
			e: _ => Math.E,
			pi: _ => Math.PI,
		}

		const patronDeReferencias = /\$\b[a-zA-Z]+?[a-zA-Z0-9]*\b/g

		/* Función que se utilizará de forma recursiva */
		const replaceRefereces = references => {
			for (const reference of references) {
				const propertyName = reference.substr(1)
				toEval = toEval.replace(new RegExp(`\\${reference}`, 'g'), parameters?.[propertyName]?.toString().trim() || '0')
			}
			references = toEval.match(patronDeReferencias)
			if (references) replaceRefereces(references)
		}

		/* Busca las referencias */
		let references = toEval.match(patronDeReferencias)

		/* Sustituye las referencias con los parámetros */
		if (references) replaceRefereces(references)

		/* Busca todos los tokens */
		const tokens = new Set(toEval.match(/\b[a-z]+?[a-z0-9]*\b\(/ig) ?? [])

		if (tokens.size) {
			for (let token of Array.from(tokens)) {
				token = token.substring(0, token.length - 1).toLowerCase()
				if (!keywords[token]) throw new Error(`No existe la función '${token}'`)
				toEval = toEval.replace(new RegExp(token, 'ig'), `keywords.${token}`)
			}
		}

		const result = eval(toEval)
		return (isNaN(result) && typeof result !== 'string') ? null : result
	}
}

/* Funciones adicionales para los objetos */
Object.defineProperties(Object, {
	toUrlParameters: {
		value: function (obj) {
			if (typeof obj !== 'object') throw new Error(`El parámetro debe ser un objeto`)
			return Object.keys(obj).map(key => {
				const value = obj[key]
				return `${encodeURIComponent(key)}=${obj[key] == null ? '' : encodeURIComponent(typeof value === 'object' ? JSON.stringify(value) : value)}`
			}).join("&")
		},
		writable: false
	}
})

/* Funciones adicionales para las cadenas */
Object.defineProperties(String.prototype, {
	padLeft: {
		value: function (n, str = "0") {
			return Array(Math.max(n - this.length + 1, 0)).join(str[0] || "0") + this
		},
		writable: false
	},
	padRight: {
		value: function (n, str = "0") {
			return this + Array(Math.max(n - this.length + 1, 0)).join(str[0] || "0")
		},
		writable: false
	},
	ucWords: {
		value: function () {
			return this.replace(/(\s|^)[a-záéíóúñäëïöü]/g, letter => letter.toUpperCase())
		},
		writable: false
	},
	left: {
		value: function (n) {
			n = Utilities.forceNumber(n)
			return this.substr(0, n)
		},
		writable: false
	},
	right: {
		value: function (n) {
			n = Utilities.forceNumber(n)
			return this.substr(this.length - n, n)
		},
		writable: false
	},
	highlight: {
		value: function () {
			return this ? this.replace(/'(.+?)'/g, (a, b, c, d) => `<b>${b}</b>`) : ''
		},
		writable: false
	},
	format: {
		value: function (decimals = 0, decimalSeparator = '.', millarSeparator = ',') {
			let signal = ''
			const value = (_ => {
				const matches = this.match(/^([<>])/)
				if (matches) {
					signal = matches[1]
					return this.substring(1)
				} else {
					return this.valueOf()
				}
			})()

			return signal + Utilities.forceNumber(value).format(decimals, decimalSeparator, millarSeparator)
		},
		writable: false
	},
	write: {
		value: function (decimals) {
			return Utilities.forceNumber(this).write(decimals)
		},
		writable: false
	},
	formatDate: {
		value: function (layout) {
			return new Date(this).format(layout)
		},
		writable: false
	},
	toDate: {
		value: function () {
			return new Date(this)
		},
		writable: false
	},
	toNumber: {
		value: function () {
			const matches = this.match(/^([<>])([0-9]*\.?[0-9]+)$/)
			let num
			if (matches) {
				num = Number(matches[2]) + (matches[1] === '<' ? -0.1 : 0.1)
			} else {
				num = Number(this)
			}
			return num
		},
		writable: false
	},
	forceNumber: {
		value: function () {
			return Utilities.forceNumber(this)
		},
		writable: false
	},
	compare: {
		value(params) {
			let value = this.trim()
			if (!value) {
				return false
			} else {
				return this.toNumber().compare(params)
			}
		},
		writable: false
	},
	/* Colores para la consola */
	bright: {
		get: function () {
			return `\x1b[1m${this}\x1b[0m`
		},
	},
	dim: {
		get: function () {
			return `\x1b[2m${this}\x1b[0m`
		},
	},
	underscore: {
		get: function () {
			return `\x1b[4m${this}\x1b[0m`
		},
	},
	blink: {
		get: function () {
			return `\x1b[5m${this}\x1b[0m`
		},
	},
	fgBlack: {
		get: function () {
			return `\x1b[30m${this}\x1b[0m`
		},
	},
	fgRed: {
		get: function () {
			return `\x1b[31m${this}\x1b[0m`
		},
	},
	fgGreen: {
		get: function () {
			return `\x1b[32m${this}\x1b[0m`
		},
	},
	fgYellow: {
		get: function () {
			return `\x1b[33m${this}\x1b[0m`
		},
	},
	fgBlue: {
		get: function () {
			return `\x1b[34m${this}\x1b[0m`
		},
	},
	fgMagenta: {
		get: function () {
			return `\x1b[35m${this}\x1b[0m`
		},
	},
	fgCyan: {
		get: function () {
			return `\x1b[36m${this}\x1b[0m`
		},
	},
	fgWhite: {
		get: function () {
			return `\x1b[37m${this}\x1b[0m`
		},
	},
	bgBlack: {
		get: function () {
			return `\x1b[40m${this}\x1b[0m`
		},
	},
	bgRed: {
		get: function () {
			return `\x1b[41m${this}\x1b[0m`
		},
	},
	bgGreen: {
		get: function () {
			return `\x1b[42m${this}\x1b[0m`
		},
	},
	bgYellow: {
		get: function () {
			return `\x1b[43m${this}\x1b[0m`
		},
	},
	bgBlue: {
		get: function () {
			return `\x1b[44m${this}\x1b[0m`
		},
	},
	bgMagenta: {
		get: function () {
			return `\x1b[45m${this}\x1b[0m`
		},
	},
	bgCyan: {
		get: function () {
			return `\x1b[46m${this}\x1b[0m`
		},
	},
	bgWhite: {
		get: function () {
			return `\x1b[47m${this}\x1b[0m`
		},
	},
})

/* Funciones adicionales para las fechas */
Object.defineProperties(Date.prototype, {
	format: {
		value: function (mask, language = 'spanish') {
			if (isNaN(this)) return ''
			return mask
				.replace(/@y/g, this.getFullYear())
				.replace(/@mmmm/g, Utilities.monthName(this.getMonth() + 1, false, language))
				.replace(/@mmm/g, Utilities.monthName(this.getMonth() + 1, true, language))
				.replace(/@mm/g, (this.getMonth() + 1).padLeft(2, "0"))
				.replace(/@m/g, this.getMonth() + 1)
				.replace(/@dddd/g, Utilities.dayName(this.getDay(), false, language))
				.replace(/@ddd/g, Utilities.dayName(this.getDay(), true, language))
				.replace(/@dd/g, this.getDate().padLeft(2, "0"))
				.replace(/@d/g, this.getDate())
				.replace(/@hh/g, this.getHours().padLeft(2, "0"))
				.replace(/@h/g, this.getHours())
				.replace(/@ii/g, this.getMinutes().padLeft(2, "0"))
				.replace(/@i/g, this.getMinutes())
				.replace(/@ss/g, this.getSeconds().padLeft(2, "0"))
				.replace(/@s/g, this.getSeconds())
				.replace(/@lll/g, this.getMilliseconds().padLeft(3, '0'))
				.replace(/@ll/g, this.getMilliseconds().padLeft(2, '0'))
				.replace(/@l/g, this.getMilliseconds())
				.replace(/@ww/g, this.getWeek().padLeft(2, '0'))
				.replace(/@w/g, this.getWeek())
		},
		writable: false,
	},
	getWeek: {
		value: function () {
			const onejan = new Date(this.getFullYear(), 0, 1)
			return Math.ceil(((this - onejan) / 86400000 + onejan.getDay() + 1) / 7)
		},
		writable: false
	},
	setTimeFromString: {
		value: function (v) {
			if (typeof v !== 'string') throw new Error("El parámetro debe ser de tipo 'string'.")
			const temp = new Date(`${this.format('@y-@mm-@dd')} ${v}`)
			if (isNaN(temp)) throw new Error("El valor no tiene un formato de hora válido.")
			this.setTime(temp.getTime())
		},
		writable: false
	},
	from: {
		value: function (ref) {
			let newRef = ref
			if (Utilities.getType(ref) !== 'Date') {
				try {
					newRef = new Date(ref)
				} catch {
					throw new Error("Date.prototype.from: El parámetro 'ref' debe ser un valor de tipo fecha o que pueda ser utilizado para crear una fecha.")
				}
			}
			let value = this - newRef
			const results = {}
			results.miliseconds = value % 1000
			value = Math.floor(value / 1000)
			results.seconds = value % 60
			value = Math.floor(value / 60)
			results.minutes = value % 60
			value = Math.floor(value / 60)
			results.hours = value % 24
			value = Math.floor(value / 24)
			results.days = value
			return results
		},
		writable: false
	},
	clone: {
		value: function () {
			return new Date(this.format('@y-@mm-@dd @hh:@ii:@ss.@lll'))
		},
		writable: false
	},
	monthName: {
		value: function (shortName, language = 'spanish') {
			return Utilities.monthName(this.getMonth() + 1, shortName, language)
		},
		writable: false
	},
})

/* Funciones adicionales para los arrays */
Object.defineProperties(Array.prototype, {
	swapItems: {
		value: function (oldIndex, newIndex) {
			if (oldIndex != null) {
				if (Utilities.getType(oldIndex) !== 'Number') throw new Error(`'oldIndex' debe ser un número`)
			} else {
				oldIndex = this.length - 1
			}
			if (newIndex != null) {
				if (Utilities.getType(newIndex) !== 'Number') throw new Error(`'newIndex' debe ser un número`)
			} else {
				newIndex = this.length - 1
			}
			if (oldIndex < 0 || newIndex < 0) throw new Error(`Sólo se aceptan parámetros positivos`)

			oldIndex = oldIndex.round(0)
			newIndex = newIndex.round(0)
			let el1 = this[oldIndex]
			let el2 = this[newIndex]
			if (!el1) throw new Error(`No existe elemento en el índice '${oldIndex}'`)
			this.splice(newIndex, 1, el1)
			if (el2) {
				this.splice(oldIndex, 1, el2)
			} else {
				this.splice(oldIndex, 1)
			}
		},
		writable: false
	},
	moveItem: {
		value: function (oldIndex, newIndex) {
			if (oldIndex != null) {
				if (Utilities.getType(oldIndex) !== 'Number') throw new Error(`'oldIndex' debe ser un número`)
			} else {
				oldIndex = this.length - 1
			}
			if (newIndex != null) {
				if (Utilities.getType(newIndex) !== 'Number') throw new Error(`'newIndex' debe ser un número`)
			} else {
				newIndex = this.length - 1
			}
			if (oldIndex < 0 || newIndex < 0) throw new Error(`Sólo se aceptan parámetros positivos`)

			oldIndex = oldIndex.round(0)
			newIndex = newIndex.round(0)
			let el1 = this[oldIndex]
			if (!el1) throw new Error(`No existe elemento en el índice '${oldIndex}'`)
			this.splice(oldIndex, 1)
			this.splice(newIndex, 0, el1)
		},
		writable: false
	},
	queryOne: {
		value: function (query) {
			const typeOf = Utilities.getType(query)
			if (!['Object', 'Function'].includes(typeOf)) return
			for (let i = 0; i < this.length; i++) {
				let element = this[i]
				if (element == null || typeof element !== 'object') continue
				let success = true
				if (typeOf === 'Object') {
					for (let p in query) {
						const valueOfElement = Utilities.getValue(element, p)
						if (query[p] == null && valueOfElement == null) continue
						if (Utilities.getType(query[p]) === 'RegExp' && valueOfElement?.match(query[p])) continue
						if (valueOfElement !== query[p]) {
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
		},
		writable: false
	},
	query: {
		value: function (query) {
			const typeOf = Utilities.getType(query)
			if (!['Object', 'Function'].includes(typeOf)) return
			let results = []
			for (let i = 0; i < this.length; i++) {
				let element = this[i]
				if (element == null || typeof element !== 'object') continue
				let success = true
				if (typeOf === 'Object') {
					for (let p in query) {
						const valueOfElement = Utilities.getValue(element, p)
						if (query[p] == null && valueOfElement == null) continue
						if (Utilities.getType(query[p]) === 'RegExp' && valueOfElement?.match(query[p])) continue
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
		writable: false
	},
	extractOne: {
		value: function (query) {
			const typeOf = Utilities.getType(query)
			if (!['Object', 'Function'].includes(typeOf)) return
			for (const [i, element] of this.entries()) {
				if (element == null || typeof element !== 'object') continue
				let success = true
				if (typeOf === 'Object') {
					for (const p in query) {
						if (Utilities.getValue(element, p) !== query[p]) {
							success = false
							break
						}
					}
				} else {
					success = !!query(element)
				}
				if (success) return this.splice(i, 1)[0]
			}
		},
		writable: false
	},
	extract: {
		value: function (query) {
			const typeOf = Utilities.getType(query)
			if (!['Object', 'Function'].includes(typeOf)) return
			let i = 0
			const results = []
			while (true) {
				if (i >= this.length) break
				const element = this[i]
				if (element == null || typeof element !== 'object') continue
				let success = true
				if (typeOf === 'Object') {
					for (const p in query) {
						if (Utilities.getValue(element, p) !== query[p]) {
							success = false
							break
						}
					}
				} else {
					success = !!query(element)
				}
				if (success) {
					results.push(this.splice(i, 1)[0])
				} else {
					i++
				}
			}
			return results
		},
		writable: false
	},
	groupBy: {
		value: function (property) {
			let results = {}
			this.forEach(e => {
				if (!e) return
				let groupName = e[property]
				let reference
				if (groupName) {
					if (!results[groupName]) results[groupName] = []
					reference = results[groupName]
				} else {
					if (!results.undefined) results.undefined = []
					reference = results.undefined
				}
				reference.push(e)
			})
			return results
		},
		writable: false
	},
	toggle: {
		value: function (element, properties) {
			if (properties && Utilities.getType(properties) !== 'Array') return false

			/* Busca el elemento en el arreglo y captura su índice */
			let index
			for (const [i, currentElement] of this.entries()) {
				let finded = true
				if (properties && element == null) {
					finded = false
				}
				if (properties) {
					for (const property of properties) {
						if (currentElement[property] !== element[property]) {
							finded = false
							break
						}
					}
				} else {
					if (currentElement !== element) finded = false
				}
				if (finded) {
					index = i
					break
				}
			}

			if (index != null) {
				this.splice(index, 1)
			} else {
				this.push(element)
			}
			return true
		},
		writable: false
	},
	filterText: {
		value: function (text, properties) {
			let tildes = { a: 'á', e: 'é', i: 'í', o: 'ó', u: 'úü', A: 'Á', E: 'É', I: 'Í', O: 'Ó', U: 'ÚÜ', n: 'ñ', N: 'Ñ' }
			const regExp = new RegExp(text.replace(/([aeiouAEIOUnN])/g, (a, b, c, d) => `[${b}${tildes[b]}]`), 'i')
			if (Utilities.getType(properties) !== 'Array') throw `Array.filterText: El parámetro 'properties' debe ser un arreglo de 'string'`
			if (properties.filter(p => typeof p !== 'string').length) throw `Array.filterText: El parámetro 'properties' debe ser un arreglo de 'string'`
			return this.filter(element => {
				let result = false
				for (const property of properties) {
					if (typeof element[property] === 'string') {
						if (element[property].match(regExp)) {
							result = true
							break
						}
					} else if (Utilities.getType(element[property]) === 'Array') {
						let subResult = false
						for (const subElement of element[property]) {
							if (typeof subElement === 'string' && subElement.match(regExp)) {
								subResult = true
								break
							}
						}
						if (subResult) {
							result = true
							break
						}
					}
				}
				return result
			})
		},
		writable: false
	},
	chunks: {
		value: function (length) {
			const chunks = [], currentLength = this.length
			let i = 0
			while (i < currentLength) {
				chunks.push(this.slice(i, i += length));
			}
			return chunks
		},
		writable: false
	},
	standarDeviation: {
		value: function () {
			let mean = this.reduce((acc, curr) => acc + curr, 0) / this.length;

			const arr = this.map((k) => (k - mean) ** 2)

			let sum = arr.reduce((acc, curr) => acc + curr, 0);
			let variance = sum / arr.length
			return Math.sqrt(sum / arr.length)
		}
	}
})

class UtilitiesFileList extends Array {
	constructor(elements) {
		super()
		const typeOfElements = Utilities.getType(elements)
		if (typeOfElements === 'File') {
			this.push(elements)
		} else if (typeOfElements === 'Array') {
			for (const element of elements) {
				this.push(element)
			}
		}
	}

	push(element) {
		if (Utilities.getType(element) !== 'File') throw new Error(`El elemento debe ser de tipo 'File'.`)
		super.push(element)
	}
}

if (typeof SVGGraphicsElement !== 'undefined') {
	SVGGraphicsElement.prototype.plus = function () {
		/* Mecánica de movimiento */
		let zoom
		const pointers = {}
		const minZoom = 2000
		const maxZoom = 500

		// this.addEventListener('pointerdown', event => dragging = true)

		this.addEventListener('pointerup', event => {
			delete pointers[event.pointerId.toString()]
			zoom = null
		})

		this.addEventListener('pointermove', event => {
			if (![1, 2, 3].includes(event.buttons)) return
			let zooming
			const widthElement = this.width.baseVal.value
			const heightElement = this.height.baseVal.value
			const widthBox = this.viewBox.baseVal.width
			const heightBox = this.viewBox.baseVal.height
			const factor = Math.max(widthBox / widthElement, heightBox / heightElement)

			/* Coloca en el array la posición del puntero, útil sólo para el zoom */
			pointers[event.pointerId.toString()] = {
				x: event.clientX,
				y: event.clientY,
			}

			let deltaX, deltaY
			const idsOfPointers = Object.keys(pointers)
			if (idsOfPointers.length > 1) {
				const p0 = pointers[idsOfPointers[0]]
				const p1 = pointers[idsOfPointers[1]]
				/* Análisis del zoom */
				const currentZoom = Math.sqrt(Math.pow(p0.x - p1.x, 2) + Math.pow(p0.y - p1.y, 2))
				if (zoom) {
					const difference = zoom - currentZoom
					const newHeightBox = Math.max(Math.min(heightBox + difference * factor, minZoom), maxZoom)
					const newWidthBox = Math.max(Math.min(widthBox + difference * factor, minZoom), maxZoom)
					this.viewBox.baseVal.height = newHeightBox
					this.viewBox.baseVal.width = newWidthBox
					this.viewBox.baseVal.x = this.viewBox.baseVal.x + (widthBox - newWidthBox) / 2
					this.viewBox.baseVal.y = this.viewBox.baseVal.y + (heightBox - newHeightBox) / 2
				}
				zoom = currentZoom
				zooming = true
			} else {
				deltaX = event.movementX
				deltaY = event.movementY
			}
			if (!zooming) {
				this.viewBox.baseVal.x = this.viewBox.baseVal.x - deltaX * factor
				this.viewBox.baseVal.y = this.viewBox.baseVal.y - deltaY * factor
			}
		})

		this.addEventListener('wheel', event => {
			const sign = event.wheelDelta < 0 ? -1 : 1
			const widthBox = this.viewBox.baseVal.width
			const heightBox = this.viewBox.baseVal.height

			const mouseX = event.clientX / this.clientWidth - 0.5
			const mouseY = event.clientY / this.clientHeight - 0.5

			const newHeightBox = Math.max(Math.min(heightBox - 25 * sign, minZoom), maxZoom)
			const newWidthBox = Math.max(Math.min(widthBox - 25 * sign, minZoom), maxZoom)

			if (newHeightBox !== this.viewBox.baseVal.height || newWidthBox !== this.viewBox.baseVal.width) {
				this.viewBox.baseVal.height = newHeightBox
				this.viewBox.baseVal.width = newWidthBox
				this.viewBox.baseVal.x = this.viewBox.baseVal.x + (widthBox - newWidthBox) / 2 + mouseX * 25
				this.viewBox.baseVal.y = this.viewBox.baseVal.y + (heightBox - newHeightBox) / 2 + mouseY * 25
			}
		})
	}

	SVGGraphicsElement.prototype.clear = function () {
		const children = this.querySelectorAll('*')
		children.forEach(c => this.removeChild(c))
	}
}

if (typeof HTMLCanvasElement !== 'undefined') {
	Object.defineProperties(HTMLCanvasElement.prototype, {
		drawableInit: {
			value: function () {
				if (this._pointermove) return
				const width = this.offsetWidth
				const height = this.offsetHeight
				this.width = width
				this.height = height
				let context = this.getContext('2d')
				context.strokeStyle = 'black'
				context.lineWidth = 1
				let lastPoint
				this._pointermove = event => {
					if (![1, 2, 3].includes(event.buttons)) return
					const prevX = lastPoint?.x ?? (event.layerX - event.movementX)
					const prevY = lastPoint?.y ?? (event.layerY - event.movementY)
					context.beginPath()
					context.moveTo(prevX, prevY)
					context.lineTo(event.layerX, event.layerY)
					context.stroke()
					lastPoint = { x: event.layerX, y: event.layerY }
				}

				this.addEventListener('pointermove', this._pointermove)
				this.addEventListener('pointerup', () => lastPoint = null)

				Object.defineProperties(this, {
					clear: {
						value: () => {
							context.clearRect(0, 0, this.width, this.height)
						}
					}
				})
			}
		}
	})
}

try { global.Utilities = Utilities } catch { }