var myCamera // webcam
var SCREEN_WIDTH
var SCREEN_HEIGHT
var scene = new THREE.Scene()
var clock = new THREE.Clock()
var camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 200 )
camera.position.set( 0, 1.5, 2 )
var controls = new THREE.FirstPersonControls( camera )
controls.lookSpeed = 0.1;
controls.movementSpeed = 3;
controls.noFly = false;
controls.lookVertical = true;
controls.constrainVertical = true;
controls.verticalMin = 1.0;
controls.verticalMax = 2.5;
controls.lon = 250;
controls.lat = 30;

var renderer = new THREE.WebGLRenderer({ alpha: true })
renderer.setSize( window.innerWidth, window.innerHeight )
var maxAnisotropy = renderer.getMaxAnisotropy();
var ground
var mouseDown = false

new THREE.TextureLoader().load('img/background.png', function ( texture ) {
  texture.anisotropy = maxAnisotropy;
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set( 200, 200 );
  ground = new THREE.Mesh(
    new THREE.PlaneBufferGeometry( 200, 200 ),
    new THREE.MeshBasicMaterial({map: texture}) );
  ground.rotation.x = -Math.PI / 2;
  scene.add(ground);
})

function render() {
	requestAnimationFrame( render )
  controls.update( clock.getDelta() )
	renderer.render( scene, camera )
}

var sendInterval = window.setInterval(function () {
  peers && Object.keys(peers).forEach(function (id) {
    if (peers[id].connection) {
      peers[id].connection.send(JSON.stringify({
        px: camera.position.x,
        py: camera.position.y,
        pz: camera.position.z,
        rx: camera.rotation.x,
        ry: camera.rotation.y,
        rz: camera.rotation.z
      }))
    }
  })
}, 100)

function hideInstr() {
  var instr = document.querySelector('.instructions')
  instr.style.display = 'none'
}

function toggleMute() {
  var enabled = myCamera.getAudioTracks()[0].enabled
  myCamera.getAudioTracks()[0].enabled = !enabled
  var mute = document.querySelector('.mute')
  mute.classList.toggle('active')
}

document.addEventListener('DOMContentLoaded', function(event) {
  var close = document.querySelector('.close')
  close.addEventListener('click', hideInstr)
  setTimeout(hideInstr, 15000)
  var mute = document.querySelector('.mute')
  mute.addEventListener('click', toggleMute)
  document.body.appendChild(renderer.domElement)
  /* usermedia */
  navigator.mediaDevices.getUserMedia({video: true, audio: true}).then(function(stream) {
    myCamera = stream
    var videoElement = document.createElement('video')
    videoElement.id = 'mine'
    videoElement.srcObject = stream
    document.body.appendChild(videoElement)
    videoElement.onloadedmetadata = function(e) {
      videoElement.play();
    };
  }).catch(function(err) {
    console.log('Failed to get local stream' ,err);
  });
  render()
})
window.addEventListener( 'resize', function onWindowResize() {
	SCREEN_WIDTH = window.innerWidth;
	SCREEN_HEIGHT = window.innerHeight;
	camera.aspect = SCREEN_WIDTH / SCREEN_HEIGHT;
	camera.updateProjectionMatrix();
	renderer.setSize( SCREEN_WIDTH, SCREEN_HEIGHT );
	controls.handleResize();
}, false );
