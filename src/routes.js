'use strict';
let path = require('path');
let uuid = require('uuid/v4');

let app = require('./app');
let config = require('./settings/config');
let io = require('./socketHandler');
let redClient = require('./extensions/redClient');


app.post('/login', (req, res, next) => {

  let username = req.body.username;

  /*
    Check if username is already used.
  */
  redClient.hget('teleport:users', username, (err, user) => {

    user = JSON.parse(user);
    /*
      User exists and is already connected.
    */
    if (user && io.sockets.connected[user.socketID]) {
      res.status(400).end();
    }
    /*
      User doesn't exists, crate user and login.
    */
    else {
      let token = uuid().toString();

      redClient.hset('teleport:users', username, JSON.stringify({ username, token }));
      redClient.hset('teleport:tokens', token, JSON.stringify({ username, token }));

      res.status(200).send(JSON.stringify({ username, token }));      
    }
  });
});


app.get('/usersCount', (req, res) => {
  /*
    Get number of users connected to socketio.
  */
  res.status(200).send(JSON.stringify({ usersCount: io.eio.clientsCount }));
});


app.get('*', (req, res) => {
  res.sendFile(path.join(config.publicDir, 'index.html'));
});
