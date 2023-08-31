import { logger } from "src/logger"

const docs: {
	command: string
	description: string
}[] = [{
	command: 'help',
	description: 'Lista los comando disponibles'
}]

export default () => {
	logger({ label: 'HELP', description: 'Comandos disponibles', body: docs.map(doc => `${doc.command}: ${doc.description}`), exit: true })
}