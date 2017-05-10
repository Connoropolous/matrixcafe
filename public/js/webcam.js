var peer, peers, myId, socket

/* websockets */
function json(object) {
  return JSON.stringify(object)
}
var socketProtocol = window.location.protocol === 'http:' ? 'ws://' : 'wss://'
socket = new WebSocket(socketProtocol + window.location.host)
socket.onmessage = function (event) {
  var message = JSON.parse(event.data)
  if (message.type === 'peer') {
    var otherId = message.id
    var otherPeer = {
      call: peer.call(otherId, myCamera),
      connection: peer.connect(otherId),
      video: null
    }
    otherPeer.call.on('stream', function(stream) {
      addVideoObjectForPeer(otherId, stream)
    })
    otherPeer.call.on('close', removePeer(otherId))
    otherPeer.connection.on('data', function(data) {
      data = JSON.parse(data)
      otherPeer.video.position.set(data.px, data.py, data.pz)
      otherPeer.video.rotation.set(data.rx, data.ry, data.rz)
    })
    otherPeer.connection.on('close', removePeer(otherId))
    peers[otherId] = otherPeer
  }
}
function sendIdToServer () {
  if (socket.readyState) {
    socket.send(json({type: 'id', id: myId}))
  } else setTimeout(sendIdToServer, 50)
}

/* peerjs */
peer = new Peer({host: 'desolate-springs-61251.herokuapp.com', secure: true, port: '', debug: 3})
function pingHeroku() {
    socket.readyState && socket.send(json({type:'ping'}))
    peer.socket.send({type: 'ping'})
    timeoutID = setTimeout(pingHeroku, 20000)
}
peers = {}
function focPeer(id) {
  if (!peers[id]) {
    peers[id] = {}
  }
  return peers[id]
}
peer.on('open', function(id) {
  myId = id
  sendIdToServer()
  pingHeroku()
})
function removePeer(id) {
  return function () {
    scene.remove(scene.getObjectByName(id))
    delete peers[id]
    var e = document.getElementById(id)
    e && e.remove()
  }
}
// receiving
peer.on('call', function(call) {
  focPeer(call.peer).call = call
  function answer() {
    if (myCamera) {
      call.answer(myCamera)
      call.on('stream', function(stream) {
        addVideoObjectForPeer(call.peer, stream)
      })
      call.on('close', removePeer(call.peer))
    } else setTimeout(answer, 50)
  }
  answer()
})
peer.on('connection', function(conn) {
  focPeer(conn.peer).connection = conn
  conn.on('data', function(data) {
    data = JSON.parse(data)
    focPeer(conn.peer).video.position.set(data.px, data.py, data.pz)
    focPeer(conn.peer).video.rotation.set(data.rx, data.ry, data.rz)
  })
  conn.on('close', removePeer(conn.peer))
})

/* 3d video objects */
function addVideoObjectForPeer (id, stream) {
  var videoElement = document.createElement('video')
  videoElement.id = id
  videoElement.srcObject = stream
  videoElement.play()
  document.body.appendChild(videoElement)
  var MESH_SIZE = 1
  var WIDTH = 1024
  var HEIGHT = 512
  var ASPECT = HEIGHT / WIDTH
  var videoTexture = new THREE.VideoTexture( videoElement )
  videoTexture.minFilter = THREE.LinearFilter
  videoTexture.magFilter = THREE.LinearFilter
  videoTexture.format = THREE.RGBFormat
  var videoMaterial = new THREE.MeshBasicMaterial({
    map: videoTexture,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 1
  })
  var object = new THREE.Mesh(
    new THREE.PlaneBufferGeometry(MESH_SIZE, MESH_SIZE * ASPECT, 1, 1),
    videoMaterial
  )
  object.position.set(0, 1, 0)
  object.rotation.set(-Math.PI / 100, 0, 0)
  object.name = id
  scene.add(object)
  focPeer(id).video = object
}
