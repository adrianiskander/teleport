'use strict';
let server = require('./src/extensions/server');
let config = require('./src/settings/config');
let routes = require('./src/routes');


server.listen(config.port, () => {
  console.log(`Express is listening on ${ config.host }:${ config.port }`);
});
