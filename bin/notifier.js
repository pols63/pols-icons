module.exports = ({ title, body, exit, error }) => {
	const color = error ? 'fgRed' : 'fgCyan'
	console.log(title[color])
	if (body) console.log(body)
	if (exit) process.exit()
}