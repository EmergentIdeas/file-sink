const fs = require('fs')
const pathTools = require('path')
const filog = require('filter-log')


class Sink {
	constructor(path) {
		this.path = pathTools.resolve(path)
		this.log = filog('file-sink')
	}
	
	read(path, callback) {
		if(!this.isAllowedPath(path)) {
			throw new Error('Path now allowed: ' + path)
		}
		let combined = pathTools.join(this.path, path)
		
		let p = new Promise((resolve, reject) => {
			if(combined.indexOf(this.path) != 0) {
				this.log.error('Possible attack in reading file: ' + combined)
				return reject(new Error('Possible attack in reading file: ' + combined))
			}

			this.log.debug('about to read: ' + combined)
			fs.readFile(combined, (err, data) => {
				if(err) {
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
	
	readSync(path) {
		if(!this.isAllowedPath(path)) {
			throw new Error('Path now allowed: ' + path)
		}
		let combined = pathTools.join(this.path, path)
		
		if(combined.indexOf(this.path) != 0) {
			this.log.error('Possible attack in reading file: ' + combined)
			throw new Error('Possible attack in reading file: ' + combined)
		}

		this.log.debug('about to read: ' + combined)
		return fs.readFileSync(combined)
	}
	
	write(path, data) {
		if(!this.isAllowedPath(path)) {
			throw new Error('Path now allowed: ' + path)
		}
		let newArgs = [...arguments]
		let combined = pathTools.join(this.path, newArgs[0])
		

		let callback = null
		newArgs.forEach((item) => {
			if(typeof item == 'function') {
				callback = item
			}
		})
		

		let p = new Promise((resolve, reject) => {
			let newCallback = (err, data) => {
				if(err) {
					reject(err)
				}
				else {
					resolve(data)
				}
			}
			let replace = true
			for(let i = 0; i < newArgs.length; i++) {
				let item = newArgs[i]
				if(typeof item == 'function') {
					newArgs[i] = newCallback
					replace = false
					break
				}
			}
			
			if(replace) {
				newArgs.push(newCallback)
			}
			
			if(combined.indexOf(this.path) != 0) {
				this.log.error('Possible attack in writing file: ' + combined)
				return reject(new Error('Possible attack in writing file: ' + combined))
			}
			
			newArgs[0] = combined
			this.log.debug('about to write: ' + newArgs[0])
			fs.writeFile.apply(fs, newArgs)
		})
		
		return addCallbackToPromise(p, callback)
	}
	
	isAllowedPath(path) {
		if(path.indexOf('..') > -1) {
			return false
		}
		return true
	}
	
	/**
	 * Get the details for a file, including the children if the path points to
	 * a directory.
	 */
	getFullFileInfo(path, callback) {
		if(!this.isAllowedPath(path)) {
			throw new Error('Path now allowed: ' + path)
		}
		
		path = pathTools.join(this.path, path)

		let rejected = false
		let p = new Promise((resolve, reject) => {
			fs.stat(path, (err, stat) => {
				if(err) {
					return reject(err)
				}
				
				let item = this.createFileItem(path, stat)
				if(item.directory) {
					item.children = []
					fs.readdir(path, (direrr, files) => {
						let size = files.length
						
						if(direrr) {
							return reject(err)
						}
						
						if(size == 0) {
							return resolve(item)
						}
						
						for(let file of files) {
							fs.stat(pathTools.join(path, file), (err, stat) => {
								if(err) {
									rejected = true
									return reject(err)
								}
								
								item.children.push(this.createFileItem(pathTools.join(path, file), stat))
								if(item.children.length == size && !rejected) {
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

}

module.exports = Sink



function addCallbackToPromise(promise, callback) {
	if(callback) {
		promise = promise.then((obj) => {
			callback(null, obj)
		}).catch((err) => {
			callback(err)
		})
	}
	
	return promise
}