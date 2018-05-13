let _ = require('lodash');
let generator = require('./generator.js');

let configUtils = {

  getConfigFiles: function getConfigFiles(dir) {
    let parsedConfig = [];
    let configFiles = generator.getFiles(dir);

    _.forEach(configFiles, function (configFile) {
      try {
          let file = JSON.parse(generator.readFile(configFile, true));
          if (file.output) {
              let fileConfig = {};
              fileConfig.profileName = file.profileName;
              fileConfig.path = configFile;
              fileConfig.outputFolder = file.output.folder;
              fileConfig.outFilePrefix = file.output.fileNamePrefix;
              parsedConfig.push(fileConfig);
          }
      }
      catch (err) {
        console.log('File \"' + configFile + '\" failed and was ignored. ' + err.message);
      }
    });

    return parsedConfig;
  }
};

module.exports = configUtils;