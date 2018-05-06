#! /usr/bin/env node

let dataGen = require('./support/genFiles.js');
let setup = require('./support/copySampleFiles.js')
let profileName;

if (process.argv.length <= 2) {
  throw new Error('missing profile name argument, expect: data-file-gen <profile-name>')
} else if (process.argv.length > 3) {
  throw new Error('too many arguments passed, expect: data-file-gen <profile-name>')
} else {
  profileName = process.argv[2]
}

if (profileName === 'setup') {
  let dataFolder = setup.checkIfConfigFile()
  console.log ('Setup sample files in folder: ' + dataFolder)
  setup.copyFiles(dataFolder)
  console.log('Done')
} else {
  dataGen.generateResponse(profileName);
  console.log('Done');
}
