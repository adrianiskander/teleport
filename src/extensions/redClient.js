'use strict';
let redis = require('redis');
let config = require('../settings/config');


let redClient = redis.createClient({
  host: config.redisHost,
  port: config.redisPort,
  path: config.redisSocketPath,
  password: config.redisPass
});


module.exports = redClient;
