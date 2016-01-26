# Frame Messenger


[![Build Status](https://api.travis-ci.org/jakedetels/frame-messenger.svg?branch=master)](https://api.travis-ci.org/jakedetels/frame-messenger.svg)

A tiny JavaScript class to simplify communication between different browser frames, supporting both promises and callbacks.

# Installation

`npm install frame-messenger`

# Documentation

## `new FrameMessenger(options)`

```js
var messenger = new FrameMessenger({
  frame: window,
  targetFrame: window.parent,
  name: 'iframe',
  targetName: 'topFrame',
  Promise: window.Promise // optional
});
```

### Options

`frame` *{Window} required* 
Frame should be a reference to the current window (i.e., `window`)

`name` *{String} required* 
An arbriary name to assign to the current frame. Other frames must use this name when initiating communication.

`targetFrame` *{Window} required* 
A reference to the frame we will be communicating with (e.g., `parent`, `top`, `opener`, `iframeEl.contentWindow`)

`targetName` *{Window} required* 
An arbriary name to assign to the other frame we want to communicate with.  The other frame must use this same name to reference itself (see examples below).

`Promise` *{Promise constructor} optional* 
A promise constructor to use for creating promises.  When not passed, regular node-style callbacks will be used.

## `messenger.postMessage()`
Send a message to the other frame:

```js
var messenger = new FrameMessenger({
  frame: window,
  targetFrame: parent,
  name: 'iframe',
  targetName: 'topFrame'
});

messenger.postMessage('Hello top frame!');
```

Pass in a callback to process the response from the other frame:
```js
messenger.postMessage('Hello top frame!', function(err, data) {
  if (err) {
    throw new Error(err);
  }

  console.log('The other frame replied with: ' + data);
});
```

Alternately, `postMessage` will return a promise if `FrameMessenger` was invoked with a `Promise` property:

```js
var messenger = new FrameMessenger({
  frame: window,
  targetFrame: window.parent,
  name: 'iframe',
  targetName: 'topFrame',
  Promise: RSVP.Promise  // choose your favorite promise library
});

messenger.postMessage('Hello top frame!').then(function(data) {
  console.log('The other frame replied with: ' + data);
}, function(err) {
  // Process error
});

```

You can maintain an open communication with the other frame by utilizing the `callback` argument that is passed to the `postMessage` callback:

```js
messenger.postMessage('Hello top frame!', function(err, data, callback) {
  if (err) {
    throw new Error(err);
  }

  console.log('The other frame replied with: ' + data);

  // Like node callbacks, the first parameter passed to the callback
  // should be either an error object/message or null (if there are no errors)
  callback(null, 'Thanks for the response!');
});
```


## `messenger.onMessage(data, callback)`
Handle messages from the other frame with `onMessage`:

```js
messenger.onMessage(function(data) {
  console.log('The targetFrame sent me: ' + data);
});
```

The other frame can send a response back by utilizing the callback argument passed to `onMessage`:
```js
messenger.onMessage(function(data, callback) {
  if (data === 'Knock knock') {
    callback(null, "Who's there?")
  } else {
    callback(new Error('I only know knock knock jokes.'));
  }
});
```

See the tests for other examples.

## Tests

Running the tests:

```js
npm install
npm test
```

## License

This project is distributed under the MIT license.