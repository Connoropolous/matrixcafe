var express = require('express')
var app = express()
var expressWs = require('express-ws')(app)
var aWss
app.use(express.static('public'))

var peerIds = []

function removePeer(id) {
  var index = peerIds.indexOf(id)
  if (index > -1) peerIds.splice(index, 1)
}

function json(object) {
  return JSON.stringify(object)
}

app.ws('/', function(socket, req) {
  socket.send(json({type: 'peers', peerIds: peerIds}))
  socket.on('message', function(msg) {
    msg = JSON.parse(msg)
    if (msg.type === 'id') {
      peerIds.push(msg.id)
      socket.peerId = msg.id
      aWss.clients.forEach(function(client) {
        if (client !== socket) client.send(json({type: 'peer', peerId: msg.id}));
      })
    }
  })
  socket.on('close', function() {
    removePeer(socket.peerId)
  })
})
aWss = expressWs.getWss('/')

app.listen(process.env.PORT || 3000)
console.log('running on port ' + (process.env.PORT || 3000))
