const socket = io();
let prev = {};
var canvas = document.getElementById('canvas');
var context = canvas.getContext('2d');
let pointerContainer = document.getElementById('pointers');

context.lineCap = 'round';
context.lineJoin = 'round';

let pointer = document.createElement('div');
pointer.setAttribute('class', 'pointer');

let drawing = false;
let clients = {};
let pointers = {};
var users = [];

var usernamesList = document.getElementById('usersList');
var username = window.location.hash.substring(1);
console.log(username);

const addnewUser = (username) => {
  if (!users.includes(username)) {
    users.push(username);
  }
  console.log('here: ' + users);

  $('#usersList').empty();
  for (var i = 0; i < users.length; i++) {
    var li = document.createElement('li');
    li.id = `${users[i]}-userlist`;
    li.innerHTML += `<label>` + users[i] + `</label>`;
    usernamesList.appendChild(li);
  }
};

const newUserConnected = (user) => {
  activeUserName = user || username;

  socket.emit('new user', activeUserName);
};

// new user is created so we generate nickname and emit event
newUserConnected();

socket.on('new user', function (data) {
  data.map((user) => addnewUser(user));
});

// Delete user from users list and remove him from the users
// table that is displayed to every user
socket.on('user disconnected', function (data) {
  console.log(' user DISCONNECTED : ' + data);

  var userDeleted = document.getElementById(`${data}-userlist`);
  userDeleted.remove();
  // console.log(' All users  : ' + users);

  var userIndex = users.indexOf(data);
  //remove user from the users array
  users.splice(userIndex, 1);
});

// -------------------------------------------------------------------------------------
// testing save canvas
/* Receiving Updates from server */
socket.on('update_canvas', function (data) {
  let { fromx, fromy, tox, toy } = JSON.parse(data);
  console.log(data);
  drawLine(fromx, fromy, tox, toy, true);
});

function drawLine(fromx, fromy, tox, toy, from_server = false) {
  if (!from_server) {
    socket.emit('update_canvas', JSON.stringify({ fromx, fromy, tox, toy }));
  }

  context.beginPath();
  context.moveTo(fromx, fromy);
  context.lineTo(tox, toy);
  context.strokeStyle = document.getElementById('color-picker').value;
  context.lineWidth = document.getElementById('brush-size').value;
  context.stroke();
}

function now() {
  return new Date().getTime();
}

canvas.onmouseup = canvas.onmousemove = canvas.onmousedown = function (e) {
  switch (e.type) {
    case 'mouseup':
      drawing = false;
      break;

    case 'mousemove':
      socket.emit('mousemove', {
        x: e.offsetX,
        y: e.offsetY,
        drawing: drawing,
      });

      if (drawing) {
        drawLine(prev.x, prev.y, e.offsetX, e.offsetY);
        prev.x = e.offsetX;
        prev.y = e.offsetY;
      }
      break;

    case 'mousedown':
      prev.x = e.offsetX;
      prev.y = e.offsetY;
      drawing = true;
      break;

    default:
      break;
  }
};

socket.on('clientdisconnect', function (id) {
  delete clients[id];
  if (pointers[id]) {
    pointers[id].parentNode.removeChild(pointers[id]);
  }
});

/* CLEAR THE CANVAS */
document.getElementById('clear_button').addEventListener('click', function () {
  socket.emit('clear_canvas');
});

socket.on('clear_canvas', function () {
  context.clearRect(0, 0, canvas.width, canvas.height);
});
