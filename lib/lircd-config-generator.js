'use strict';

const RCSwitch = require('./rcswitch');

// remoteConfig:
//
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

  case 'C':
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

function createName(remoteConfig) {
  switch(remoteConfig.type) {
  case 'A':
    return 'rcswitch_A_' + remoteConfig.group;

  case 'B':
    return 'rcswitch_B_' + remoteConfig.address;

  case 'C':
    return 'rcswitch_C_' + remoteConfig.family + '_' + remoteConfig.group;

  default:
    throw new Error('unsupported type');
  }
}

function createKeys(remoteConfig) {
  const keys = {};
  const iterator = {
    device: null,
    status: null
  };

  const deviceToKey = [ null, 'a', 'b', 'c', 'd' ];

  function cb(type, length) {
    const key = deviceToKey[iterator.device] + '_' + (iterator.status ? 'on' : 'off');
    let item = keys[key];
    if(!item) { keys[key] = item = []; }

    item.push({ type, length });
  }

  const executor = createExecutor(remoteConfig, cb);

  for(let i=1; i<=4; ++i) {
    iterator.device = i;
    iterator.status = true;
    executor(iterator.device, iterator.status);
    iterator.status = false;
    executor(iterator.device, iterator.status);
  }

  return keys;
}

function computeGap(keys) {

  let gap = 0;

  for(let key of Object.keys(keys)) {
    const item = keys[key];
    let totalLength = 0;
    for(let datum of item) {
      totalLength += datum.length;
    }
    if(totalLength > gap) {
      gap = totalLength;
    }
  }

  return gap;

}

module.exports = function generate(remoteConfig) {
  const keys = createKeys(remoteConfig);
  const data = {
    name: createName(remoteConfig),
    keys: keys,
    gap: computeGap(keys)
  }

  let text = renderHeader(data);
  for(let key of Object.keys(data.keys)) {
    text += renderKey(data, key);
  }
  text += renderFooter();
  return text;
};

function renderHeader(data) {
  return `
begin remote

  name  ${data.name}
  flags RAW_CODES|CONST_LENGTH
  eps            30
  aeps          100

  gap          ${data.gap}

      begin raw_codes
`;
}

function renderFooter() {
  return `
      end raw_codes

end remote
`;
}

function renderKey(data, key) {
  let val = '\n          name ' + key;
  const codes = data.keys[key];
  for(let i=0; i<codes.length - 1; ++i) { // -1 to skip last space
    if(i % 6 === 0) {
      val += '\n         ';
    }
    val += ('        ' + codes[i].length).slice(-8);
  }
  val += '\n';
  return val;
}

/*
 * sample
 *

begin remote

  name  remote_10000
  flags RAW_CODES|CONST_LENGTH
  eps            30
  aeps          100

  gap          50000

      begin raw_codes

          name a_on
              296     978     298     984     294     979
              929     353     289     992     921     358
              283     994     924     350     293     989
              921     358     286     988     293     988
              286     981     937     352     289     981
              935     348     289     996     920     356
              282     994     922     361     280     995
              279     999     275    1007     915     356
              283

          name a_off
              311     960     314     960     315     962
              954     329     309     968     944     336
              304     971     947     336     301     978
              939     339     300     977     298     979
              301     978     937     340     301     984
              931     339     299     981     935     345
              295     982     935     350     290     985
              929     351     288     991     287     986
              291

          name b_on
              309     956     318     956     321     961
              953     323     317     962     951     332
              306     970     951     330     303     971
              948     332     304     976     942     339
              300     974     303     976     303     970
              950     331     304     975     940     341
              299     976     939     343     295     983
              293     985     293     989     927     346
              293

          name b_off
              319     954     324     952     322     957
              958     319     316     964     956     323
              315     961     954     328     311     964
              950     332     306     972     943     347
              292     973     306     972     305     972
              944     339     299     975     944     339
              300     975     942     345     294     977
              939     338     301     980     297     981
              297

          name d_on
              323     950     323     955     322     956
              964     316     321     956     961     323
              314     961     957     325     315     962
              960     321     309     969     949     332
              308     972     941     340     302     976
              942     338     302     979     298     975
              303     973     944     337     303     975
              303     977     301     975     941     340
              301

          name d_off
              320     947     331     943     334     945
              972     308     330     949     963     316
              321     954     963     321     318     961
              953     324     314     968     950     327
              311     967     950     330     307     970
              947     335     302     974     307     970
              306     972     945     333     307     972
              944     336     305     975     301     973
              305

          name c_on
               69     107      53

          name c_off
                0      37      10       6       6       6
                6       6       5       6       6       6
                6       5       6       6       6       6
                5       6       6       6       5       6
               21      37      32     737      61

      end raw_codes

end remote
*/
