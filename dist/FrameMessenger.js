(function (global, factory) {
  if (typeof define === 'function' && define.amd) {
    define('FrameMessenger', ['exports', 'module'], factory);
  } else if (typeof exports !== 'undefined' && typeof module !== 'undefined') {
    factory(exports, module);
  } else {
    var mod = {
      exports: {}
    };
    factory(mod.exports, mod);
    global.FrameMessenger = mod.exports;
  }
})(this, function (exports, module) {
  'use strict';

  var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

  function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

  var FrameMessenger = (function () {
    function FrameMessenger(options) {
      _classCallCheck(this, FrameMessenger);

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

      if (!isFrame(this.frame)) {
        throw new Error('FrameCommunicator must be initialized with a frame in the `frame` property');
      }

      if (!isFrame(this.targetFrame)) {
        throw new Error('FrameCommunicator must be initialized with a frame in the `targetFrame` property');
      }

      this.frame.addEventListener('message', this._processMessage.bind(this));

      function isFrame(win) {
        return !!(win && win.postMessage && typeof win.postMessage === 'function');
      }
    }

    _createClass(FrameMessenger, [{
      key: 'postMessage',
      value: function postMessage(data, callback, replyId, err) {
        var _this = this;

        var callbackId = 'c' + this.callbackCount++;

        if (err) {
          if (err instanceof Error) {
            err = { name: err.name, message: err.message, stack: err.stack };
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
          data: data
        }, '*');

        if (typeof callback === 'function') {
          this.callbacks[callbackId] = callback;
        } else if (this.Promise) {
          return new this.Promise(function (resolve, reject) {
            _this.callbacks[callbackId] = { resolve: resolve, reject: reject };
          });
        } else {
          // Create a no-op callback if none was provided and Promises are not being used
          this.callbacks[callbackId] = function () {};
        }
      }
    }, {
      key: '_processMessage',
      value: function _processMessage(event) {
        var _this2 = this;

        var isLegit = event.source === this.targetFrame && event.data.__name__ === this.name;

        if (!isLegit) return;

        var callbackId = event.data.__callback__;
        var callback = this.callbacks[callbackId];

        var reply = function reply(err, data, callback) {
          _this2.postMessage(data, callback, event.data.__reply__, err);
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
          console.error('No callback existed to handle callback ID ' + callbackId);
        }
      }
    }, {
      key: 'onMessage',
      value: function onMessage(callback) {
        this._onMessage = callback;
      }
    }]);

    return FrameMessenger;
  })();

  module.exports = FrameMessenger;
});