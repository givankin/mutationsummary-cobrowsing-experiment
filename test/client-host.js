(function(w, d, undefined) {

  var MASTER = !w.SLAVE,
      $urlForm = d.getElementById('urlForm'),
      $awesomebar = d.getElementById('awesomebar'),
      iFrameDocument, treeMirrorParams, base, mirror, socket

  treeMirrorParams = {
    createElement: function(tagName) {
      var node

      if (tagName == 'SCRIPT') {
        node = d.createElement('NO-SCRIPT');
        node.style.display = 'none';
        return node;
      }

      if (tagName == 'HEAD') {
        node = d.createElement('HEAD');
        node.appendChild(d.createElement('BASE'));
        node.firstChild.href = base;
        return node;
      }

    }
  }

  function handleMessage(msg) {
    if (msg.clear) {
      clearPage()
    } else if (msg.base) {
      base = msg.base
    } else if (msg.err) {
      alert(msg.err)
    } else if (msg.url) {
      $awesomebar.value = msg.url
      // trigger treemirror's method; in our example only 'initialize' can be triggered,
      // so it's reasonable to clearPage() and (re-)instantiate the mirror here
    } else if (msg.f && msg.f == 'initialize') {
      clearPage()
      mirror = new TreeMirror(iFrameDocument, treeMirrorParams)
      mirror.initialize.apply(mirror, msg.args)
    } else {
      console.log('junk message: ', msg)
    }
  }

  function clearPage() {
    if (!iFrameDocument) {
      return
    }
    while (iFrameDocument.firstChild) {
      iFrameDocument.removeChild(iFrameDocument.firstChild)
    }
  }

  // called from iframe when loaded (see contentTpl)
  w.onIframeLoaded = function() {

    iFrameDocument = w.frames['content'].document

    iFrameDocument.onclick = function(e) {
      e.preventDefault()
      if (e.target.href && MASTER) {
        $awesomebar.value = e.target.href
        $urlForm.submit()
      }
    }

    if (!socket) {
      socket = new WebSocket('ws://localhost:8081/output')

      socket.onmessage = function(event) {
        var msg = JSON.parse(event.data)
        console.log('MSG: ', msg)
        if (msg instanceof Array) {
          msg.forEach(function(subMessage) {
            handleMessage(JSON.parse(subMessage))
          });
        } else {
          handleMessage(msg)
        }
      }

      socket.onclose = function() {
        socket = new WebSocket(receiverURL)
      }
    }

  }

})(window, document)

