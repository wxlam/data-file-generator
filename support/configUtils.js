var _ = require('lodash');
var generator = require('./generator.js');

var configUtils = {

  getConfigFiles: function getConfigFiles(dir) {
    var parsedConfig = [];
    var configFiles = generator.getFiles(dir, configFiles);

    _.forEach(configFiles, function (configFile) {
      try {
          var file = JSON.parse(generator.readFile(configFile));
          if (file.output) {
              var fileConfig = {};
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