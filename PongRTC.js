// MAIN
if ( ! Detector.webgl ) Detector.addGetWebGLMessage();
// standard global variables
var container, scene, camera, renderer, stats;
var keyboard = new THREEx.KeyboardState();
var clock = new THREE.Clock();

// Communication-manager server
var serverUrl = 'ws://pongrtcserver.herokuapp.com'//'ws://pongrtc2018-swannlv.c9users.io'//'ws://swannlv.1.jit.su/';
//var serverUrl = 'ws://192.168.0.13:3000/';
var isCaller = true;
var localVideo, remoteVideo;
var localVideoTexture, remoteVideoTexture;
// Meshes
var localRacket, remoteRacket, ball, dome;
// constant for the field
var fieldW   = 859;
var fieldL   = 1059;
// constant for the arena
var arenaHalfWidth  = 500;
var arenaHalfLength = 500;
var arenaNetElementCount = 5;
// constant for the head
var headX = 0;
var headXoffset = 0;
// constant for the racket
var racketRadius = 80;
var racketCorner = 10;
// camera helpers
var cameraDistance = 1;
// collisions manager
var collisions = new CCollision;
// net placed on the middle of the arena
var BonusNet;

var iLastUpdate = Date.now();

// if there are no room, pick one at random
if( window.location.hash === '' ){    		
	window.location.hash = 'room'+Math.floor(Math.random()*10000).toString(16);
}
// update footer
var element	= document.querySelector('#footer .joinhere a');
element.href = element.innerText	= window.location;
var room = window.location.hash.slice(1);
document.body.setAttribute("tabIndex", "0");    // make body focusable
// handle newRoomForm
var newRoomForm	= document.getElementById('newRoomForm')
newRoomForm.addEventListener('keydown', function(event){ event.stopPropagation();	});
newRoomForm.addEventListener('submit', function(){
	// get room name
	var roomName = newRoomForm[0].value;
	// open a tab to this room
	var url	= location.protocol+'//'+location.host+location.pathname+'#'+roomName
	window.open(url, '_blank');
	// put back the focus on body
	document.body.focus();		
});
function toggleInfo() {
    if (document.getElementById('info').style.display == "block") {
    	document.getElementById('info').style.display = "none";
	} else {
		document.getElementById('info').style.display = "block";
	}
}

