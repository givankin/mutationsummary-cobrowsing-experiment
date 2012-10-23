/*jshint asi: true, node: true, browser: true */
/*global phantom */
var system = require('system'),
  fs = require('fs'),
  doT = require('dot'),
  page = require('webpage').create(),
  chromeHtml = fs.read('templates/chrome.html'),
  contentHtml = fs.read('templates/content.html'),
  port = 8080,
  server = require('webserver').create(),
  masterInstantiated = false,
  chromeTpl, service, socket

// dont strip whitespace from templates for better Ctrl+U experience
doT.templateSettings.strip = false

// use doT for simple templating (chrome instances can be "masters" or "slaves")
chromeTpl = doT.template(chromeHtml)

// PhantomJS's server isn't powerful enough to support WebSockets
// or even Server-Sent Events, but as a real webkit it has
// WebSockets client support which we will use to communicate
// with node proxy server
socket = new WebSocket('ws://localhost:8081/input')

function socketSend(msg) {
  socket.send(JSON.stringify(msg))
}

// test websockets
//socket.onopen = function() {
//  socketSend({
//    'i am a message': 'from outta space'
//  })
//}

function respondWith(o) {
  this.statusCode = 200
  this.headers = {
    'Cache': 'no-cache',
    'Content-Type': o.type || 'text/html'
  }
  this.write(o.content)
  this.close()
}


service = server.listen(port, function (request, response) {
  var requestURL = request.url,
      pageURL

  function respond(o) {
    respondWith.call(response, o)
  }

  console.log('\nREQUEST CAME:' + requestURL)
//  console.log('\nREQUEST CAME:' + JSON.stringify(request))

  // handle static files

  if ((/\.js$/).test(requestURL)) {
    respond({
      type: 'application/x-javascript',
      content: fs.read(requestURL.replace('/', ''))
    })
    return
  }

  if ((/\.css$/).test(requestURL)) {
    respond({
      type: 'text/css',
      content: fs.read(requestURL.replace('/', ''))
    })
    return
  }

  if (requestURL == '/favicon.ico') {
    return
  }


  // iframe part, which will act as our browser's content window
  if (requestURL == '/content') {

    // let the interesting part begin
    if (request.post && request.post.url) {

      pageURL = request.post.url

      respond({
        content: contentHtml
      })

      console.log('\nopening page: ', pageURL)

      // trace js errors (taken from on of PhantomJS examples)
      page.onError = function(msg, trace) {
        var msgStack = ["ERROR: " + msg];
        if (trace) {
          msgStack.push("TRACE:");
          trace.forEach(function(t) {
            msgStack.push(" -> " + t.file + ": " + t.line + (t['function'] ? " (in function '" + t['function'] + "')" : ""));
          });
        }
        console.error(msgStack.join("\n"));
      }

      // forward console messages
      page.onConsoleMessage = function(msg, lineNum, sourceId) {
        console.log("CONSOLE: " + msg + ' (from line #' + lineNum + ' in "' + sourceId + '")');
      }

      // inject scripts in page.onInitialized instead of page.open
      // so we don't bind to window.onload after the window has already loaded
      page.onInitialized = function() {
        console.log(pageURL + ' succesfully initialized, injecting scripts')
        var inject1 = page.injectJs('scripts/libs/node_map.js'),
            inject2 = page.injectJs('scripts/libs/tree_mirror.js'),
            inject3 = page.injectJs('scripts/content.js')
        console.log('scripts injected: ', inject1, inject2, inject3)
      }

      // go
      page.open(pageURL, function(status) {
        if (status !== 'success') {
          socketSend({'err': 'failed to load ' + pageURL + ', phantomjs status: ' + status})
          return
        }
        console.log(pageURL + ' succesfully opened')
      })

    } else {
      respond({
        content: contentHtml
      })
    }

    return
  }

  // else just give away the browser chrome (master first, slaves second)
  respond({
    content: chromeTpl({
      master: !masterInstantiated
    })
  })
  masterInstantiated = true

})

if (service) {
  console.log('Web server running on port ' + port)
} else {
  console.log('Error: Could not create web server listening on port ' + port)
  phantom.exit()
}


