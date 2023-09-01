import fs = require('fs')
import path = require('path')

export type TRecord<T = unknown> = Record<string, T | T[]>

export type Config = {
	fontName: string
	iconClassPrefix?: string,
	baseClass?: string,
	codepointRanges: [number, number][]
}

const mode = fs.existsSync(path.join(__dirname, 'dev')) ? 'DEV' : 'PROD'
export const workPath = mode == 'DEV' ? path.join(__dirname, '../test') : process.cwd()