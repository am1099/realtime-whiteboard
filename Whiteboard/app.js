const express = require('express');
const socket = require('socket.io');

// App setup
const PORT = 3000;
const app = express();
const server = app.listen(PORT, function () {
  console.log('LISTENING TO PORT: ' + PORT);
  console.log('http://localhost:' + PORT + '/user.html');
});

// Static files
app.use(express.static('public'));

// Socket setup
const io = socket(server);

app.get('/user.html', function (req, res) {
  res.redirect('/public/user.html');
});
// Lists to use
var history = [];
users = [];

// keep track of all active users
const activeUsers = new Set();

// A user connects to the server (opens a socket)
io.on('connection', function (socket) {
  console.log('Made socket connection');

  // INPUTTING THE USERS USERNAME TO BE DISPLAYED IN THE WHITEBOARD
  socket.on('setUsername', function (data) {
    users.push(data);
    socket.emit('userSet', { username: data });
  });

  /* draw all old updates to this user's canvas */
  for (var i in history) {
    socket.emit('update_canvas', history[i]);
  }
  /* Recieving updates from user */
  socket.on('update_canvas', function (data) {
    /* store updates */
    history.push(data);
    /* send updates to all sockets except sender */
    socket.broadcast.emit('update_canvas', data);
  });

  socket.on('new user', function (data) {
    socket.userId = data;
    activeUsers.add(data);
    io.emit('new user', [...activeUsers]);
  });

  // when user disconnects, delete the user from the activeUsers list
  socket.on('disconnect', function () {
    activeUsers.delete(socket.userId);
    io.emit('user disconnected', socket.userId);
  });

  // clears out the history list so the canvas is empty
  socket.on('clear_canvas', function () {
    history = [];
    io.emit('clear_canvas');
  });
});
