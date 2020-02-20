'use strict';
let redis = require('redis');
let config = require('../settings/config');


let redClient = redis.createClient(config.redisPort, config.redisHost);


module.exports = redClient;
