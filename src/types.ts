import path = require('path')

export type TRecord<T = unknown> = Record<string, T | T[]>

export type Config = {
	fontName: string
	iconClassPrefix?: string,
	baseClass?: string,
	codepointRanges: [number, number][]
}

const mode = 'DEV'
export const workPath = mode == 'DEV' ? path.join(__dirname, '../test') : process.cwd()