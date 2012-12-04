var app = require('express').createServer();
var port = process.env.PORT || 3000;
app.listen(port);console.log(' >>> Port: '+ port);

var webRTC = require('webrtc.io').listen(app);

app.get('/examples/style.css', function(req, res) {
    res.sendfile(__dirname + '/examples/style.css');
}); 
app.get('/examples/webrtc.io.js', function(req, res) {
	res.sendfile(__dirname + '/node_modules/webrtc.io/node_modules/webrtc.io-client/lib/webrtc.io.js');
});

webRTC.rtc.on('connect', function(rtc) {
	//Client connected
	console.log('client connected.');
	//if (start === false) startLoop();
});

webRTC.rtc.on('send answer', function(rtc) {
rtc.get
    console.log('client send answer');
 	//answer sent
});

webRTC.rtc.on('disconnect', function(rtc) {
	console.log('client disconnected');
	//Client disconnect 
});
/*
var racket1X, racket2X;
var ballX, ballZ;
var lastDate = new Date();*/
/*
webRTC.rtc.on('msg', function(data, socket){
	var roomList = webRTC.rtc.rooms[data.room] || [];
//console.log(data.room + ': client chat_msg @ ' + data.time + ' / ' + data.pos);
	var newDate = new Date();
	racket1X = data.headX;
	//console.log (newDate - lastDate);
	//console.log(socket.id);
	socket.send(JSON.stringify({
          "eventName": "receive_msg",
          "data": {
			"lcRtX": racket1X,
			"rmRtX": racket2X,
			"ballX": ballX,
			"ballZ": ballZ,
			"socket": socket.id
			
          }
        }), function(error) {
          if (error) {
            console.log(error);
          }
        });
	lastDate = newDate;
});
*//*
var racket =  function () { this.x = 0; this.id = undefined; }
var rackets = [];*/

webRTC.rtc.on('msg', function(data, socket){
	var roomList = webRTC.rtc.rooms[data.room] || [];
	var localRacketX = data.headX;
	var remoteRacketX = 0;

	for (var i = 0; i < roomList.length; i++) {
		var socketId = roomList[i];

		/*if (socketId === socket.id){
			roomList[i].racket = 'dddf';//new racket();
			console.log(roomList[i].racket);
		}*/
		if (socketId !== socket.id) {
		  var soc = webRTC.rtc.getSocket(socketId);

		  if (soc) {
			soc.send(JSON.stringify({
				"eventName": "receive_msg",
				"data": {
					//"lcRtX": racket1X,
					"rmRtX": data.headX/*,
					"ballX": ballX,
					"ballZ": ballZ,
					"socket": socket.id*/
				}
			}), function(error) {
				if (error) {
					console.log(error);
				}
			});
		  }
		}
	}
});

/*
function startLoop () {
	start = true;
	while (start) {
		var roomList = webRTC.rtc.rooms[data.room] || [];
		if (roomList.length === 0){
			start = false;
		}
		else {
			for (var i = 0; i < roomList.length; i++) {
				var socketId = roomList[i];

				if (socketId !== socket.id) {
				  var soc = webRTC.rtc.getSocket(socketId);

				  if (soc) {
					soc.send(JSON.stringify({
					  "eventName": "receive_chat_msg",
					  "data": {
						"messages": 1,
						"color": 2
					  }
					}), function(error) {
					  if (error) {
						console.log(error);
					  }
					});
				  }
				}
			}
		}
	}
}*/