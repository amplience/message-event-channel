# message.io

An event driven fault tolerant library for communicating between contexts using MessageChannel.

# Features

* Subscribe to and broadcast events
* Send and receive JSON
* Make requests that return a promise

# Installation

Using npm:

``` sh
npm install message-io --save
```

Using cdn:

``` html
<script src="https://unpkg.com/message-io/dist/message-io.umd.js"></script>
```
# Including

```js
import { mio } from 'message-io';
mio.connect();
```

or

```js
const mio = require('message-io');
mio.connect();
```

or
``` html
<script src="https://unpkg.com/message-io/dist/message-io.umd.js"></script>
<script>
  mio.connect();
</script>
```


# Usage
## Events

`/parent.html`

```js
const frame = document.querySelector('iframe');
const connection = mio.connect(frame);
connection.emit('my-event', {hello: 'world'});
frame.src = "./frame.html";
```

`/frame.html`

```js
const connection = mio.connect();
connection.on('my-event', (payload)=>{
  // {hello: "world"}
  console.log(payload)
});
```

## Request

`/parent.html`

```js
const connection = mio.connect(frame);
connection.request('some-data')
  .then(payload => {
    // {hello: "world"}
    console.log(payload)
  })
frame.src = "./frame.html";
```

`/frame.html`

```js
import { mio } from 'message-io';
const connection = mio.connect();
connection.on('some-payload', (payload, resolve, reject)=>{
  resolve({hello: 'world'})
});
```

## Emit to all

`/parent.html`

```js
const connection1 = mio.connect(frame1);
const connection2 = mio.connect(frame2);
const connection3 = mio.connect(frame3);
mio.emit('send-to-all');
```

## Close connection

`/parent.html`

```js
const connection = mio.connect(frame1);
mio.close(connection);
```


# Options
```js
{
  targetOrigin: '*' // limit the connection to a particular origin (reccomended)
  onload: true, // if the connection should be initialised by an onload event or manually
  timeout: 2000, // default time it takes for requests to timeout
  debug: false, // used to enable useful behind-the-scenes info
}
```