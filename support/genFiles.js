var _ = require('lodash');
var generator = require('../support/generator.js');
var configUtils = require('../support/configUtils.js');

var genFiles = {

  generateResponse: function generateResponse(inputProfiles) {

    var profiles = inputProfiles.split(',');
    var profileConfig = configUtils.getConfigFiles('config');

    _.forEach(profiles, function(profile) {

      var matchedProfile = _.filter(profileConfig, function(configProfile) {
        return configProfile.profileName === profile;
      });

      if(matchedProfile && matchedProfile.length > 0) {
        console.log('>>> Generating files for: ' + matchedProfile[0].profileName);
        //clear folder before starting
        generator.removeFilesFromDir(matchedProfile[0].outputFolder, matchedProfile[0].outFilePrefix);
        generator.generateTemplateWithJSON(matchedProfile[0].path);
      } else {
        throw ('Could not find profile (' +  profile + ');')
      }
    });

    return true;
  }
};

module.exports = genFiles;