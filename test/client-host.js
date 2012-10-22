(function(w, d, undefined) {

  var MASTER = !w.SLAVE,
      $urlForm = d.getElementById('urlForm'),
      $awesomebar = d.getElementById('awesomebar')

  // called from iframe when loaded (contentTpl)
  w.onIframeLoaded = function() {


    var iFrameDocument = w.frames['content'].document
    var base;

    iFrameDocument.onclick = function(e) {
      e.preventDefault()
      if (e.target.href && MASTER) {
        $awesomebar.value = e.target.href
        $urlForm.submit()
      }
    }

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

        // add onclick handler for links
//        if (tagName == 'A') {
//          var node = iFrameDocument.createElement('A')
//          node.onclick = function() {
//            console.log('GOTO: ', this.href)
//            return false
//          }
//        }

      }
      // prevent our onclick from being overriden
//      setAttribute: function(node, attrName, attrValue) {
//        if (node.nodeName == 'A' && attrName == 'onclick') {
//          console.log('preventing override ', node, attrName, attrValue)
//          return false
//        }
//      }
    });

    var socket = new WebSocket('ws://localhost:8081/output')

    function handleMessage(msg) {
      if ( msg.clear) {
        clearPage()
      } else if (msg.base) {
        base = msg.base
      } else if (msg.err) {
        alert(msg.err)
      } else if (msg.url) {
        $awesomebar.value = msg.url
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

