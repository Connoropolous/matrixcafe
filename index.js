var express = require('express')
var app = express()
var expressWs = require('express-ws')(app)
var aWss
app.use(express.static('public'))

function json(object) {
  return JSON.stringify(object)
}

app.ws('/', function(socket, req) {
  socket.on('message', function(msg) {
    msg = JSON.parse(msg)
    if (msg.type === 'id') {
      aWss.clients.forEach(function(client) {
        if (client !== socket) client.send(json({type: 'peer', id: msg.id}));
      })
    }
  })
})
aWss = expressWs.getWss('/')

app.listen(process.env.PORT || 3000)
console.log('running on port ' + (process.env.PORT || 3000))
