/* global FrameMessenger, RSVP */

var expect = chai.expect;

describe('class initialization', function() {
  var options;

  beforeEach(function() {
    options = {
      frame: window,
      targetFrame: window,
      name: 'foo',
      targetName: 'bar'
    };
  });

  it('throws an error when not invoked with new', function() {
    expect( FrameMessenger ).to.throw('Cannot call a class as a function');
  });

  ['frame', 'targetFrame', 'name', 'targetName'].forEach(function(key) {
    it('throws an error when ' + key + ' option unset', function() {
      delete options[key];

      expect(function() {
        new FrameMessenger(options);
      }).to.throw('`' + key + '`');
    });
  });
});

context('communicating between frames', function() {
  var iWin, iframe;
  
  beforeEach(function loadIframe(done) {
    window.beforeEachDone = done;

    iframe = document.createElement('iframe');
    var html = '<!doctype html><html><head></head><body>' + 
      '<script src="dist/FrameMessenger.js"></script>' +
      '<script>top.beforeEachDone()</script>' +
      '</body></html>';

    document.body.appendChild(iframe);

    iWin = iframe.contentWindow;
    
    var iDoc = iWin.document;

    iDoc.open();
    iDoc.write(html);
    iDoc.close();
  });

  afterEach(function removeIframe() {
    document.body.removeChild(iframe);
    window.beforeEachDone = undefined;
    delete window.beforeEachDone;
  });


  var comm1, comm2;
  beforeEach(function createMessengers() {
    comm1 = new FrameMessenger({
      frame: window,
      targetFrame: iWin,
      name: 'top',
      targetName: 'iframe'
    });

    comm2 = new iWin.FrameMessenger({
      frame: iWin,
      targetFrame: window,
      name: 'iframe',
      targetName: 'top'
    });
  });

  describe('regular communications', function() {
    it('can send a message to another frame', function(done) {
      comm1.postMessage('hello world');
      comm2.onMessage(function(data) {
        expect(data).to.equal('hello world');
        done();
      });
    });

    it('can await a response from another frame', function(done) {
      
      comm2.onMessage(function(data, callback) {
        callback(null, data.replace('world', 'Jake'));
      });

      comm1.postMessage('hello world', function(err, data) {
        expect(data).to.equal('hello Jake');
        done();
      });
    });

    it('can handle a series of messages', function(done) {

      comm1.postMessage(1, function(err, data, callback) {
        callback(null, data + 1, function(err, data) {
          expect(data).to.equal(4);
          done();
        });

      });
      
      comm2.onMessage(function(data, callback) {
        callback(null, data + 1, function(err, data, callback) {
          callback(null, data + 1);
        });
      });
    });

    it('can respond with an error', function(done) {
      comm1.postMessage('is there a problem?', function(err, data, callback) {
        expect(err.message).to.equal('Yes, we have a problem');
        done();
      });

      comm2.onMessage(function(data, callback) {
        callback(new iWin.Error('Yes, we have a problem'));
      });
    });
  });


  describe('communicating with promises', function() {

    beforeEach(function() {
      comm1.Promise = RSVP.Promise;
      comm2.Promise = RSVP.Promise;
    });

    it('can await a response from another frame', function() {
      
      comm2.onMessage(function(data, callback) {
        callback(null, data.replace('world', 'Jake'));
      });

      return comm1.postMessage('hello world').then(function(data) {
        expect(data).to.equal('hello Jake');
      });
    });

    it('can handle a series of messages', function() {

      comm2.onMessage(function(data, callback) {
        callback(null, data + 1, function(err, data, callback) {
          callback(null, data + 1);
        });
      });

      return comm1.postMessage(1).then(function(data) {
        return comm1.postMessage(data + 1);
      }).then(function(data) {
        expect(data).to.equal(4);
      });
    });

    it('can reject with an error', function() {
      comm2.onMessage(function(data, callback) {
        callback(new iWin.Error('Yes, we have a problem'));
      });

      return comm1.postMessage('is there a problem?').then(null, function(err) {
        expect(err.message).to.equal('Yes, we have a problem');
      });
    });

  });

});
