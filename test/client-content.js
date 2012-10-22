// Copyright 2011 Google Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

var serverURL = 'ws://localhost:8081/input';

var socket;

console.log('adding load listener')
function socketSend(msg) {
  socket.send(JSON.stringify(msg));
}

window.addEventListener('load', function() {
  console.log('load event fired')
  startMirroring();
});

// main function for mirrored tab
function startMirroring() {
  if (socket)
    return;

  socket = new WebSocket(serverURL);
  var mirrorClient;

  // ! socket points to <server>/projector
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
      },
      // called back by treemirrorClient's mutationsummary instance
      // (see tree_mirror.js > TreeMirrorClient constructor and
      // TreeMirrorClient.prototype.applyChanged)
      applyChanged: function(removed, addedOrMoved, attributes, text) {
        socketSend({
          f: 'applyChanged',
          args: [removed, addedOrMoved, attributes, text]
        });
      }
    });
  }

  socket.onclose = function() {
    mirrorClient.disconnect();
    socket = undefined;
  }
}

function stopMirroring() {
  if (socket)
    socket.close();
  socket = undefined;
}