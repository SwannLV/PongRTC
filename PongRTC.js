// MAIN
if ( ! Detector.webgl ) Detector.addGetWebGLMessage();
// standard global variables
var container, scene, camera, renderer, controls, stats;
var keyboard = new THREEx.KeyboardState();
var clock = new THREE.Clock();

var localVideo;
var localStream;
var localVideoTexture;
var localRacket, remoteRacket, ball;
// constant for the field
var fieldW   = 859;
var fieldL   = 1059;
// constant for the ball
var angle    = 10;//Math.random()*Math.PI*2; // TO DO
var ballVelX = Math.cos(angle)*10;
var ballVelZ = Math.sin(angle)*10;
// constant for the head
var headX = 0;
var headXoffset = 0;

init();
animate();

// FUNCTIONS     	
function init() 
{
	// SCENE
	scene = new THREE.Scene();
	// CAMERA
	var SCREEN_WIDTH = window.innerWidth, SCREEN_HEIGHT = window.innerHeight;
	var VIEW_ANGLE = 45, ASPECT = SCREEN_WIDTH / SCREEN_HEIGHT, NEAR = 0.1, FAR = 20000;
	camera = new THREE.PerspectiveCamera( VIEW_ANGLE, ASPECT, NEAR, FAR);
	scene.add(camera);
	camera.position.set(0,400,-900);
	camera.lookAt(scene.position);	
	// RENDERER
	renderer = new THREE.WebGLRenderer( {antialias:true} );
	renderer.setSize(SCREEN_WIDTH, SCREEN_HEIGHT);
	container = document.createElement( 'div' );
	document.body.appendChild( container );
	container.appendChild( renderer.domElement );
	// EVENTS
	THREEx.WindowResize(renderer, camera);
	THREEx.FullScreen.bindKey({ charCode : 'm'.charCodeAt(0) });
	// CONTROLS
	//controls = new THREE.TrackballControls( camera );
	// STATS
	stats = new Stats();
	stats.domElement.style.position = 'absolute';
	stats.domElement.style.bottom = '0px';
	stats.domElement.style.zIndex = 100;
	container.appendChild( stats.domElement );
	// LIGHT
	var light1 = new THREE.PointLight(0xffffff);
	light1.position.set(500,250,500);
	scene.add(light1);
    var light2 = new THREE.PointLight(0xffffff);
    light2.position.set(-500,250,-500);
	scene.add(light2);
	// FLOOR
	var floorMaterial = new THREE.MeshBasicMaterial( { color: 0x333333 } );
	var floorGeometry = new THREE.PlaneGeometry(1000, 1000, 10, 10);
	var floor = new THREE.Mesh(floorGeometry, floorMaterial);
	floor.position.y = -0.5;
	floor.doubleSided = true;
	scene.add(floor);
	// SKYBOX/FOG
	var skyBoxGeometry = new THREE.CubeGeometry( 10000, 10000, 10000 );
	var skyBoxMaterial = new THREE.MeshBasicMaterial( { color: 0x9999ff } );
	var skyBox = new THREE.Mesh( skyBoxGeometry, skyBoxMaterial );
    skyBox.flipSided = true; // render faces from inside of the cube, instead of from outside (default).
	// scene.add(skyBox);
	scene.fog = new THREE.FogExp2( 0x9999ff, 0.00025 );
	
	/////////////
	// Rackets //
	/////////////
    // Face detection setup
    var canvasInput = document.createElement('canvas'); // compare
    canvasInput.setAttribute('width','320');
    canvasInput.setAttribute('height','240');
    
    localVideo = document.createElement('video');
    localVideo.width     = 320;
    localVideo.height    = 240;
    localVideo.autoplay  = true;
    document.body.appendChild(localVideo);
    
    var htracker = new headtrackr.Tracker({smoothing : true, fadeVideo : true, ui : false});
    htracker.init(localVideo, canvasInput);
    htracker.start();

	localVideoTexture	= new THREE.Texture(localVideo);
	// do a flipX in the video1Texture
	localVideoTexture.repeat.set(-1, 1);
	localVideoTexture.offset.set( 1, 0);
        
	var racketGeometry = new THREE.CubeGeometry( 160, 120, 0 );
	var localCubeMaterial = new THREE.MeshBasicMaterial( { map: localVideoTexture, transparent: true, opacity: 0.5} );
	localRacket = new THREE.Mesh( racketGeometry, localCubeMaterial );
	localRacket.position.set(0,60,-450);
	scene.add(localRacket);
    
    var remoteCubeMaterial = new THREE.MeshBasicMaterial( { color: 0xFF4444, map: localVideoTexture } );
    remoteRacket = new THREE.Mesh( racketGeometry, remoteCubeMaterial );
	remoteRacket.position.set(0,60,450);
	scene.add(remoteRacket);
    
    var ballGeometry = new THREE.CubeGeometry( 40, 40, 40 );
    var ballMaterial = new THREE.MeshPhongMaterial( { color: 0xFFFFFF } );
	ball = new THREE.Mesh( ballGeometry, ballMaterial );
    ball.position.set (0,20,0);
	scene.add(ball);
}
/*
function doGetUserMedia() {
    // Call into getUserMedia via the polyfill (adapter.js).
    try {
      getUserMedia({'audio':true, 'video':true}, onUserMediaSuccess,
                   onUserMediaError);
      console.log("Requested access to local media with new syntax.");
    } catch (e) {
      alert("getUserMedia() failed. Is this a WebRTC capable browser?");
      console.log("getUserMedia failed with exception: " + e.message);
    }

}


function onUserMediaSuccess(stream) {
    console.log("User has granted access to local media.");
    // Call the polyfill wrapper to attach the media stream to this element.
    attachMediaStream(localVideo, stream);
    localVideo.style.opacity = 1;
    localStream = stream;
}
    
function onUserMediaError(error) {
    console.log("Failed to get access to local media. Error code was " + error.code);
    alert("Failed to get access to local media. Error code was " + error.code + ".");
}
*/
  
