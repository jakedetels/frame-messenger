export default class FrameMessenger {

  constructor(options) {
    options = options || {};

    this.name = options.name;
    this.frame = options.frame;
    this.targetName = options.targetName;
    this.targetFrame = options.targetFrame;
    this.Promise = options.Promise;

    this.callbackCount = 0;
    this.callbacks = {};
    this.listeners = {};

    if (typeof this.name !== 'string') {
      throw new Error('FrameCommunicator must be initialized with a string in the `name` property');
    }

    if (typeof this.targetName !== 'string') {
      throw new Error('FrameCommunicator must be initialized with a string in the `targetName` property');
    }

    if (! isFrame(this.frame)) {
      throw new Error('FrameCommunicator must be initialized with a frame in the `frame` property');
    }

    if (! isFrame(this.targetFrame)) {
      throw new Error('FrameCommunicator must be initialized with a frame in the `targetFrame` property');
    }

    this.frame.addEventListener('message', this._processMessage.bind(this));

    function isFrame(win) {
      return !! ( win && win.toString().match('[object Window]') );
    }
  }

  postMessage(data, callback, replyId, err) {
    let callbackId = 'c' + this.callbackCount++;

    if (err) {
      if (err instanceof Error) {
        err = {name: err.name, message: err.message, stack: err.stack};
      } else if (typeof err === 'object') {
        err = JSON.parse(JSON.stringify(err));
      }
    }

    this.targetFrame.postMessage({
      __name__: this.targetName,
      __origin_name__: this.name,
      __reply__: callbackId,
      __callback__: replyId,
      __error__: err,
      data
    }, '*');

    if (typeof callback === 'function') {
      this.callbacks[callbackId] = callback;
    } else if (this.Promise) {
      return new this.Promise( (resolve, reject) => {
        this.callbacks[callbackId] = { resolve, reject };
      });
    } else {
      // Create a no-op callback if none was provided and Promises are not being used
      this.callbacks[callbackId] = function() {};
    }
  }

  _processMessage(event) {
    let isLegit = event.source === this.targetFrame && event.data.__name__ === this.name;
    
    if (! isLegit) return;

    let callbackId = event.data.__callback__;
    let callback = this.callbacks[callbackId];

    let reply = (err, data, callback) => {
      this.postMessage(data, callback, event.data.__reply__, err);
    };

    if (callback) {
      
      delete this.callbacks[callbackId];

      if (event.data.__error__) {
        if (callback.reject) {
          callback.reject(event.data.__error__);  
        } else {
          callback(event.data.__error__);
        }
      } else {
        if (callback.resolve) {
          callback.resolve(event.data.data);
        } else {
          callback(null, event.data.data, reply);
        }
      }
    } else if (this._onMessage) {
      this._onMessage(event.data.data, reply);
    } else {
      console.error(`No callback existed to handle callback ID ${callbackId}`);
    }
  }

  onMessage(callback) {
    this._onMessage = callback;
  }

}
