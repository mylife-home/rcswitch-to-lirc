'use strict';

const RCSwitch = require('./rcswitch');

// A (with 10 pole DIP switches):
// - group: Code of the switch group (refers to DIP switches 1..5 where "1" = on and "0" = off, if all DIP switches are on it's "11111")
//
// B (with two rotary/sliding switches):
// - address: Number of the switch group (1..4)
//
// C (Intertechno):
// - family: Familycode (a..f)
// - group: Number of group (1..4)

function createExecutor(remoteConfig, cb) {
  const rcswitch = new RCSwitch(cb);

  rcswitch.setRepeatTransmit(1);
  if(remoteConfig.protocol) { rcswitch.setProtocol(remoteConfig.protocol); }
  if(remoteConfig.pulseLength) { rcswitch.setPulseLength(remoteConfig.pulseLength); }

  switch(remoteConfig.type) {
  case 'A':
    return function(device, status) {
      if(status) {
        rcswitch.aSwitchOn(remoteConfig.group, device);
      } else {
        rcswitch.aSwitchOff(remoteConfig.group, device);
      }
    };

  case 'B':
    return function(device, status) {
      if(status) {
        rcswitch.bSwitchOn(remoteConfig.address, device);
      } else {
        rcswitch.bSwitchOff(remoteConfig.address, device);
      }
    };

  case 'B':
    return function(device, status) {
      if(status) {
        rcswitch.cSwitchOn(remoteConfig.family, remoteConfig.group, device);
      } else {
        rcswitch.cSwitchOff(remoteConfig.family, remoteConfig.group, device);
      }
    };

  default:
    throw new Error('unsupported type');
  }
}

function createData(remoteConfig) {
  const data = {};
  const iterator = {
    device: null,
    status: null
  };

  const deviceToKey = [ null, 'a', 'b', 'c', 'd' ];

  function cb(type, length) {
    const key = deviceToKey[iterator.device] + '_' + (iterator.status ? 'on' : 'off');
    let item = data[key];
    if(!item) { data[key] = item = { data:[] }; }

    item.data.push({ type, length });
  }

  const executor = createExecutor(remoteConfig, cb);

  for(let i=1; i<=4; ++i) {
    iterator.device = i;
    iterator.status = true;
    executor(iterator.device, iterator.status);
    iterator.status = false;
    executor(iterator.device, iterator.status);
  }

  for(let key of Object.keys(data)) {
    const item = data[key];
    item.totalLength = 0;
    for(let datum of item.data) {
      item.totalLength += datum.length;
    }
  }

  return data;
}

module.exports = function generate(remoteConfig) {
  return createData(remoteConfig);
};