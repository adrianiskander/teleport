'use strict';
let http = require('http');
let app = require('../app');


let server = http.createServer(app);


module.exports = server;
