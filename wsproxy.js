/*jshint asi: true, node: true*/
var WebSocket = require('faye-websocket'),
  http = require('http'),
  fs = require('fs'),
  server = http.createServer(),
  messages = [],
  clients = [],
  host

// listening to socket
server.addListener('upgrade', function (request, rawsocket, head) {
  var socket = new WebSocket(request, rawsocket, head)

  // input (messages that come from PhantomJS)
  if (request.url == '/input') {
    console.log('input connection initiating')

    if (host) {
      console.log('closing existing socket, resetting messages')
      host.close()
      messages = []
    }

    host = socket

    socket.onmessage = function (event) {
      var data = JSON.parse(event.data)

      console.log('message received, sending ' + messages.length + ' messages to ' + clients.length + ' clients');

      // send to current clients
      clients.forEach(function (client) {
        client.send(event.data)
      });

      // keep for future clients unless it's an error
      if (!data.err) {
        messages.push(event.data)
      }
    };

    socket.onclose = function () {
      console.log('host socket closing, clearing messages')
      messages = []
      clients.forEach(function (socket) {
        socket.send(JSON.stringify({ clear:true }))
      })
      host = undefined
    }

    console.log('host (input) socket successfully initialized')

    return
  }

  // output (messages that go to client browsers)
  if (request.url == '/output') {
    clients.push(socket)

    console.log('client connected (' + clients.length + ' clients, ' + messages.length + ' messages now)')

    socket.send(JSON.stringify(messages))

    socket.onclose = function () {
      var index = clients.indexOf(socket)
      clients.splice(index, 1)
      console.log('Client left (' + clients.length + ' clients now)')
    }
  }
});

console.log('Server listening on 8081')
server.listen(8081);