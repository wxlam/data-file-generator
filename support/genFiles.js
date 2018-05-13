let _ = require('lodash');
let generator = require('../support/generator.js');
let configUtils = require('../support/configUtils.js');

let genFiles = {

  generateResponse: function generateResponse(inputProfiles) {

    let profiles = inputProfiles.split(',');
    let folderLocation = generator.readDataGenFolderLocation();
    let configLocation = folderLocation + '/config';
    let profileConfig = configUtils.getConfigFiles(configLocation);

    _.forEach(profiles, function(profile) {

      let matchedProfile = _.filter(profileConfig, function(configProfile) {
        return configProfile.profileName === profile;
      });

      if(matchedProfile && matchedProfile.length > 0) {
        console.log('>>> Generating files for: ' + matchedProfile[0].profileName);
        //clear folder before starting
        generator.removeFilesFromDir(folderLocation + '/' + matchedProfile[0].outputFolder, matchedProfile[0].outFilePrefix);
        generator.generateTemplateWithJSON(matchedProfile[0].path);
      } else {
        throw ('Could not find profile (' +  profile + ');')
      }
    });

    return true;
  }
};

module.exports = genFiles;