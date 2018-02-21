const createTsCompiler = require('../').default

const compiler = createTsCompiler({
	cwd: __dirname,
	tsc: '../node_modules/.bin/tsc'
})
compiler(() => {
	console.log('complete')
}, () => {
	console.log('update')
})
