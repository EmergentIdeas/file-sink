const fs = require('fs')
const pathTools = require('path')
const filog = require('filter-log')

class Sink {
	constructor(path) {
		this.path = path
		this.log = filog('file-sink')
	}
	
	read(path, callback) {
		if(!this.isAllowedPath(path)) {
			throw new Error('Path now allowed: ' + path)
		}
		let combined = pathTools.join(this.path, path)
		this.log.debug('about to read: ' + combined)
		fs.readFile(combined, callback)
	}
	
	write(path, callback) {
		if(!this.isAllowedPath(path)) {
			throw new Error('Path now allowed: ' + path)
		}
		let newArgs = [...arguments]
		newArgs[0] = pathTools.join(this.path, newArgs[0])
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