const fs = require('fs')
const pathTools = require('path')
const filog = require('filter-log')
const addCallbackToPromise = require('add-callback-to-promise')
const crypto = require('crypto')
const EventEmitter = require('events')

/**
 * An abstraction over a file system.
 */
class Sink {
	/**
	 * The directory at the root of the file sink
	 * @param {string} path 
	 */
	constructor(path) {
		this.path = pathTools.resolve(path)
		this.log = filog('file-sink')
	}

	/**
	 * Reads data from a file
	 * @param {string} path The path of the file within the sink
	 * @param {function} [callback] An optional callback. If specified, 
	 * it will be added to the promise chain.
	 * @returns A promise which resolves to data from the file, a Buffer
	 */
	read(path, callback) {
		if (!this.isAllowedPath(path)) {
			throw new Error('Path now allowed: ' + path)
		}
		let combined = pathTools.join(this.path, path)

		let p = new Promise((resolve, reject) => {
			if (combined.indexOf(this.path) != 0) {
				this.log.error('Possible attack in reading file: ' + combined)
				return reject(new Error('Possible attack in reading file: ' + combined))
			}

			this.log.debug('about to read: ' + combined)
			fs.readFile(combined, (err, data) => {
				if (err) {
					reject(err)
				}
				else {
					resolve(data)
				}
			})
		})

		addCallbackToPromise(p, callback)
		return p
	}

	/**
	 * Reads data from a file
	 * 
	 * @param {string} path The path of the file within the sink
	 * @returns A Buffer with the file data
	 */
	readSync(path) {
		if (!this.isAllowedPath(path)) {
			throw new Error('Path now allowed: ' + path)
		}
		let combined = pathTools.join(this.path, path)

		if (combined.indexOf(this.path) != 0) {
			this.log.error('Possible attack in reading file: ' + combined)
			throw new Error('Possible attack in reading file: ' + combined)
		}

		this.log.debug('about to read: ' + combined)
		return fs.readFileSync(combined)
	}

	/**
	 * Creates a file read stream
	 * 
	 * @param {string} path The path of the file within the sink
	 * @returns An fs.ReadStream object
	 */
	readStream(path) {
		if (!this.isAllowedPath(path)) {
			throw new Error('Path now allowed: ' + path)
		}
		let combined = pathTools.join(this.path, path)

		if (combined.indexOf(this.path) != 0) {
			this.log.error('Possible attack in reading file: ' + combined)
			throw new Error('Possible attack in reading file: ' + combined)
		}

		this.log.debug('about to create a read stream: ' + combined)
		return fs.createReadStream(combined)
	}

	/**
	 * Writes data to a file.
	 * 
	 * If the offset, length, or position options are used, the node file handle interfaces
	 * are used to write the file, and, in a difference from expected behavior, the file is
	 * lengthened if the position is beyond the current end of the file.
	 * 
	 * 
	 * @param {string} path 
	 * @param {string | Buffer | TypedArray | DataView} data 
	 * @param {object} options Options, including those normally associated with fs.writeFile
	 * @param {object} options.offset Offset into the data
	 * @param {object} options.length The length of the data to write
	 * @param {object} options.position Position within the file
	 * @param {function} [callback] An optional callback. If specified, 
	 * it will be added to the promise chain.
	 * @returns A promoise which resolves null
	 */
	async write(path, data) {
		if (!this.isAllowedPath(path)) {
			throw new Error('Path now allowed: ' + path)
		}
		let newArgs = [...arguments]
		let combined = pathTools.join(this.path, newArgs[0])


		let callback = null
		let options = {}

		for (let i = 2; i < newArgs.length; i++) {
			let item = newArgs[i]
			if (typeof item == 'function') {
				callback = item
			}
			if (typeof item == 'object') {
				Object.assign(options, item)
			}
		}

		if (options.offset || options.length || options.position) {
			let fh
			if (options.position) {
				let stat
				let size

				try {
					stat = await fs.promises.stat(combined)
					size = stat.size
					fh = await fs.promises.open(combined, 'r+')
				}
				catch (e) {
					// The file doesn't exist and we'll have to create it
					size = 0
					fh = await fs.promises.open(combined, 'w')
				}
				if (size < options.position) {
					// We need to pad the file
					let pad = Buffer.alloc(options.position - size, 0)
					await fh.write(pad, {
						position: size
					})
				}
			}
			else {
				fh = await fs.promises.open(combined, 'w')

			}

			newArgs.shift()
			newArgs[0] = Buffer.from(newArgs[0])
			let p = fh.write.apply(fh, newArgs)
			p.then(data => { fh.close() })
			return addCallbackToPromise(p, callback)
		}
		else {
			let p = new Promise((resolve, reject) => {
				let newCallback = (err, data) => {
					if (err) {
						reject(err)
					}
					else {
						resolve(data)
					}
				}
				let needsCallback = true
				for (let i = 0; i < newArgs.length; i++) {
					let item = newArgs[i]
					if (typeof item == 'function') {
						newArgs[i] = newCallback
						needsCallback = false
						break
					}
				}

				if (needsCallback) {
					newArgs.push(newCallback)
				}

				if (combined.indexOf(this.path) != 0) {
					this.log.error('Possible attack in writing file: ' + combined)
					return reject(new Error('Possible attack in writing file: ' + combined))
				}

				newArgs[0] = combined
				this.log.debug('about to write: ' + newArgs[0])
				fs.writeFile.apply(fs, newArgs)
			})

			return addCallbackToPromise(p, callback)
		}
	}

