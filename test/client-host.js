(function(w, d, undefined) {

  var instantiated = false

  // called from iframe when loaded (contentTpl)
  w.onIframeLoaded = function() {

    if (instantiated) {
      //return
    }

    var iFrameDocument = w.frames['content'].document
    var base;

    instantiated = true

    var mirror = new TreeMirror(iFrameDocument, {
      createElement: function(tagName) {
        if (tagName == 'SCRIPT') {
          var node = iFrameDocument.createElement('NO-SCRIPT');
          node.style.display = 'none';
          return node;
        }

        if (tagName == 'HEAD') {
          var node = iFrameDocument.createElement('HEAD');
          node.appendChild(iFrameDocument.createElement('BASE'));
          node.firstChild.href = base;
          return node;
        }
      }
    });

    var socket = new WebSocket('ws://localhost:8081/output')

    function handleMessage(msg) {
      if ( msg.clear) {
        clearPage()
      } else if (msg.base) {
        base = msg.base
      } else if (msg.err) {
        alert(msg.err)
      } else if (msg.f && mirror[msg.f]) {
        mirror[msg.f].apply(mirror, msg.args)
      } else {
        console.log('junk message: ', msg)
      }
    }

    function clearPage() {
      while (iFrameDocument.firstChild) {
        iFrameDocument.removeChild(iFrameDocument.firstChild);
      }
    }

    socket.onmessage = function(event) {
      var msg = JSON.parse(event.data);
      console.log('MSG: ', msg)
      if (msg instanceof Array) {
        msg.forEach(function(subMessage) {
          handleMessage(JSON.parse(subMessage));
        });
      } else {
        handleMessage(msg);
      }
    }

    socket.onclose = function() {
      socket = new WebSocket(receiverURL);
    }

  }

})(window, document)

