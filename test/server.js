var system = require('system'),
  fs = require('fs'),
  page = require('webpage').create(),
  chromeTpl = fs.read('chromeTpl.html'),
  chromeSlaveTpl = fs.read('chromeSlaveTpl.html'),
  contentTpl = fs.read('contentTpl.html'),
  port = 8080,
  server = require('webserver').create(),
  masterInstantiated = false,
  service, socket

socket = new WebSocket('ws://localhost:8081/input')

function socketSend(msg) {
  socket.send(JSON.stringify(msg))
}

socket.onopen = function() {
  socketSend({
    'i am a message': 'from outta space'
  })
}

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
  var respond = function(o) {
    respondWith.call(response, o)
  }

  console.log('\nREQUEST CAME:' + request.url)
//  console.log('\nREQUEST CAME:' + JSON.stringify(request))

  if ((/\.js$/).test(request.url)) {
    respond({
      type: 'application/x-javascript',
      content: fs.read(request.url.replace('/', ''))
    })
    return
  }

  if ((/\.css$/).test(request.url)) {
    respond({
      type: 'text/css',
      content: fs.read(request.url.replace('/', ''))
    })
    return
  }

  if (request.url == '/favicon.ico') {
    return
//    respond({
//      type: 'image/x-icon',
//      content: fs.read('favicon.ico')
//    })
  }

  if (request.url == '/content') {
    console.log('\n/content request came')
      // let the interesting part begin
      if (request.post && request.post.url) {
        respond({
          content: contentTpl
        })
        console.log('\nopening page: ', request.post.url)
        page.onError = function(msg, trace) {
          var msgStack = ["ERROR: " + msg];
          if (trace) {
            msgStack.push("TRACE:");
            trace.forEach(function(t) {
              msgStack.push(" -> " + t.file + ": " + t.line + (t.function ? " (in function '" + t.function + "')" : ""));
            });
          }
          console.error(msgStack.join("\n"));
        };
        page.onConsoleMessage = function(msg, lineNum, sourceId) {
          console.log("CONSOLE: " + msg + ' (from line #' + lineNum + ' in "' + sourceId + '")');
        };
        // inject scripts in page.onInitialized instead of page.open
        // so we don't bind to window.onload after the window has already loaded
        page.onInitialized = function() {
          console.log(request.post.url + ' succesfully initialized, injecting scripts')
          var inject1 = page.injectJs('node_map.js'),
              inject2 = page.injectJs('tree_mirror.js'),
              inject3 = page.injectJs('client-content.js')
          console.log('scripts injected: ', inject1, inject2, inject3)
        }
        page.open(request.post.url, function(status) {
          if (status !== 'success') {
            socketSend({'err': 'Failed to load ' + request.post.url + ', phantomjs status: ' + status})
            return
          }
          console.log(request.post.url + ' succesfully opened')
        })
      } else {
        respond({
          content: contentTpl
        })
      }
    return
  }

  respond({
    content: masterInstantiated ? chromeSlaveTpl : chromeTpl
  })
  masterInstantiated = true

})

if (service) {
  console.log('Web server running on port ' + port)
} else {
  console.log('Error: Could not create web server listening on port ' + port)
  phantom.exit()
}


