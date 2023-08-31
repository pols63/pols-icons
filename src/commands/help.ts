import { logger } from "../logger"

const generalDescription = '"pols-icons" es una herramienta de línea de comandos que permite la creación de fuentes para íconos. Utilícele el conjunto con los siguientes argumentos para obtener una determinada acción:'

const docs: {
	command: string
	description: string
}[] = [{
	command: 'help',
	description: 'Lista los comando disponibles'
}, {
	command: 'create',
	description: 'Crea un proyecto para una fuente de íconos en el mismo directorio donde se invoca el comando. Especifique como parámetro el nombre de la fuente.'
}, {
	command: 'compile',
	description: 'Compila una fuente de íconos utilizando los recursos del directorio actual'
}]

export default () => {
	logger({
		label: 'HELP',
		description: 'Ayuda de "pols-icons"',
		body: `${generalDescription}\n\n${docs.map(doc => `${doc.command}: ${doc.description}`).join(`\n\n`)}`,
		exit: true
	})
}