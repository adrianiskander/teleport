'use strict';
let server = require('./extensions/server');
let io = require('socket.io')(server);
let redClient = require('./extensions/redClient');


let authMiddleware = (socket, next) => {

  let token = socket.handshake.query.token;

  redClient.hget('teleport:tokens', token, (err, token) => {

    token = JSON.parse(token);

    if ( ! token ) {
      socket.disconnect();
    }
    else {
      redClient.hget('teleport:users', token.username, (err, user) => {

        user = JSON.parse(user);

        if (user && (user.token === token.token)) {
          /*
            User exists and user token match query token.
          */
          if ( ! user.socketID ) {
            socket.broadcast.emit('message', JSON.stringify({
              username: 'server',
              text: user.username + ' connected.'
            }));
          }
          user.socketID = socket.id;
          redClient.hset('teleport:clients', socket.id, JSON.stringify(user));
          redClient.hset('teleport:users', user.username, JSON.stringify(user));
          socket.emit('login', JSON.stringify(user));
          redClient.lrange('teleport:messages', 0, -1, (err, messages) => {
            socket.emit('messages', messages);
          });
          next();
        }
        else {
          if ( ! io.sockets.connected[user.socketID]) {
            /*
              Tokens doesn't match and other user is connected elsewhere.
            */
            redClient.hdel('teleport:tokens', user.token);
            socket.disconnect();
          };
        }
      });
    }
  });
};


io.use((socket, next) => {
  authMiddleware(socket, next);
});


io.on('connection', socket => {

  socket.on('disconnect', () => {
    redClient.hdel('teleport:clients', socket.id);
  });

  socket.on('logout', () => {
    /*
      Client asked for logout.
    */
    let token = socket.handshake.query.token;

    redClient.hget('teleport:tokens', token, (err, token) => {

      token = JSON.parse(token);

      socket.broadcast.emit('message', JSON.stringify({
        username: 'server',
        text: token.username + ' disconnected'
      }));
      socket.disconnect();

      redClient.hdel('teleport:tokens', token.token);
      redClient.hdel('teleport:users', token.username);
    });
  });

  socket.on('message', message => {
    redClient.rpush('teleport:messages', message, (err, result) => {
      socket.broadcast.emit('message', message);      
    });
  });
});


module.exports = io;
