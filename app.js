// https://medium.com/geekculture/multiplayer-interaction-with-p5js-f04909e13b87
// we try to add https to our app ...
// https://dev.to/omergulen/step-by-step-node-express-ssl-certificate-run-https-server-from-scratch-in-5-steps-5b87
const express = require('express');
const app = express();
const fs = require('fs');

const options = {
  key: fs.readFileSync('rsa.txt'),
  cert: fs.readFileSync('cert.txt'),
};

const https = require('https').createServer(options, app);

const http = require('http').createServer(app);

// make another socket connection for http?
const io = require('socket.io')(https, {
  transports: ['websocket'], //set to use websocket only
}); //this loads socket.io and connects it to the server.

// const port = process.env.PORT || 8080;
// const port = process.env.PORT || 80;

//this next line makes sure we can put all our html/css/javascript in the public directory
app.use(express.static(__dirname + '/public'));
//we just have 1 route to the home page rendering an index html
app.get('/', (req, res) => {
  res.render('index.html');
});

//run the server which uses express
https.listen(8080, () => {
  console.log(`HTTPS Server is active at port:8080`);
});

http.listen(3000, () => {
  console.log(`HTTP Server is active at port:3000`);
});

//store the positions of each client in this object.
//It would be safer to connect it to a database as well so the data doesn't get destroyed when the server restarts
//but we'll just use an object for simplicity.
const positions = {};

let num = 0;
//Socket configuration
io.on('connection', (socket) => {
  //each time someone visits the site and connects to socket.io this function  gets called
  //it includes the socket object from which you can get the id, useful for identifying each client
  console.log(`${socket.id} connected`);
  // add a starting position when the client connects
  // for this, everyone starts at grid 1, 1
  positions[socket.id] = { x: 1, y: 1, z: 1 };
  // num++;
  // send everyones positions to every connected client?
  io.emit('positions', positions); // ehh?
  socket.on('disconnect', () => {
    //when this client disconnects, delete its position from the object.
    delete positions[socket.id];
    console.log(`${socket.id} disconnected`);
  });

  //client can send a message 'updatePosition' each time the clients position changes
  socket.on('updatePosition', (data) => {
    positions[socket.id].x = data.x;
    positions[socket.id].y = data.y;
    positions[socket.id].z = data.z;

    // positions[socket.id].n = data.n;
  });
});

//send positions every framerate to each client
// may not need this for our application -
// consider doing an 'emit' only when there's a change?
const frameRate = 30;
setInterval(() => {
  io.emit('positions', positions);
}, 1000 / frameRate);
