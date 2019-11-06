# message-event-channel

An event driven fault tolerant library for communicating between contexts using MessageChannel.

# Features

* Subscribe to and broadcast events
* Send and receive JSON
* Make requests that return a promise

# Installation

Using npm:

``` sh
npm install message-event-channel --save
```

Using cdn:

``` html
<script src="https://unpkg.com/message-event-channel/dist/message-event-channel.umd.js"></script>
```
# Including

```js
import { mc } from 'message-event-channel';
mc.connect();
```

or

```js
const mc = require('message-event-channel');
mc.connect();
```

or
``` html
<script src="https://unpkg.com/message-event-channel/dist/message-event-channel.umd.js"></script>
<script>
  mc.connect();
</script>
```


# Usage
## Events

`/parent.html`

```js
const frame = document.querySelector('iframe');
const connection = mc.connect(frame);
connection.emit('my-event', {hello: 'world'});
frame.src = "./frame.html";
```

`/frame.html`

```js
const connection = mc.connect();
connection.on('my-event', (payload)=>{
  // {hello: "world"}
  console.log(payload)
});
```

## Request

`/parent.html`

```js
const connection = mc.connect(frame);
connection.request('some-data')
  .then(payload => {
    // {hello: "world"}
    console.log(payload)
  })
frame.src = "./frame.html";
```

`/frame.html`

```js
import { mc } from 'message-event-channel';
const connection = mc.connect();
connection.on('some-payload', (payload, resolve, reject)=>{
  resolve({hello: 'world'})
});
```

## Emit to all

`/parent.html`

```js
const connection1 = mc.connect(frame1);
const connection2 = mc.connect(frame2);
const connection3 = mc.connect(frame3);
mc.emit('send-to-all');
```

## Close connection

`/parent.html`

```js
const connection = mc.connect(frame1);
mc.close(connection);
```


# Options
```js
{
  targetOrigin: '*' // limit the connection to a particular origin (reccomended)
  onload: true, // if the connection should be initialised by an onload event or manually using init()
  timeout: 2000, // default time it takes for requests to timeout
  debug: false, // used to enable useful behind-the-scenes info
  connectionTimeout: 2000 // will trigger the CONNECTION_TIMEOUT event if a connection hasn't been established by this time, can be set to false.
  clientInitiates: false // Server setting - waits for a init() trigger from the child frame before initiating.
}
```