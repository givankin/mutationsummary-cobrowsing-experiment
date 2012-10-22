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

  // input
  if (request.url == '/input') {
    console.log('input connection initiating')

    if (host) {
      console.log('closing existing socket, resetting messages')
      host.close()
      messages = []
    }

    host = socket

    messages.push(JSON.stringify({ clear:true }))

    clients.forEach(function (socket) {
      socket.send(messages[0])
    })

    socket.onmessage = function (event) {
      console.log('message received, sending ' + messages.length +
        ' messages to ' + clients.length + ' clients');
      clients.forEach(function (client) {
        client.send(event.data)
      });

      messages.push(event.data)
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

  // output
  if (request.url == '/output') {
    clients.push(socket)

    console.log('Client connected (' + clients.length + ' clients, ' + messages.length + ' messages now')

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