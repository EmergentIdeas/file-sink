const childProcess = require('child_process')
const FileSink = require('../file-sink')
const EventEmitter = require('events')

// let dir = '/tmp'
let dir = '/home/kolz/data/node-repo'
let sink = new FileSink(dir)

let findFound
function useFind() {
	console.time('find')
	childProcess.exec(`find ${dir}`, (err, stdout, stderr) => {
		// console.log(stdout)
		console.timeEnd('find')
		findFound = stdout.split('\n').map(line => {
			return line.substring(dir.length + 1)
		})
	})
}


async function runSink() {
	console.time('sink')

	let r = []

	let paths = await sink.findPaths({
		file: true,
		pathPattern: (value) => {
			return new Promise((resolve, reject) => {
				setTimeout(function() {
					resolve(value.indexOf('node_modules') < 0 && value.indexOf('.git') < 0)
				})

			})
		}
	})

	console.timeEnd('sink')
	paths.sort()
	// console.log(paths.join('\n'))
	console.log(`Found ${paths.length} results from sink.`)
}

// useFind()
runSink()



