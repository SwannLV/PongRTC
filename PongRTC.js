// MAIN
if ( ! Detector.webgl ) Detector.addGetWebGLMessage();
// standard global variables
var container, scene, camera, renderer, stats;
var keyboard = new THREEx.KeyboardState();
var clock = new THREE.Clock();

// Communication-manager server
var serverUrl = 'wss://pongrtcserver.herokuapp.com'//'ws://swannlv.1.jit.su/';
//var serverUrl = 'ws://192.168.0.13:3000/';
var isCaller = true;
var localVideo, remoteVideo;
var localVideoTexture, remoteVideoTexture;
// Meshes
var localRacket, remoteRacket, ball, dome;
// constant for the field
var fieldW   = 859;
var fieldL   = 1059;
// constant for the ball
var angle    = 10;//Math.random()*Math.PI*2; // TO DO
var ballVelX = Math.cos(angle)*10;
var ballVelZ = Math.sin(angle)*10;
var sensibility = 1.0;
// constant for the head
var headX = 0;
var headXoffset = 0;

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
	var floorMaterial = new THREE.MeshBasicMaterial( { color: 0x555555, transparent: true, opacity: 1.0} );
	var floorGeometry = new THREE.PlaneGeometry(1000, 1000, 10, 10);
	var floor = new THREE.Mesh(floorGeometry, floorMaterial);
	floor.position.y = -0.5;
	floor.doubleSided = true;
	scene.add(floor);
	
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
        
	var racketGeometry = new THREE.CubeGeometry( 160, 120, 0 );
	var localCubeMaterial = new THREE.MeshBasicMaterial( { map: localVideoTexture, transparent: true, opacity: 0.7} );
	localRacket = new THREE.Mesh( racketGeometry, localCubeMaterial );
	localRacket.position.set(0,60,-450);
	scene.add(localRacket);
    
    var remoteCubeMaterial = new THREE.MeshBasicMaterial( { color: 0xFF4444, map: remoteVideoTexture } );
    remoteRacket = new THREE.Mesh( racketGeometry, remoteCubeMaterial );
	remoteRacket.position.set(0,60,450);
	scene.add(remoteRacket);
    
    var ballGeometry = new THREE.CubeGeometry( 40, 40, 40 );
    var ballMaterial = new THREE.MeshPhongMaterial( { color: 0xFFFFFF } );
	ball = new THREE.Mesh( ballGeometry, ballMaterial );
    ball.position.set (0,20,0);
	scene.add(ball);
    
    connectRTC();
}
  
function animate() 
{
    requestAnimationFrame( animate );
    localRacket.position.x = sensibility * (headX - headXoffset);
    if( localVideo && localVideo.readyState === localVideo.HAVE_ENOUGH_DATA ){
        localVideoTexture.needsUpdate = true;
        
        if(isCaller){
             rtc._socket.send(JSON.stringify({
                  "eventName": "msg",
                  "data": {
                  "room": room,
                  "ballX" : ball.position.x,
                  "ballZ" : ball.position.z,
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
        remoteRacket.position.x = ball.position.x;
    }
    if( remoteVideo && remoteVideo.readyState === remoteVideo.HAVE_ENOUGH_DATA ){
        remoteVideoTexture.needsUpdate = true;
    }
	render();		
	update();
}

function update()
{
    var deltaClock = clock.getDelta();
    var deltaMove = deltaClock * 500;
    
    if(keyboard.pressed("c")) headXoffset = headX;
	if ( keyboard.pressed("left") ) 
	{ 
		localRacket.position.x += deltaMove;
	}
    if ( keyboard.pressed("right") ) 
    { 
		localRacket.position.x -= deltaMove;
	}
    if ( keyboard.pressed("up") ) 
    { 
    	sensibility = 1.05 * sensibility;
	}
    if ( keyboard.pressed("down") && sensibility > 0.2) 
    { 
        sensibility = sensibility / 1.05;
	}

    if (isCaller) {
        updateBallPosition(deltaClock);
    }
    
    // Move the sky
    dome.rotation.y = (dome.rotation.y + deltaClock/100) % (2*Math.PI);
    
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
    // get ball position
	var pos	= ball.position;
    
    // update position
    pos.x += ballVelX;	
	pos.z += ballVelZ;
	
    // check collision with each player racket
    var localDist = ball.position.distanceToSquared(localRacket.position)/1000;
    var remoteDist = ball.position.distanceToSquared(remoteRacket.position)/1000;
    if ((localDist < 10 && ballVelZ < 0) || (remoteDist < 10 && ballVelZ > 0)){
        //if ((ball.position.z > localRacket.position.z) || (ball.position.z < remoteRacket.position.z)){
		    ballVelZ	*= -1;
        //}
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
         remoteRacket.position.x = data.rmRtX;
         if (isCaller === false){
             ball.position.x = data.ballX;
             ball.position.z = -data.ballZ;
         }
    });
    
    rtc.on('receive offer', function(data) {
        isCaller = false;
        console.log('> your are the callee')
    });

}