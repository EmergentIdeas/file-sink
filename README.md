# File Sink

A slim abstraction over the file system to easily resolve relative paths.

## Install

```bash
npm install file-sink
```


## Selected Methods Summary

- read(path) - Reads file info, returns promise resolving to buffer
- readStream(path) - Reads file info as utf-8 text stream
- write(path, data) - Where data is a string, Buffer, TypedArray or DataView. Lots of options
for writing partial data/files as well. Returns promise.
- rm(path) - removes file or directory (recursive by default), returns promise
- mkdir(path) - makes directory, returns promise
- getFullFileInfo(path) - returns a promise with info about a file or directory. See format below.
- createHash(path) - A promise with the has value of the file data (sha512 by default)
- findPaths(options) - A bit like `find`, allows searching for files and directories by name
- find - Like findPaths, but instead of a promise it returns an EventEmitter which emits `data`
and `done` events. Each `data` event is the path of a match.

## Use

```
const Sink = require('file-sink')
let tempSink = new Sink('/tmp')

// read /tmp/my-file.txt
tempSink.read('my-file.txt', function(err, data) {
	console.log(data.toString())
})

let data = await tempSink.read('my-file.txt')

// read /tmp/my-file.txt
let data = tempSink.readSync('my-file.txt')
// throws error if path does not exist or some other problem happens

// write to /tmp/my-file.txt
tempSink.write('my-file.txt', 'Hello, World!', function(err) {
	// log error if exists
})

try {
	await tempSink.write('my-file.txt')
}
catch(err) {
	// log error
}


// read the info for a file like mod time
let info = await tempSink.getFullFileInfo('my-file.txt')
console.log(info.stat.mtime)

// find the names of the children of a directory

let dirInfo = await tempSink.getFullFileInfo('.')
for(let child of dirInfo.children) {
	console.log((child.directory ? '(d) ': "") + child.name + ' - ' + child.stat.ctime)
}


```

## getFullFileInfo Data Format

Roughly, where `children` contains objects like this, but without the `children` attribute.

```
{
  name: 'testdir',
  parent: '/mnt/workingdata/node-repo/file-sink/test-data',
  stat: Stats {
    dev: 2097,
    mode: 16893,
    nlink: 2,
    uid: 1000,
    gid: 1000,
    rdev: 0,
    blksize: 4096,
    ino: 85729889,
    size: 4096,
    blocks: 8,
    atimeMs: 1701114609826.992,
    mtimeMs: 1701114609826.992,
    ctimeMs: 1701114609826.992,
    birthtimeMs: 1701114609826.992,
    atime: 2023-11-27T19:50:09.827Z,
    mtime: 2023-11-27T19:50:09.827Z,
    ctime: 2023-11-27T19:50:09.827Z,
    birthtime: 2023-11-27T19:50:09.827Z
  },
  directory: true,
  relPath: 'testdir',
  children: []
}
```




## Why?

I wanted to read and write to relative paths without the reader/writer having to
know what the root is or having to do a security check on the path. Essentially, 
it materializes a choice made in the configuration. The module also
does a couple checks to ensure that the final, resolved path is within the
initial root path. 

Additionally, in the code I'm writing, I'm not sure I want to assume a file 
system as the location of my data. I don't want to over-abstract, but this will 
ensure the code doesn't implicitly make those assumptions.