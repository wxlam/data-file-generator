#! /usr/bin/env node

let dataGen = require('./support/genFiles.js');
let profileName;

if (process.argv.length <= 2) {
  throw new Error('missing profile name argument, expect: node index.js <profile-name>')
} else if (process.argv.length > 3) {
  throw new Error('too many arguments passed, expect: node index.js <profile-name>')
} else {
  profileName = process.argv[2]
}

dataGen.generateResponse(profileName);
console.log('Done');

