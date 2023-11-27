
module.exports = {
	/**
	 * Returns/creates a test function based on the pattern.
	 *  
	 * @param {string | RegExp | function | async function} pattern 
	 * @returns 
	 */
	_createTest(pattern) {
		let test
		if(pattern) {
			if(typeof pattern === 'function') {
				test = pattern
			}
			else {
				if(typeof pattern === 'string') {
					pattern = new RegExp(pattern)
				}
				if(pattern instanceof RegExp) {
					test = function(value) {
						return pattern.test(value)
					}
				}
			}
		}
		return test
	},

	/**
	 * Finds files and directories a bit like the unix `find` command.
	 * 
	 * @param {object} options
	 * @param {string} options.startingPath The relative path within the sink to begin looking.
	 * @param {boolean} options.file Set to true if paths which represent files should be emitted (true by default)
	 * @param {boolean} options.directory Set to true if paths which represent directories should be emitted (true by default)
	 * @param {string | RegExp | function | async function} options.namePattern A test for the name of the file/directory.
	 * If a function it must return true for the path to be emitted. If an async function, it must resolve to true for the
	 * path to be emitted. If a regex, the `test` function must return true when passed the name. If a string, it will be
	 * passed to `new RegExp()` to create a regular expression.
	 * @param {string | RegExp | function | async function} options.pathPattern A test for the path of the file/directory.
	 * Works like namePattern except that the relative path value of the item is used instead of just the name.
	 * @returns An EventEmitter which emits `data` and `done` events.
	 * The `data` events have string which is a relative path matching
	 * the criteria.
	 */
	find({
		file = true
		, directory = true
		, namePattern
		, pathPattern
		, startingPath = ""
		} = {}) {
		let started = 0
		let done = 0
		let options = arguments[1]
		let output = this._createEventEmitter()

		let nameTest = this._createTest(namePattern)
		let pathTest = this._createTest(pathPattern)
		let self = this

		async function match(name, path) {
			if(nameTest) {
				let result = nameTest(name)
				if(result instanceof Promise) {
					result = await result
				}
				if(!result) {
					return
				}
			}
			if(pathTest) {
				let result = pathTest(path)
				if(result instanceof Promise) {
					result = await result
				}
				if(!result) {
					return
				}
			}

			output.emit('data', path)
		}


		function contentsOfPath(path) {
			self.getFullFileInfo(path).then(cur => {
				for (let child of cur.children) {
					let childPath = path + "/" + child.name
					while (childPath.startsWith('/')) {
						childPath = childPath.substring(1)
					}
					if (child.directory) {
						if (directory) {
							match(child.name, childPath)
						}
						started++
						contentsOfPath(childPath, options)
					}
					else {
						if (file) {
							match(child.name, childPath)
						}
					}
				}

			}).catch(err => {
				// Happens when we can't read the directory as well as true errors
			}).finally(() => {
				done++
				if (started == done) {
					output.emit('done')
				}
			})
		}
		started++
		contentsOfPath(startingPath)

		return output
	},

	/**
	 * Finds files and directories a bit like the unix `find` command.
	 * 
	 * @param {object} options See options for `find`.
	 * @returns A promise which resolves to an array of strings of relative paths
	 * which match the conditions given in the options.
	 */
	async findPaths(options) {
		return new Promise((resolve, reject) => {
			let items = []

			let events = this.find(options)

			events
			.on('data', path => {
				items.push(path)
			})
			.on('done', () => {
				resolve(items)
			})
		})
	}

}