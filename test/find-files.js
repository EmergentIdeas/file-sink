var filog = require('filter-log')
require('mocha')
var assert = require('chai').assert

let Sink = require('../file-sink')

let time = new Date().getTime()
let msg = 'this is a test: ' + time

describe("basic find tests", function () {
	it("find everything", function (done) {
		let s = new Sink('./test-data-2')
		s.findPaths().then(result => {
			assert.equal(result.length, 5, "The incorrect number of items found.")
			return done()
		})
		.catch(error => {
			console.log(error)
			done(error)
		})
	})

	it("find everything at starting path", function (done) {
		let s = new Sink('./test-data-2')
		s.findPaths({
			startingPath: 'c-dir'
		}).then(result => {
			assert.equal(result.length, 2, "The incorrect number of items found.")
			return done()
		})
		.catch(error => {
			console.log(error)
			done(error)
		})
	})

	it("find everything starting with a or d (function)", function (done) {
		let s = new Sink('./test-data-2')
		s.findPaths({
			namePattern: function(name) {
				return name.startsWith('a') || name.startsWith('d')
			}
		}).then(result => {
			assert.equal(result.length, 2, "The incorrect number of items found.")
			return done()
		})
		.catch(error => {
			console.log(error)
			done(error)
		})
	})
	
	it("find everything starting with a or d (async function)", function (done) {
		let s = new Sink('./test-data-2')
		s.findPaths({
			namePattern: function(name) {
				return new Promise((resolve, reject) => {
					resolve(name.startsWith('a') || name.startsWith('d'))
				})
			}
		}).then(result => {
			assert.equal(result.length, 2, "The incorrect number of items found.")
			return done()
		})
		.catch(error => {
			console.log(error)
			done(error)
		})
	})

	it("find everything starting with a or d (regex)", function (done) {
		let s = new Sink('./test-data-2')
		s.findPaths({
			namePattern: /^[ad].*/
		}).then(result => {
			assert.equal(result.length, 2, "The incorrect number of items found.")
			return done()
		})
		.catch(error => {
			console.log(error)
			done(error)
		})
	})

	it("find everything starting with a or d (case insensitive regex)", function (done) {
		let s = new Sink('./test-data-2')
		s.findPaths({
			namePattern: /^[AD].*/i
		}).then(result => {
			assert.equal(result.length, 2, "The incorrect number of items found.")
			return done()
		})
		.catch(error => {
			console.log(error)
			done(error)
		})
	})

	it("find everything starting with a or d (string regex)", function (done) {
		let s = new Sink('./test-data-2')
		s.findPaths({
			namePattern: '^[ad].*'
		}).then(result => {
			assert.equal(result.length, 2, "The incorrect number of items found.")
			return done()
		})
		.catch(error => {
			console.log(error)
			done(error)
		})
	})

	it("find everything starting with c-dir (function)", function (done) {
		let s = new Sink('./test-data-2')
		s.findPaths({
			pathPattern: function(path) {
				return path.startsWith('c-dir')
			}
		}).then(result => {
			assert.equal(result.length, 3, "The incorrect number of items found.")
			return done()
		})
		.catch(error => {
			console.log(error)
			done(error)
		})
	})

	it("find directories starting with c-dir (function)", function (done) {
		let s = new Sink('./test-data-2')
		s.findPaths({
			directory: true,
			file: false,
			pathPattern: function(path) {
				return path.startsWith('c-dir')
			}
		}).then(result => {
			assert.equal(result.length, 1, "The incorrect number of items found.")
			return done()
		})
		.catch(error => {
			console.log(error)
			done(error)
		})
	})

	it("find files starting with c-dir (function)", function (done) {
		let s = new Sink('./test-data-2')
		s.findPaths({
			directory: false,
			file: true,
			pathPattern: function(path) {
				return path.startsWith('c-dir')
			}
		}).then(result => {
			assert.equal(result.length, 2, "The incorrect number of items found.")
			return done()
		})
		.catch(error => {
			console.log(error)
			done(error)
		})
	})

})