'use strict';

const group = process.argv[2];

const lircdConfigGenerator = require('../lib/lircd-config-generator');

const res = lircdConfigGenerator({
  type: 'A',
  group
});

console.log(JSON.stringify(res, null, 2));