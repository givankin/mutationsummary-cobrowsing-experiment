/*jshint asi: true, eqeqeq: false, sub: true, devel: true, browser: true */
/*global TreeMirror */

// Our simple browser client works like this:
// * Opens a websocket to our proxy node server
// * When the server sends a DOM tree, recreates it in iframe
// * Overrides all links in the new tree to react to them
// * Also can handle errors (nothing special, just say if things go wrong)

(function(w, d, undefined) {

  var $urlForm = d.getElementById('urlForm'),
      $awesomebar = d.getElementById('awesomebar'),
      socketURL = 'ws://localhost:8081/output',
      iFrameDocument, treeMirrorParams, base, mirror, socket

  treeMirrorParams = {
    createElement: function(tagName) {
      var node

      if (tagName == 'SCRIPT') {
        node = d.createElement('NO-SCRIPT')
        node.style.display = 'none'
        return node
      }

      if (tagName == 'HEAD') {
        node = d.createElement('HEAD')
        node.appendChild(d.createElement('BASE'))
        node.firstChild.href = base;
        return node;
      }

    },
    setAttribute: function(node, attr, val) {
      // remove anchors's onclick dom0-style handlers so they
      // don't mess with our click handler and don't produce errors
      if (node.nodeName == 'A' && attr == 'onclick') {
        return true
      }
    }
  }

  function handleMessage(msg) {
    if (msg.base) {
      base = msg.base

    } else if (msg.err) {
      iFrameDocument.getElementById('loading').style.display = 'none'
      iFrameDocument.getElementById('error').innerHTML = msg.err
      iFrameDocument.getElementById('error').style.display = 'block'

    } else if (msg.url) {
      $awesomebar.value = msg.url

    // trigger treemirror's method; in our example only 'initialize' can be triggered,
    // so it's reasonable to clearPage() and (re-)instantiate the mirror here
    } else if (msg.f && msg.f == 'initialize') {
      clearPage()
      mirror = new TreeMirror(iFrameDocument, treeMirrorParams)
      mirror.initialize.apply(mirror, msg.args)

    // called when remote socket is closed
    } else if (msg.clear) {
      clearPage()

    // for debugging
    } else {
      console.log('just message: ', msg)
    }

  }

  function clearPage() {
    if (iFrameDocument) {
      while (iFrameDocument.firstChild) {
        iFrameDocument.removeChild(iFrameDocument.firstChild)
      }
    }
  }

  // called from iframe when loaded (see content template)
  w.onIframeLoaded = function() {

    iFrameDocument = w.frames['content'].document

    // Override behavior for links: instead of reloading an iframe,
    // use them via our "browser" so that mirrors stay in sync.
    iFrameDocument.onclick = function(e) {
      // "slave" mirrors can't navigate
      e.preventDefault()
      // only "master" can
      if (e.target.href && w.MASTER) {
        $awesomebar.value = e.target.href
        $urlForm.submit()
      }
    }

    if (!socket) {
      socket = new WebSocket(socketURL)

      socket.onmessage = function(event) {
        var msg = JSON.parse(event.data)
        console.log('MSG: ', msg)
        if (msg instanceof Array) {
          msg.forEach(function(subMessage) {
            handleMessage(JSON.parse(subMessage))
          })
        } else {
          handleMessage(msg)
        }
      }

      socket.onclose = function() {
        socket = new WebSocket(socketURL)
      }
    }

  }

})(window, document)