toggleInfo();
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
	camera.position.set(0,600,-1200);
	camera.lookAt(scene.position);	
	var vToCenter = new THREE.Vector3 (camera.position.x - scene.position.x, camera.position.y - scene.position.y, camera.position.z - scene.position.z);
	cameraDistance = vToCenter.length ();
	
	// RENDERER
	renderer = new THREE.WebGLRenderer( {antialias:true} );
	renderer.setSize(SCREEN_WIDTH, SCREEN_HEIGHT);
	container = document.createElement( 'div' );
	document.body.appendChild( container );
	container.appendChild( renderer.domElement );
	// EVENTS
	THREEx.WindowResize(renderer, camera);
	//THREEx.FullScreen.bindKey({ charCode : 'm'.charCodeAt(0) });
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
	
    // SKY DOME
    var urls = [];
    var skyTextures = [];
    var names = ["posz","negz","posy","negy","posx","negx"];

    var i;
	for (i = 0; i < 6; i++) {
		urls[i] = "images/sky/" + names[i] + ".jpg";
		skyTextures[i] = THREE.ImageUtils.loadTexture(urls[i]);
	}
	var skyMaterials = [];
	skyMaterials.push(new THREE.MeshBasicMaterial({ map: skyTextures[0] }));
	skyMaterials.push(new THREE.MeshBasicMaterial({ map: skyTextures[1] }));
	skyMaterials.push(new THREE.MeshBasicMaterial({ map: skyTextures[2] }));
	skyMaterials.push(new THREE.MeshBasicMaterial({ map: skyTextures[3] }));
	skyMaterials.push(new THREE.MeshBasicMaterial({ map: skyTextures[4] }));
	skyMaterials.push(new THREE.MeshBasicMaterial({ map: skyTextures[5] }));
    var larDome = 5000;
    dome = new THREE.Mesh( new THREE.CubeGeometry( larDome, larDome, larDome, 1, 1, 1, skyMaterials, true), new THREE.MeshFaceMaterial() );
    dome.doubleSided = true;
    dome.rotation.y = 0;
    dome.position.y = -1200;
    scene.add(dome);
	// FLOOR
	var floorMaterial = new THREE.MeshPhongMaterial( { color: 0x555555, transparent: true, opacity: 0.4} );
	var floorGeometry = new THREE.CubeGeometry (arenaHalfWidth*2, 20, arenaHalfLength*2);
	var floor = new THREE.Mesh(floorGeometry, floorMaterial);
	floor.position.y = -10.0;
	//floor.doubleSided = true;
	scene.add(floor);
	var WallGeometry = new THREE.CubeGeometry (20, 100, 1000);
	var Wall1 = new THREE.Mesh(WallGeometry, floorMaterial);
	var Wall2 = new THREE.Mesh(WallGeometry, floorMaterial);
	Wall1.position.x = arenaHalfWidth + 10.0;
	Wall2.position.x = -arenaHalfWidth - 10.0;
	Wall1.position.y = 50;
	Wall2.position.y = 50;
	//Wall1.doubleSided = true;
	//Wall2.doubleSided = true;
	scene.add(Wall1);
	scene.add(Wall2);
	var WallObject1 = new CCollisionObject (Wall1, "Wall 1");
	var WallObject2 = new CCollisionObject (Wall2, "Wall 2");
	WallObject1.addColidableFaceFromNormal (new THREE.Vector3 (-1,0,0));
	WallObject2.addColidableFaceFromNormal (new THREE.Vector3 (1,0,0))
	WallObject1.applyTransformation ();
	WallObject2.applyTransformation ();
	collisions.add (WallObject1);
	collisions.add (WallObject2);
	
	/////////////
	// Rackets //
	/////////////
    // Face detection setup
    var canvasInput = document.createElement('canvas'); // compare
    canvasInput.setAttribute('width','320');
    canvasInput.setAttribute('height','240');
    
    localVideo = document.createElement('video');
    localVideo.id = 'video';
    localVideo.width     = 320;
    localVideo.height    = 240;
    localVideo.autoplay  = true;
    document.body.appendChild(localVideo);
    remoteVideo = document.createElement('video');
    remoteVideo.id = 'remoteVideo';
    remoteVideo.width     = 320;
    remoteVideo.height    = 240;
    remoteVideo.autoplay  = true;
    document.body.appendChild(remoteVideo);
    
    // Start RTC
	rtc.createStream({"video": true, "audio": true}, function(stream){
		localVideo.src	= URL.createObjectURL(stream);
	}, function(){
		console.log('createStream failed', arguments);
	});
    
    // Start Head Tracker
    var htracker = new headtrackr.Tracker({smoothing : true, fadeVideo : true, ui : false});
    htracker.init(localVideo, canvasInput);
    htracker.start();

	localVideoTexture	= new THREE.Texture(localVideo);
	localVideoTexture.repeat.set(-1, 1);
	localVideoTexture.offset.set( 1, 0);
    
    remoteVideoTexture	= new THREE.Texture(remoteVideo);
	remoteVideoTexture.repeat.set(-1, 1);
	remoteVideoTexture.offset.set( 1, 0);
        
    
	var racketGeometry = new THREE.CubeGeometry( racketRadius * 2, 120, racketCorner*2 );
	var localCubeMaterial = new THREE.MeshBasicMaterial( { map: localVideoTexture, transparent: true, opacity: 0.7} );
	var localRacketMesh = new THREE.Mesh( racketGeometry, localCubeMaterial );
	localRacket = new CCollisionObject( localRacketMesh, "Local Racket" );
	localRacket.move (0,60,-450);
	localRacket.makeAllFacesColidable ();
	localRacket.applyRotations ();
	scene.add(localRacket.m_Mesh);
	collisions.add(localRacket);
    
    var remoteCubeMaterial = new THREE.MeshBasicMaterial( { color: 0xFF4444, map: remoteVideoTexture } );
    var remoteRacketMesh = new THREE.Mesh( racketGeometry, remoteCubeMaterial );
	remoteRacket = new CCollisionObject( remoteRacketMesh, "Remote Racket" );
	remoteRacket.move (0,60,450);
	remoteRacket.makeAllFacesColidable ();
	remoteRacket.applyRotations ();
	scene.add(remoteRacket.m_Mesh);
	collisions.add(remoteRacket);
    
	ball = new CBall (20);
	ball.init ();
    ball.m_Mesh.position.set (0, ball.m_fRadius, 0);
	scene.add(ball.m_Mesh);
	
	BonusNet = new CBonusNet (scene, arenaNetElementCount, arenaHalfWidth);
	
	// Alphabet
	/*
	//var AlphaTexture = THREE.ImageUtils.loadTexture("images/alphabetWhite.png");
	//var SpriteAlpha = new THREE.Sprite ({map: AlphaTexture, alignment: THREE.SpriteAlignment.topLeft, opacity: 0.25 });
	var SpriteAlpha = new THREE.Sprite ({alignment: THREE.SpriteAlignment.topLeft, opacity: 1 });
	SpriteAlpha.position.set( 0, 100, 0 );
	//SpriteAlpha.scale.set( AlphaTexture.image.width, AlphaTexture.image.height, 1 );
	scene.add(SpriteAlpha);
	*/
	
	iLastUpdate = Date.now();
    
    connectRTC();
}
  
