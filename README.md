# File Sink

A slim abstraction over the file system to easily resolve relative paths.

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