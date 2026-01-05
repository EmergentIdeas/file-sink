import test from 'node:test';
import assert from 'node:assert'
import { default as Sink } from "../file-sink.js"

// await t.test('', async (t) => {
// 	let pr = new Promise((resolve, reject) => {
// 	})
// })


test("basic find tests", async (t) => {
	await t.test('find everything', async (t) => {
		let pr = new Promise((resolve, reject) => {
			let s = new Sink('./test-data-2')
			s.findPaths().then(result => {
				assert.equal(result.length, 5, "The incorrect number of items found.")
				return resolve()
			})
				.catch(error => {
					console.log(error)
					reject(error)
				})
		})
		return pr
	})
	await t.test('find everything at starting path', async (t) => {
		let pr = new Promise((resolve, reject) => {
			let s = new Sink('./test-data-2')
			s.findPaths({
				startingPath: 'c-dir'
			}).then(result => {
				assert.equal(result.length, 2, "The incorrect number of items found.")
				return resolve()
			})
				.catch(error => {
					console.log(error)
					reject(error)
				})
		})
		return pr
	})

	await t.test('find everything starting with a or d (function)', async (t) => {
		let pr = new Promise((resolve, reject) => {
			let s = new Sink('./test-data-2')
			s.findPaths({
				namePattern: function (name) {
					return name.startsWith('a') || name.startsWith('d')
				}
			}).then(result => {
				assert.equal(result.length, 2, "The incorrect number of items found.")
				return resolve()
			})
				.catch(error => {
					console.log(error)
					reject(error)
				})
		})

		return pr
	})


	await t.test("find everything starting with a or d (async function)", async (t) => {
		let pr = new Promise((resolve, reject) => {
			let s = new Sink('./test-data-2')
			s.findPaths({
				namePattern: function (name) {
					return new Promise((resolve, reject) => {
						resolve(name.startsWith('a') || name.startsWith('d'))
					})
				}
			}).then(result => {
				assert.equal(result.length, 2, "The incorrect number of items found.")
				return resolve()
			})
				.catch(error => {
					console.log(error)
					reject(error)
				})
		})

		return pr
	})

	await t.test("find everything starting with a or d (regex)", async (t) => {
		let pr = new Promise((resolve, reject) => {
			let s = new Sink('./test-data-2')
			s.findPaths({
				namePattern: /^[ad].*/
			}).then(result => {
				assert.equal(result.length, 2, "The incorrect number of items found.")
				return resolve()
			})
				.catch(error => {
					console.log(error)
					reject(error)
				})
		})
		return pr
	})

	await t.test("find everything starting with a or d (case insensitive regex)", async (t) => {
		let pr = new Promise((resolve, reject) => {
			let s = new Sink('./test-data-2')
			s.findPaths({
				namePattern: /^[AD].*/i
			}).then(result => {
				assert.equal(result.length, 2, "The incorrect number of items found.")
				return resolve()
			})
				.catch(error => {
					console.log(error)
					reject(error)
				})
		})
		return pr
	})

	await t.test("find everything starting with a or d (string regex)", async (t) => {
		let pr = new Promise((resolve, reject) => {
			let s = new Sink('./test-data-2')
			s.findPaths({
				namePattern: '^[ad].*'
			}).then(result => {
				assert.equal(result.length, 2, "The incorrect number of items found.")
				return resolve()
			})
				.catch(error => {
					console.log(error)
					reject(error)
				})
		})
		return pr
	})

	await t.test("find everything starting with c-dir (function)", async (t) => {
		let pr = new Promise((resolve, reject) => {
			let s = new Sink('./test-data-2')
			s.findPaths({
				pathPattern: function (path) {
					return path.startsWith('c-dir')
				}
			}).then(result => {
				assert.equal(result.length, 3, "The incorrect number of items found.")
				return resolve()
			})
				.catch(error => {
					console.log(error)
					reject(error)
				})
		})
		return pr
	})

	await t.test("find directories starting with c-dir (function)", async (t) => {
		let pr = new Promise((resolve, reject) => {
			let s = new Sink('./test-data-2')
			s.findPaths({
				directory: true,
				file: false,
				pathPattern: function (path) {
					return path.startsWith('c-dir')
				}
			}).then(result => {
				assert.equal(result.length, 1, "The incorrect number of items found.")
				return resolve()
			})
				.catch(error => {
					console.log(error)
					reject(error)
				})
		})
		return pr
	})

	await t.test("find files starting with c-dir (function)", async (t) => {
		let pr = new Promise((resolve, reject) => {
			let s = new Sink('./test-data-2')
			s.findPaths({
				directory: false,
				file: true,
				pathPattern: function (path) {
					return path.startsWith('c-dir')
				}
			}).then(result => {
				assert.equal(result.length, 2, "The incorrect number of items found.")
				return resolve()
			})
				.catch(error => {
					console.log(error)
					reject(error)
				})
		})

		return pr
	})

})