function animate() 
{
    var deltaClock = clock.getDelta();
    var deltaMove = deltaClock * 2000;
    requestAnimationFrame( animate );
    if( localVideo && localVideo.readyState === localVideo.HAVE_ENOUGH_DATA ){
        localVideoTexture.needsUpdate = true;
        
        if(isCaller){
             rtc._socket.send(JSON.stringify({
                  "eventName": "msg",
                  "data": {
                  "room": room,
                  "ballX" : ball.m_Mesh.position.x,
                  "ballZ" : ball.m_Mesh.position.z,
                  "headX": headX - headXoffset
                  }
            }));
        }
        else {
            rtc._socket.send(JSON.stringify({
                  "eventName": "msg",
                  "data": {
                  "room": room,
                  "headX": headX - headXoffset
                  }
            }));
        }
    }
    if (!remoteVideo.readyState) {
        // IF NO PEER CONNECTION:
        //localRacket.position.x = headX - headXoffset;
        if (ball.m_Mesh.position.x > remoteRacket.m_Mesh.position.x) {
        	remoteRacket.addVelocity (50, 0, 0);
        } else if (ball.m_Mesh.position.x < remoteRacket.m_Mesh.position.x) {
        	remoteRacket.addVelocity (-50, 0, 0);
        }
    }
    if( remoteVideo && remoteVideo.readyState === remoteVideo.HAVE_ENOUGH_DATA ){
        remoteVideoTexture.needsUpdate = true;
    }

	remoteRacket.update (deltaClock);
	if (remoteRacket.m_Mesh.position.x - racketRadius < -arenaHalfWidth) {
		remoteRacket.move (racketRadius - arenaHalfWidth, remoteRacket.m_Mesh.position.y, remoteRacket.m_Mesh.position.z);
	}
	if (remoteRacket.m_Mesh.position.x + racketRadius > arenaHalfWidth) {
		remoteRacket.move (arenaHalfWidth - racketRadius, remoteRacket.m_Mesh.position.y, remoteRacket.m_Mesh.position.z);
	}

	render();		
	update(deltaClock, deltaMove);
	
	if (localRacket.m_Mesh.position.x - racketRadius < -arenaHalfWidth) {
		localRacket.move (racketRadius - arenaHalfWidth, localRacket.m_Mesh.position.y, localRacket.m_Mesh.position.z);
	}
	if (localRacket.m_Mesh.position.x + racketRadius > arenaHalfWidth) {
		localRacket.move (arenaHalfWidth - racketRadius, localRacket.m_Mesh.position.y, localRacket.m_Mesh.position.z);
	}
	
}

