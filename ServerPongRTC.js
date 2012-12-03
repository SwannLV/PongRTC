var app = require('express').createServer();
var port = process.env.PORT || 3000;
app.listen(port);console.log(' >>> Port: '+ port);

var webRTC = require('webrtc.io').listen(app);

/*app.get('/examples/webrtc.io.js', function(req, res) {
	res.sendfile(__dirname + '/node_modules/webrtc.io/node_modules/webrtc.io-client/lib/webrtc.io.js');
});*/

 
webRTC.rtc.on('connect', function(rtc) {
	//Client connected
	console.log('client connected.');
});

webRTC.rtc.on('send answer', function(rtc) {
    console.log('client send answer');
 	//answer sent
});

webRTC.rtc.on('disconnect', function(rtc) {
	console.log('client disconnected');
	//Client disconnect 
});

webRTC.rtc.on('chat_msg', function(data, socket){
    console.log('client chat_msg');
  var roomList = webRTC.rtc.rooms[data.room] || [];

  for (var i = 0; i < roomList.length; i++) {
    var socketId = roomList[i];

    if (socketId !== socket.id) {
      var soc = webRTC.rtc.getSocket(socketId);

      if (soc) {
        soc.send(JSON.stringify({
          "eventName": "receive_chat_msg",
          "data": {
            "messages": data.messages,
            "color": data.color
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
