import test from 'node:test';
import assert from 'node:assert'
import { default as filog } from "filter-log"
import { default as Sink } from "../file-sink.js"

var log1 = filog('standard')
let time = new Date().getTime()
let msg = 'this is a test: ' + time

test("basic tests", async (t) => {

	await t.test('a simple write', async (t) => {
		let pr = new Promise((resolve, reject) => {
			let s = new Sink('./test-data')
			s.write('data1.txt', msg, function (error) {
				if (error) {
					return reject(error)
				}
				return resolve()
			})

		})
		return pr
	})
	await t.test('test remove', async (t) => {
		let pr = new Promise((resolve, reject) => {
			let filename = 'data3.txt'
			let s = new Sink('./test-data')
			let f = async () => {
				try {
					await s.write(filename, '')
					let info = await s.getFullFileInfo(filename)
					assert.equal(info.stat.size, 0)
					await s.rm(filename)
					try {
						info = await s.getFullFileInfo(filename)
						reject(new Error(info))
					}
					catch (e) {
						// the file does not exist, so that should get an error
						resolve()
					}
				}
				catch (err) {
					reject(new Error(err))
				}
			}
			f()
		})
		return pr
	})

	await t.test('a positional write', async (t) => {
		let pr = new Promise((resolve, reject) => {
			let s = new Sink('./test-data')
			let f = async () => {
				try {

					await s.write('data2.txt', '')
					await s.write('data2.txt', 'b', {
						position: 10
					})
					await s.write('data2.txt', 'a', {
						position: 1
					})

					let data = await s.read('data2.txt')
					assert.equal(data.length, 11, "Expected length to be 11")
					assert.equal(data.slice(1, 2).toString(), 'a')
					assert.equal(data.slice(10, 11).toString(), 'b')
					resolve()
				}
				catch (err) {
					reject(new Error(err))
				}
			}
			f()

		})
		return pr
	})


	await t.test('a positional write of buffers', async (t) => {
		let pr = new Promise((resolve, reject) => {
			let s = new Sink('./test-data')
			let f = async () => {
				try {

					await s.write('data2.txt', '')
					await s.write('data2.txt', Buffer.alloc(10, 2), {
						position: 10
					})
					await s.write('data2.txt', Buffer.from([1]), {
						position: 1
					})

					let data = await s.read('data2.txt')
					assert.equal(data.length, 20, "Expected length to be 20")
					assert.equal(data[1], 1)
					for (let i = 10; i < 20; i++) {
						assert.equal(data[i], 2)
					}
					resolve()
				}
				catch (err) {
					reject(new Error(err))
				}
			}
			f()

		})
		return pr
	})


	await t.test('create hash', async (t) => {
		let pr = new Promise((resolve, reject) => {
			let filename = 'data2.txt'
			let s = new Sink('./test-data')
			let f = async () => {
				try {
					let hash = await s.createHash(filename)
					console.log(hash)

					resolve()
				}
				catch (err) {
					reject(new Error(err))
				}
			}
			f()

		})
		return pr
	})



	await t.test('a simple write promise', async (t) => {
		let pr = new Promise((resolve, reject) => {
			let s = new Sink('./test-data')
			s.write('data1.txt', msg).then(() => {
				resolve()
			}).catch(error => {
				return reject(error)
			})
		})
		return pr
	})



	await t.test('a simple write await', async (t) => {
		let pr = new Promise((resolve, reject) => {
			let s = new Sink('./test-data')
			let f = async () => {
				try {
					let result = await s.write('data1.txt', msg)
					resolve()
				}
				catch (err) {
					reject(new Error(err))
				}
			}
			f()
		})
		return pr
	})



	await t.test('a simple read', async (t) => {
		let pr = new Promise((resolve, reject) => {
			let s = new Sink('./test-data')
			s.read('data1.txt', function (error, data) {
				if (error) {
					return reject(error)
				}
				if (msg == data.toString()) {
					resolve()
				}
				else {
					reject(new Error('contents read did not match contents written'))
				}
			})

		})
		return pr
	})


	await t.test('a simple promise read', async (t) => {
		let pr = new Promise((resolve, reject) => {
			let s = new Sink('./test-data')
			s.read('data1.txt').then(data => {
				if (msg == data.toString()) {
					resolve()
				}
				else {
					reject(new Error('contents read did not match contents written'))
				}
			}).catch(err => {
				reject(new Error(err))
			})

		})
		return pr
	})



	await t.test('a simple promise read failure', async (t) => {
		let pr = new Promise((resolve, reject) => {
			let s = new Sink('./test-data')
			s.read('data1-does-not-exist.txt').then(data => {
				reject(new Error('this file should not exist'))
			}).catch(err => {
				resolve()
			})
		})
		return pr
	})



	await t.test('a simple promise await read', async (t) => {
		let pr = new Promise((resolve, reject) => {
			let f = async () => {
				let s = new Sink('./test-data')
				try {
					let data = await s.read('data1.txt')
					if (msg == data.toString()) {
						resolve()
					}
					else {
						reject(new Error('contents read did not match contents written'))
					}
				}
				catch (err) {
					reject(new Error(err))
				}
			}

			f()
		})
		return pr
	})

	await t.test('a simple promise await read failure', async (t) => {
		let pr = new Promise((resolve, reject) => {
			let f = async () => {
				let s = new Sink('./test-data')
				try {
					let data = await s.read('data1-does-not-exist.txt')
					if (msg == data.toString()) {
						reject(new Error('file should not exist'))
					}
					else {
						reject(new Error('contents read did not match contents written'))
					}
				}
				catch (err) {
					// This is correct since the file shouldn't exist
					resolve()
				}
			}

			f()
		})
		return pr
	})


	await t.test('a sync read', async (t) => {
		let pr = new Promise((resolve, reject) => {
			let s = new Sink('./test-data')
			try {
				let data = s.readSync('data1.txt')
				if (msg == data.toString()) {
					resolve()
				}
				else {
					reject(new Error('contents read did not match contents written'))
				}
			}
			catch (error) {
				return reject(error)
			}
		})
		return pr
	})


	await t.test('a stream read', async (t) => {
		let pr = new Promise((resolve, reject) => {
			let s = new Sink('./test-data')
			try {
				let data = ''
				let stream = s.readStream('data1.txt')
				stream.on('data', (chunk) => {
					data += chunk
				})
				stream.on('close', () => {
					if (msg == data.toString()) {
						resolve()
					}
					else {
						reject(new Error('contents read did not match contents written'))
					}
				})
			}
			catch (error) {
				return reject(error)
			}
		})
		return pr
	})


	await t.test('delete non-existent file', async (t) => {
		let pr = new Promise((resolve, reject) => {
			let s = new Sink('./test-data')
			try {

				let promise = s.rm('testfile4')
				promise.then((data) => {
					reject(new Error('this file test not exist so should not be successful'))
				})
					.catch(err => {
						resolve()
					})
			}
			catch (error) {
				return reject(error)
			}

		})
		return pr
	})




	await t.test('a directory create', async (t) => {
		let pr = new Promise((resolve, reject) => {
			let s = new Sink('./test-data')
			try {

				let promise = s.mkdir('testdir')
				promise.then(async (data) => {
					let info = await s.getFullFileInfo('testdir')
					assert.equal('testdir', info.name)
					resolve()
				})
			}
			catch (error) {
				return reject(error)
			}

		})
		return pr
	})


	await t.test('a recursive directory create', async (t) => {
		let pr = new Promise((resolve, reject) => {
			let s = new Sink('./test-data')
			let dirName = 'testdir2/testdir3'

			async function run() {
				try {
					await s.rm('testdir2', {
						recursive: true
					})
				}
				catch (e) { }

				try {
					await s.mkdir(dirName)
					reject(new Error('directory created when it should not have been'))
					return
				}
				catch (e) {
				}

				try {
					await s.mkdir(dirName, {
						recursive: true
					})
					let info = await s.getFullFileInfo(dirName)
					assert.equal('testdir3', info.name)
					await s.rm('testdir2', {
						recursive: true
					})
					resolve()
				}
				catch (e) {
					reject(new Error(e))
				}
			}
			run()

		})
		return pr
	})

	await t.test('a directory delete', async (t) => {
		let pr = new Promise((resolve, reject) => {
			let s = new Sink('./test-data')
			try {

				let promise = s.rm('testdir')
				promise.then((data) => {
					console.log(data)
					resolve()
				})
			}
			catch (error) {
				return reject(error)
			}

		})
		return pr
	})



	await t.test('a directory read', async (t) => {
		let pr = new Promise((resolve, reject) => {
			let s = new Sink('./test-data')
			try {
				let promise = s.getFullFileInfo('')
				promise.then((data) => {
					if (data.children.length == 3) {
						resolve()
					}
					else {
						reject(new Error('the directory did not contain the right number of files'))
					}
				})
			}
			catch (error) {
				return reject(error)
			}

		})
		return pr
	})

})