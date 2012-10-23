/*jshint asi: true, browser: true, devel: true */
/*global TreeMirrorClient*/

// This script is injected by PhantomJS in every loaded page.
// Basically it just opens a socket and sends the whole DOM tree there.
// Additionally sends real page url so our browser clients can show it.

// Based on MutationSummary screensharing extension's content_script.js

(function() {
  var serverURL = 'ws://localhost:8081/input',
      socket

  console.log('adding load listener')
  window.addEventListener('load', function() {
    console.log('load event fired')
    startMirroring()
  })

  function socketSend(msg) {
    socket.send(JSON.stringify(msg))
  }

  function startMirroring() {
    var mirrorClient

    if (socket) {
      return
    }

    socket = new WebSocket(serverURL)

    socket.onopen = function() {
      socketSend({ url: location.href });
      socketSend({ base: location.href.match(/^(.*\/)[^\/]*$/)[1] });
      mirrorClient = new TreeMirrorClient(document, {
        // called back with root el's id and all dom tree
        // (see tree_mirror.js > TreeMirrorClient constructor)
        initialize: function(rootId, children) {
          socketSend({
            f: 'initialize',
            args: [rootId, children]
          });
        }
        // called back by treemirrorClient's mutationsummary instance
        // (see tree_mirror.js > TreeMirrorClient constructor and
        // TreeMirrorClient.prototype.applyChanged)
        // (NOT USED since PhantomJS has no support for MutationObserver)
//        applyChanged: function(removed, addedOrMoved, attributes, text) {
//          socketSend({
//            f: 'applyChanged',
//            args: [removed, addedOrMoved, attributes, text]
//          })
//        }
      })
    }

    socket.onclose = function() {
      mirrorClient.disconnect()
      socket = undefined
    }
  }


})()
