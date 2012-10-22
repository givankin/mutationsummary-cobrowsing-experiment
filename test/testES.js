var http = require('http')
  , fs   = require('fs')
  , PORT = process.argv[2] || 8081
  , HOST = process.argv[3] || '127.0.0.1';


http.createServer(function (req, res) {
  if (req.url == '/events') {
    res.writeHead(200, { 'Content-Type'  : 'text/event-stream'
      , 'Cache-Control' : 'no-cache'
      , 'Connection'    : 'keep-alive'
    });
    console.log('Client connect');

    var t = setInterval(function () {
      console.log('Send data');
      res.write('data: DATA\n\n');
    }, 1000);

    res.socket.on('close', function () {
      console.log('Client leave');
      clearInterval(t);
    });

  } else {
    res.writeHead(200, {'Content-Type': 'text/html'});
    res.write(fs.readFileSync(__dirname + '/testES.html'));
    res.end()
  }
}).listen(PORT, HOST);