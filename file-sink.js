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
		
		if(combined.indexOf(this.path) != 0) {
			this.log.error('Possible attack in reading file: ' + combined)
			return callback(new Error('Possible attack in reading file: ' + combined))
		}

		this.log.debug('about to read: ' + combined)
		fs.readFile(combined, callback)
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
		
		if(combined.indexOf(this.path) != 0) {
			this.log.error('Possible attack in writing file: ' + combined)
			let callback = null
			newArgs.forEach((item) => {
				if(typeof item == 'function') {
					callback = item
				}
			})
			return callback(new Error('Possible attack in writing file: ' + combined))
		}
		
		newArgs[0] = combined
		this.log.debug('about to write: ' + newArgs[0])
		fs.writeFile.apply(fs, newArgs)
	}
	
	isAllowedPath(path) {
		if(path.indexOf('..') > -1) {
			return false
		}
		return true
	}
}

module.exports = Sink