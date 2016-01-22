'use strict';

const RCSwitch = require('../lib/rcswitch.js');

const systemCode = process.argv[2];
const unitCode   = parseInt(process.argv[3]);
const command    = parseInt(process.argv[4]);

console.log("sending systemCode[%s] unitCode[%s] command[%s]", systemCode, unitCode, command);
const mySwitch = new RCSwitch(console.log);

switch(command) {
case 1:
  mySwitch.aSwitchOn(systemCode, unitCode);
  break;
case 0:
  mySwitch.aSwitchOff(systemCode, unitCode);
  break;
default:
  console.log("command[%i] is unsupported", command);
}
