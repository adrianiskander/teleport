'use strict';
let express = require('express');
let config = require('./settings/config');


let app = express();


app.use(express.json());
app.use(express.static(config.publicDir));


module.exports = app;