function animate() 
{
    requestAnimationFrame( animate );
    if( localVideo.readyState === localVideo.HAVE_ENOUGH_DATA ){
        localVideoTexture.needsUpdate = true;
    }
	render();		
	update();
}

function update()
{
    var deltaClock = clock.getDelta();
    var deltaMove = deltaClock * 500;
    
    if(keyboard.pressed("c")) headXoffset = headX;
	/*if ( keyboard.pressed("left") ) 
	{ 
		localRacket.position.x += deltaMove;
	}
    if ( keyboard.pressed("right") ) 
    { 
		localRacket.position.x -= deltaMove;
	}*/
    localRacket.position.x = headX - headXoffset;

    // IF NO PEER CONNECTION:
    remoteRacket.position.x = localRacket.position.x;

    updateBallPosition(deltaClock);
    
	//controls.update();
	stats.update();
}

document.addEventListener("facetrackingEvent", function(e) {
    //drawIdent(canvasCtx, e.x, e.y);
}, false);

document.addEventListener("headtrackingEvent", function(e) {
    headX = - e.x * fieldW/8.0;
}, false);

function render() 
{
	renderer.render( scene, camera );
}

function updateBallPosition(deltaClock)
{
    // get ball position
	var pos	= ball.position;
    
    // update position
    pos.x += ballVelX;	
	pos.z += ballVelZ;
	
    // check collision with each player racket
    var localDist = ball.position.distanceToSquared(localRacket.position)/1000;
    var remoteDist = ball.position.distanceToSquared(remoteRacket.position)/1000;
    if ((localDist < 10 && ballVelZ < 0) || (remoteDist < 10 && ballVelZ > 0)){
		ballVelZ	*= -1;
        // TO DO: adjust angle with the exact impact position
        /*angle       = Math.random()*Math.PI*2;
        ballVelX    = Math.cos(angle)*10;
        ballVelZ    = Math.sin(angle)*10;*/
	}
    else
    {
    	// bounce the ball if it reach the border
    	if( pos.x < -fieldW/2 )	ballVelX	*= -1;
    	if( pos.x > +fieldW/2 )	ballVelX	*= -1;
    	if( pos.z < -fieldL/2 )	{ pos.set(0, pos.y, 0); ballVelX *= -1; }
    	if( pos.z > +fieldL/2 )	{ pos.set(0, pos.y, 0); ballVelX *= -1; }
    	// get the boundaries
    	pos.x	= Math.max(pos.x, -fieldW/2);
    	pos.x	= Math.min(pos.x, +fieldW/2);
    	pos.z	= Math.max(pos.z, -fieldL/2);
    	pos.z	= Math.min(pos.z, +fieldL/2);
    }
}