function update(deltaClock, deltaMove)
{
    var bApplyLocal = false;
    
    if(keyboard.pressed("c")) {
		camera.position.set(0,600,-1200);
		camera.lookAt(scene.position);	
	    headXoffset = headX;
    }
     
	//if ( keyboard.pressed("left") ) {
	if ( keyboard.pressed("left") || keyboard.pressed("k") ) { 
		localRacket.addVelocity (500, 0, 0);
	}
    //if ( keyboard.pressed("right") ) {
    if ( keyboard.pressed("right") || keyboard.pressed("m") ) { 
		localRacket.addVelocity (-500, 0, 0);
	}
	//if ( keyboard.pressed("up") ) {
	if ( keyboard.pressed("o") ) {
		localRacket.addRotation (0, 0.05, 0);
		bApplyLocal = true
	}
	//if ( keyboard.pressed("down") ) {
	if ( keyboard.pressed("l") ) {
		localRacket.addRotation (0, -0.05, 0);
		bApplyLocal = true
	}

    // Head movements
    if (headX != 0) {
        localRacket.move (headX - headXoffset, localRacket.m_Mesh.position.y, localRacket.m_Mesh.position.z);
    }
    
	if ( keyboard.pressed("z") ) {
		var vCamLook  = new THREE.Vector3 (camera.position.x, camera.position.y, camera.position.z);
		var vCamUp    = new THREE.Vector3 (camera.up.x, camera.up.y, camera.up.z);
		var vCamLeft  = new THREE.Vector3 (camera.position.x, camera.position.y, camera.position.z);
		var fRotAngle = 0.01;
		vCamLook.subSelf (scene.position);
		vCamLeft.cross (vCamLook, vCamUp);
		vCamUp.cross (vCamLeft, vCamLook);
		vCamUp.normalize ();
		vCamUp.multiplyScalar (cameraDistance);
		camera.position.add (vCamLook.multiplyScalar (Math.cos (fRotAngle)), vCamUp.multiplyScalar (Math.sin (fRotAngle)));
		camera.position.addSelf (scene.position);
		camera.lookAt(scene.position);	
	}
	if ( keyboard.pressed("s") ) {
		var vCamLook  = new THREE.Vector3 (camera.position.x, camera.position.y, camera.position.z);
		var vCamUp    = new THREE.Vector3 (camera.up.x, camera.up.y, camera.up.z);
		var vCamLeft  = new THREE.Vector3 (camera.position.x, camera.position.y, camera.position.z);
		var fRotAngle = -0.01;
		vCamLook.subSelf (scene.position);
		vCamLeft.cross (vCamLook, vCamUp);
		vCamUp.cross (vCamLeft, vCamLook);
		vCamUp.normalize ();
		vCamUp.multiplyScalar (cameraDistance);
		camera.position.add (vCamLook.multiplyScalar (Math.cos (fRotAngle)), vCamUp.multiplyScalar (Math.sin (fRotAngle)));
		camera.position.addSelf (scene.position);
		camera.lookAt(scene.position);	
	}
	if ( keyboard.pressed("q") ) {
		var vCamLook  = new THREE.Vector3 (camera.position.x, camera.position.y, camera.position.z);
		var vCamLeft  = new THREE.Vector3 (camera.position.x, camera.position.y, camera.position.z);
		var fRotAngle = 0.01;
		var camY;
		vCamLook.subSelf (scene.position);
		camY = vCamLook.y;
		vCamLook.y = 0;
		vCamLeft.cross (vCamLook, camera.up);
		camera.position.add (vCamLook.multiplyScalar (Math.cos (fRotAngle)), vCamLeft.multiplyScalar (Math.sin (fRotAngle)));
		camera.position.addSelf (scene.position);
		camera.position.y = camY;
		camera.lookAt(scene.position);	
	}
	if ( keyboard.pressed("d") ) {
		var vCamLook  = new THREE.Vector3 (camera.position.x, camera.position.y, camera.position.z);
		var vCamLeft  = new THREE.Vector3 (camera.position.x, camera.position.y, camera.position.z);
		var fRotAngle = -0.01;
		var camY;
		vCamLook.subSelf (scene.position);
		camY = vCamLook.y;
		vCamLook.y = 0;
		vCamLeft.cross (vCamLook, camera.up);
		camera.position.add (vCamLook.multiplyScalar (Math.cos (fRotAngle)), vCamLeft.multiplyScalar (Math.sin (fRotAngle)));
		camera.position.addSelf (scene.position);
		camera.position.y = camY;
		camera.lookAt(scene.position);	
	}

	var iNow = Date.now();
	var iDeltaTime = iNow - iLastUpdate;
	iLastUpdate = iNow;
	
    if (isCaller) {
        updateBallPosition(iDeltaTime);
        //updateBallPosition(5);
    }
    
    // Move the sky
    dome.rotation.y = (dome.rotation.y + deltaClock/100) % (2*Math.PI);
    
    if (bApplyLocal) localRacket.applyRotations ();
    localRacket.update (deltaClock);
    
    BonusNet.update (ball, iDeltaTime);
    
	stats.update();
}

