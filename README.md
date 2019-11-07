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

```ts
import { ClientConnection } from 'message-event-channel';
const connection = new ClientConnection();
```

or

```js
const mc = require('message-event-channel');
const connection = new mc.ClientConnection();
```

or
``` html
<script src="https://unpkg.com/message-event-channel/dist/message-event-channel.umd.js"></script>
<script>
  const connection = new mc.ClientConnection();
</script>
```


# Usage
## Events

`/parent.html`

```ts
import { ServerConnection } from 'message-event-channel';
const frame = document.querySelector('iframe');
const connection = new ServerConnection(frame);
connection.emit('my-event', {hello: 'world'});
frame.src = "./frame.html";
```

`/frame.html`

```ts
import { ClientConnection } from 'message-event-channel';
const connection = new ClientConnection();
connection.on('my-event', (payload)=>{
  // {hello: "world"}
  console.log(payload)
});
```

## Request

`/parent.html`

```ts
import { ServerConnection } from 'message-event-channel';
const connection = new ServerConnection(frame);
connection.request('some-data')
  .then(payload => {
    // {hello: "world"}
    console.log(payload)
  })
frame.src = "./frame.html";
```

`/frame.html`

```ts
import { ClientConnection } from 'message-event-channel';
const connection = new ClientConnection();
connection.on('some-payload', (payload, resolve, reject)=>{
  resolve({hello: 'world'})
});
```

## Emit to all

`/parent.html`

```ts
import { Operator } from 'message-event-channel';
const operator = new Operator();
const connection1 = operator.connect(frame1);
const connection2 = operator.connect(frame2);
const connection3 = operator.connect(frame3);
operator.emit('send-to-all');
```

## Close connection

`/parent.html`

```js
import { ServerConnection } from 'message-event-channel';
const connection = new ServerConnection(frame);
connection.close();
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