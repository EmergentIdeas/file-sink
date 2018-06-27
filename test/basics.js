var filog = require('filter-log')
require('mocha')
var expect = require('chai').expect
var assert = require('chai').assert

let Sink = require('../file-sink')

var log1 = filog('standard')
let time = new Date().getTime()
let msg = 'this is a test: ' + time

describe("basic tests", function() {
	it("a simple write", function(done) {
		let s = new Sink('./test-data')
		s.write('data1.txt', msg, function(error) {
			if(error) {
				return done(error)
			}
			return done()
		})
		
	})

	it("a simple read", function(done) {
		let s = new Sink('./test-data')
		s.read('data1.txt', function(error, data) {
			if(error) {
				return done(error)
			}
			if(msg == data.toString()) {
				done()
			}
			else {
				done(new Error('contents read did not match contents written'))
			}
		})
		
	})
	
	it("a sync read", function(done) {
		let s = new Sink('./test-data')
		try {
			let data = s.readSync('data1.txt')
			if(msg == data.toString()) {
				done()
			}
			else {
				done(new Error('contents read did not match contents written'))
			}
		}
		catch(error) {
			return done(error)
		}
	})
	
	it("a directory read", function(done) {
		let s = new Sink('./test-data')
		try {
			let promise = s.getFullFileInfo('')
			promise.then((data) => {
				if(data.children.length == 2) {
					done()
				}
				else {
					done(new Error('the directory did not contain the right number of files'))
				}
			})
		}
		catch(error) {
			return done(error)
		}
	})
	
})