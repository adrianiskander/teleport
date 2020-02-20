'use strict';
let path = require('path');


module.exports = {
  host: 'http://127.0.0.1',
  port: 3000,
  publicDir: path.join(__dirname, '../../public'),
  redisHost: '127.0.0.1',
  redisPass: '',
  redisPort: 6379,
  redisSocketPath: ''
};
