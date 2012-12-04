var fu = require("./js/fu");
var HOST = process.env.IP;
var PORT = process.env.PORT;

fu.listen(Number(process.env.PORT || PORT), HOST);

// FILES
fu.get("/", fu.staticHandler("Index.html"));
fu.get("/js/Three.js", fu.staticHandler("js/Three.js"));
fu.get("/js/jquery-1.8.3.min.js", fu.staticHandler("js/jquery-1.8.3.min.js"));
fu.get("/js/adapter.js", fu.staticHandler("js/adapter.js"));
fu.get("/js/Detector.js", fu.staticHandler("js/Detector.js"));
fu.get("/js/Stats.js", fu.staticHandler("js/Stats.js"));
fu.get("/js/THREEx.KeyboardState.js", fu.staticHandler("js/THREEx.KeyboardState.js"));
fu.get("/js/THREEx.FullScreen.js", fu.staticHandler("js/THREEx.FullScreen.js"));
fu.get("/js/THREEx.WindowResize.js", fu.staticHandler("js/THREEx.WindowResize.js"));
fu.get("/js/headtrackr.js", fu.staticHandler("js/headtrackr.js"));
fu.get("/js/ccv.js", fu.staticHandler("js/ccv.js"));
fu.get("/js/cascade.js", fu.staticHandler("js/cascade.js"));
fu.get("/js/whitebalance.js", fu.staticHandler("js/whitebalance.js"));
fu.get("/js/smoother.js", fu.staticHandler("js/smoother.js"));
fu.get("/js/camshift.js", fu.staticHandler("js/camshift.js"));
fu.get("/js/facetrackr.js", fu.staticHandler("js/facetrackr.js"));
fu.get("/js/headposition.js", fu.staticHandler("js/headposition.js"));
fu.get("/js/webrtc.io.js", fu.staticHandler(__dirname + '/node_modules/webrtc.io/node_modules/webrtc.io-client/lib/webrtc.io.js'));
fu.get("/Streams.js", fu.staticHandler("Streams.js"));
fu.get("/PongRTC.js", fu.staticHandler("PongRTC.js"));

// SKY DOME
fu.get("/images/sky/posz.jpg", fu.staticHandler("images/sky/posz.jpg"));
fu.get("/images/sky/negz.jpg", fu.staticHandler("images/sky/negz.jpg"));
fu.get("/images/sky/posy.jpg", fu.staticHandler("images/sky/posy.jpg"));
fu.get("/images/sky/negy.jpg", fu.staticHandler("images/sky/negy.jpg"));
fu.get("/images/sky/posx.jpg", fu.staticHandler("images/sky/posx.jpg"));
fu.get("/images/sky/negx.jpg", fu.staticHandler("images/sky/negx.jpg"));

// INFO BUTTON
fu.get("/images/i.png", fu.staticHandler("images/i.png"));