document.addEventListener("headtrackrStatus", function(e) {
    setTrackerStatus(e.status);
});

document.addEventListener("videoPlaying", function(e) {
    console.log('videolaying');
});

document.addEventListener("facetrackingEvent", function(e) {
    //drawIdent(canvasCtx, e.x, e.y);
}, false);

document.addEventListener("headtrackingEvent", function(e) {
    headX = - e.x * fieldW/16.0;
}, false);

function render() 
{
	renderer.render( scene, camera );
}

function updateBallPosition(deltaClock)
{
	ball.move (deltaClock, collisions);
	var pos	= ball.m_Mesh.position;
	if (pos.z < -arenaHalfLength || (pos.z < 0 && Math.abs (pos.x) > arenaHalfWidth)) {
		ball.init ();
		pos.set(remoteRacket.m_Mesh.position.x, pos.y, remoteRacket.m_Mesh.position.z - ball.m_fRadius);
	}
	if (pos.z > arenaHalfLength || (pos.z > 0 && Math.abs (pos.x) > arenaHalfWidth)) {
		ball.init ();
		pos.set(localRacket.m_Mesh.position.x, pos.y, localRacket.m_Mesh.position.z + ball.m_fRadius);
	}
}

function setTrackerStatus(state) {
    console.log(state);
    //$('#message').html(state);
  }
  
function connectRTC () {

    console.log('connectRTC');
    
    rtc.connect(serverUrl, room);
    
    rtc.on('add remote stream', function(stream, socketId) {
        console.log("Adding remote stream...", socketId);
        remoteVideo.src = URL.createObjectURL(stream);
    	rtc.attachStream(stream, "remoteVideo");
        //.style.webkitTransform = "rotateY(0deg)";
    });
    
    rtc.on('disconnect stream', function(socketId) {
    	console.log("Remove remote stream...", socketId);
    	var video	= document.getElementById('remoteVideo');
    	if( video )	video.parentNode.removeChild(video);
    });
    
    rtc.on('receive_msg', function(data, socket){
         //localRacket.position.x = data.lcRtX;
         //remoteRacket.position.x = data.rmRtX;
         remoteRacket.move (data.rmRtX, remoteRacket.m_Mesh.position.y, remoteRacket.m_Mesh.position.z);
         if (isCaller === false){
             ball.m_Mesh.position.x = data.ballX;
             ball.m_Mesh.position.z = -data.ballZ;
         }
    });
    
    rtc.on('receive offer', function(data) {
        isCaller = false;
        console.log('> your are the callee')
    });

}