	/**
	 * Removes a file or directory
	 * @param {string} path 
	 * @param {function} [callback]
	 * @param {object} [options]
	 * @param {object} [options.recursive] If true will delete a directory and its contents (true by default)
	 * @returns 
	 */
	async rm(path, callback, options) {
		if (!this.isAllowedPath(path)) {
			throw new Error('Path now allowed: ' + path)
		}
		
		if(typeof callback == 'object' && !options) {
			options = callback
			callback = null
		}
		
		options = Object.assign({
			recursive: true
		}, options)

		path = pathTools.join(this.path, path)
		
		let fileStat
		try {
			fileStat = await fs.promises.stat(path)
			return addCallbackToPromise(fs.promises.rm(path, options), callback)
		}
		catch(e) {
			return addCallbackToPromise(Promise.reject(), callback)
		}
	}

	/**
	 * Makes a directory
	 * @param {string} path 
	 * @param {object} options Same as the node js promises mkdir options
	 * @param {boolean} options.recursive create intermediate directories
	 * @param {boolean} options.mode The premission string from the new directories
	 * 
	 * @returns a promise which resolves to the fs.promises.mkdir promise resolution
	 */
	mkdir(path, options) {
		if (!this.isAllowedPath(path)) {
			throw new Error('Path now allowed: ' + path)
		}

		path = pathTools.join(this.path, path)
		return fs.promises.mkdir(path, options)
	}

	isAllowedPath(path) {
		if (path.indexOf('..') > -1) {
			return false
		}
		return true
	}

	/**
	 * Get the details for a file, including the children if the path points to
	 * a directory.
	 */
	getFullFileInfo(path, callback) {
		if (!this.isAllowedPath(path)) {
			throw new Error('Path now allowed: ' + path)
		}

		path = pathTools.join(this.path, path)

		let rejected = false
		let p = new Promise((resolve, reject) => {
			fs.stat(path, (err, stat) => {
				if (err) {
					return reject(err)
				}

				let item = this.createFileItem(path, stat)
				if (item.directory) {
					item.children = []
					fs.readdir(path, (direrr, files) => {
						if (direrr) {
							return reject(err)
						}
						let size = files.length

						if (size == 0) {
							return resolve(item)
						}

						for (let file of files) {
							fs.stat(pathTools.join(path, file), (err, stat) => {
								if (err) {
									rejected = true
									return reject(err)
								}

								item.children.push(this.createFileItem(pathTools.join(path, file), stat))
								if (item.children.length == size && !rejected) {
									resolve(item)
								}
							})
						}
					})
				}
				else {
					return resolve(item)
				}

			})

		})

		return addCallbackToPromise(p, callback)
	}

	createHash(path, algorithm = 'sha512') {
		if (!this.isAllowedPath(path)) {
			throw new Error('Path now allowed: ' + path)
		}

		path = pathTools.join(this.path, path)
		let p = new Promise((resolve, reject) => {
			const hash = crypto.createHash(algorithm)
			const stream = fs.createReadStream(path)
			stream.on('error', err => reject(err))
			stream.on('data', chunk => hash.update(chunk))
			stream.on('end', () => resolve(hash.digest('hex')))
		})
		return p
	}

	createFileItem(path, stat) {
		let item = {
			name: pathTools.basename(path),
			parent: pathTools.dirname(path),
			stat: stat,
			directory: stat.isDirectory(),
			relPath: pathTools.relative(this.path, path)
		}
		return item
	}

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
	}

	find({
		file = true
		, directory = true
		, namePattern
		, pathPattern
		} = {}) {
		let started = 0
		let done = 0
		let options = arguments[1]
		let output = new EventEmitter()

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
		contentsOfPath('')

		return output
	}

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

module.exports = Sink
