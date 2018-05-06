var xlsx = require('xlsx');
var fs = require('fs');
var fsExtra = require('fs-extra');
var escape = require("html-escape");
var _ = require('lodash');
var sumTotal;

var generatorUtils = {

  getParameters: function getParameters (template) {

    /* Match from template file */
    var regexPattern = new RegExp('\{' + '(.*?)' + '\}', 'g');
    var templateParameters = template.match(regexPattern);
    var parameters = [];
    var param;

    //check to make sure templateParameters is an object before attempting to use parameters
    if (_.isObject(templateParameters)) {
      //create array of matches for the parameters name values
      Object.keys(templateParameters).forEach(function (p) {
        param = templateParameters[p].toString().replace('\{', "").replace('\}', "");
        parameters.push(param);
      });
    }
    //can return empty array if no matches found in parameters
    return parameters;
  },

  readContentsOfWorksheet: function readContentsOfWorksheet (worksheet) {

    /* Match the fetched value in the spreadsheet */
    var headers = {};
    var data = [];

    //loop through each cell in the worksheet
    Object.keys(worksheet).forEach(function (z) {

      //if it's a cell then continue
      if (z[0] === '!') return;
      //parse out the column, row, and value

      //to get the full correct column and row number of the cell, use utils.decode_cell to
      //  split into {c:ColNum, r:RowNum}
      //  then using that value, use utils.encode_col to convert ColNum into a letter, eg. AA instead of '27'
      var cell = xlsx.utils.decode_cell(z);
      var colValue = xlsx.utils.encode_col(cell.c);
      var rowValue = cell.r;
      var value = worksheet[z].w;

      //store header names
      if (rowValue === 0) {
        headers[colValue] = value.trim();
        return;
      }

      //create object for each data row
      if (!data[rowValue]) {
        data[rowValue] = {}
      }
      data[rowValue][headers[colValue]] = value.trim();

    });

    //remove first row of headers from data to start from index 0
    data.shift();

    return data;
  },

  readFile: function readFile (file) {
    return fs.readFileSync(file, {encoding: 'utf-8'}, function (err) {
      if (err) {
        return console.warn(err);
      }
    });
  },

  writeFile: function writeFile (pathToOutputFile, fileName, fileContents) {
    var outfileName;

    outfileName = pathToOutputFile + fileName;
    //confirm directories are created, if not then have them created before attempting to create file
    fsExtra.ensureDirSync(pathToOutputFile);
    fs.writeFileSync(outfileName, fileContents, 'utf-8', function (err) {
      if (err) {
        return console.warn(err);
      }
    });
  },

  getFiles: function getFiles (dir, filesArr) {
    filesArr = filesArr || [];
    var files = fs.readdirSync(dir);
    for (var i in files) {
      var name = dir + '/' + files[i];
      if (fs.statSync(name).isDirectory()) {
        getFiles(name, filesArr);
      } else {
        filesArr.push(name);
      }
    }
    return filesArr;
  },

  removeFilesFromDir: function removeFilesFromDir (pathTo, filePrefix) {

    //check if folder exists, if it does not then create folder
    if (!fs.existsSync(pathTo)) {
      fsExtra.mkdirsSync(pathTo);
    } else {
      var listOfFiles = generatorUtils.getFiles(pathTo);

      listOfFiles.forEach(function (filename) {
        if (filePrefix) {
          if (filename.indexOf(filePrefix) >= 0) {
            console.log('remove file:' + filename);
            fsExtra.removeSync(filename)
          }
        } else {
          fsExtra.removeSync(filename);
        }

      });
    }

  },

  removeSpacesFromString: function removeSpacesFromString (stringValue) {
    return stringValue.replace(/\s/g, '');
  },

  encodeSpacesFromStringWith: function encodeSpacesFromString (stringValue, replaceWith) {
    // default to %20% if nothing is sent
    if (!replaceWith) {
      replaceWith = '%20';
    }
    return stringValue.replace(/\s/g, replaceWith);
  },

  getRepeatingGroupValues: function getRepeatingGroupValues (repeatingGroupMap, dataRow, count, templatePath, isSplitValue) {
    var identifier, splitPos, prefixValue, suffixValue, paramName, paramValue, templateParamName;
    var template = generatorUtils.readFile(templatePath);

    _.forEach(repeatingGroupMap, function (value, key) {
      templateParamName = '{' + key + '}';

      //if %AUTO_INCREMENT% is used then assume want to use counter value
      if (value === '%AUTO_INCREMENT%') {
        value = count;
        template = template.replace(templateParamName, value);
      } else if (isSplitValue) {
        // for splitValues there is no dataRow object, what's expected is a single value
        //  from the array as a result of the split function
        //if value is empty then make sure a blank value is returned and not 'undefined'
        paramValue = dataRow === undefined ? '' : dataRow;
        template = template.replace(templateParamName, paramValue);
      } else {
        identifier = value.split('_');
        splitPos = value.search(identifier[1]);
        prefixValue = value.slice(0, splitPos - 1);
        suffixValue = value.slice(splitPos);
        paramName = prefixValue + count + '_' + suffixValue;
        //if value is empty then make sure a blank value is returned and not 'undefined'
        paramValue = dataRow[paramName] === undefined ? '' : dataRow[paramName];
        template = template.replace(templateParamName, paramValue);
      }

    });

    return template;
  },

  addRepeatingGrp: function addRepeatingGrp (dataRow, resultsFile, repeatingGrpTemplate, fileExtension) {
    var repeatingGrp = '';

    var repeatingGrpMap = repeatingGrpTemplate.map;
    var repeatingGrpParam = repeatingGrpTemplate.parameter;
    var repeatingGrpPrefix = repeatingGrpTemplate.uniqueIdentifier.prefix;
    var repeatingGrpSuffix = repeatingGrpTemplate.uniqueIdentifier.suffix;
    var repeatingGrpTemplatePath = repeatingGrpTemplate.templateFile;
    var applyCondition = true;

    //check if column contains value in spreadsheet
    var repeatingGrpHeadings = generatorUtils.checkKeyNameExists(dataRow, repeatingGrpPrefix, repeatingGrpSuffix, false);
    if (repeatingGrpHeadings && repeatingGrpHeadings.length > 0) {
      for (var i = 0; i < repeatingGrpHeadings.length; i++) {
        // check to see if condition applied to repeating group
        if (repeatingGrpTemplate.hasOwnProperty('condition')) {
          applyCondition = generatorUtils.checkAllTemplateConditionalValues(dataRow, repeatingGrpTemplate.condition, '', i + 1)
        }
        // apply condition if it exists, default is true
        if (applyCondition) {
          // add comma for json files
          if (i > 0 && fileExtension === '.json') {
            repeatingGrp = repeatingGrp + ','
          }
          //append repeating groups into single instance to be added to results file
          repeatingGrp = repeatingGrp + generatorUtils.getRepeatingGroupValues(repeatingGrpMap, dataRow, i + 1, repeatingGrpTemplatePath, false);
        }
      }
    }

    resultsFile = resultsFile.replace(repeatingGrpParam, repeatingGrp);
    return resultsFile;
  },

  addRepeatingGrpWithSplitValues: function addRepeatingGrpWithSplitValues (dataRow, resultsFile, repeatingGrpTemplate, fileExtension) {
    var repeatingGrp = '';

    var repeatingGrpMap = repeatingGrpTemplate.map;
    var repeatingGrpParam = repeatingGrpTemplate.parameter;
    var repeatingGrpSplitColumnName = repeatingGrpTemplate.splitValues.columnName.replace(/[{}]/g, '');
    var repeatingGrpSplitWith = repeatingGrpTemplate.splitValues.splitWith;
    var repeatingGrpTemplatePath = repeatingGrpTemplate.templateFile;
    var applyCondition = true;

    var repeatingGrpValues = dataRow[repeatingGrpSplitColumnName];
    var repeatingGrpArray = repeatingGrpValues.split(repeatingGrpSplitWith);


    _.forEach(repeatingGrpArray, function (value, index) {
      // check to see if condition applied to repeating group
      if (repeatingGrpTemplate.hasOwnProperty('condition')) {
        applyCondition = generatorUtils.checkAllTemplateConditionalValues(dataRow, repeatingGrpTemplate.condition, '', i + 1)
      }
      // apply condition if it exists, default is true
      if (applyCondition) {
        // add comma for json files
        if (index > 0 && fileExtension === '.json') {
          repeatingGrp = repeatingGrp + ','
        }
        //append repeating groups into single instance to be added to results file
        repeatingGrp = repeatingGrp + generatorUtils.getRepeatingGroupValues(repeatingGrpMap, value, null, repeatingGrpTemplatePath, true);
      }
    })

    resultsFile = resultsFile.replace(repeatingGrpParam, repeatingGrp);
    return resultsFile;
  },

  addParamGrp: function addParamGrp (resultsFile, paramGrpTemplate) {
    var paramFile = generatorUtils.readFile(paramGrpTemplate.templateFile);

    resultsFile = resultsFile.replace(paramGrpTemplate.parameter, paramFile);
    return resultsFile;
  },

  checkKeyNameExists: function checkKeyNameExists (dataRow, keyName, secondMatch, exactMatch) {

    return _.filter(dataRow, function (value, key) {
      if (exactMatch) {
        if (key === keyName) {
          return key;
        }
      } else {
        //if partial match, then check for keyName and if another match in the name needs to be found
        if (key.indexOf(keyName) >= 0) {
          if (secondMatch) {
            if (key.indexOf(secondMatch) >= 0) {
              return key;
            }
          } else {
            return key;
          }
        }
      }
    })
  },

  padOutParamValues: function padOutParamValues (paramObject, param) {
    var pad, res;

    pad = paramObject.padding.padWith;
    //need to add 1 to length, as the padding function shortened the string by 1 char
    var padLength = paramObject.paramLength + 1;
    pad = Array(padLength).join(pad);
    if (paramObject.padding.leadingWith) {
      res = pad.substring(0, pad.length - param.length) + param;
    } else {
      res = param + pad.substring(0, pad.length - param.length);
    }

    return res;
  },

  getMatchingPositionBasedValue: function getMatchingPositionBasedValue (positionObject, param) {
    return _.filter(positionObject, function (value) {
      return value.paramName === param;
    })
  },

  replaceValues: function replaceValues (genObj, dataRow, parameters, resultsFile, incrementalValue) {
    var paramName, fullParamName, paramValue;
    var fileExtension;
    //check if output object exists, if it does not then default to '.xml'
    //  eg. in the case of simulator config
    if (genObj.output) {
      fileExtension = genObj.output.fileExtension;
    } else {
      fileExtension = '.xml'
    }

    //check if values to be replaced are position delineated
    if (genObj.hasOwnProperty('positionBasedTemplate')) {
      var positionBased = genObj.positionBasedTemplate;
    }

    //only save to sumTotal incrementalValue is a value
    if (incrementalValue) {
      sumTotal = incrementalValue;
    }

    //check to make sure you have parameters to replace the values with,
    //  if not, then return the resultsFile
    if (parameters.length > 0) {
      //match header returned from template
      Object.keys(parameters).forEach(function (x) {
        paramName = parameters[x];
        fullParamName = '{' + paramName + '}';
        paramValue = dataRow[paramName];
        if (paramName === '%AUTO_INCREMENT%') {
          paramValue = incrementalValue;
        }
        if (paramName === '%SUM_TOTAL%') {
          paramValue = sumTotal;
        }
        //only escape if xml
        if (fileExtension === '.xml') {
          paramValue = escape(paramValue);
        }
        if (paramValue === undefined) {
          if (fileExtension === '.json') {
            //need to handle null values by removing 'quotes' around the fullParamName
            //  for json files
            paramValue = null;
            fullParamName = '"{' + paramName + '}"';
          } else {
            paramValue = '';
          }
        }

        //if have to handle position delineated, then then need to find matching param config
        //  pad out value
        if (positionBased) {
          var positionBasedValue = generatorUtils.getMatchingPositionBasedValue(positionBased, fullParamName);
          if (positionBasedValue && positionBasedValue.length > 0) {
            paramValue = generatorUtils.padOutParamValues(positionBasedValue[0], paramValue);
          }
        }

        resultsFile = resultsFile.replace(fullParamName, paramValue);
      });
    }

    return resultsFile;
  },

  checkTagsMatch: function checkTagsMatch (tagsToMatch, tag) {
    var match = false;

    if (tagsToMatch) {
      var tagsToMatchArray = tagsToMatch.split(',');

      _.forEach(tagsToMatchArray, function (tagToMatch) {
        if (tagToMatch.trim() === tag.trim()) {
          match = match || true;
        }
      });
    }

    return match;
  },

  getFilteredSet: function getFilteredSet (filteredSetData, filteredSetTagColumn, tagsToMatch) {
    return _.filter(filteredSetData, function (rows) {
      //need to check if tag column exists, if it does then continue
      //  else ignore row
      if (rows[filteredSetTagColumn]) {
        //need to check for whole tags (delineated by ',') and not just partial matches
        var filteredTags = rows[filteredSetTagColumn].split(',');
        var matchingTags = _.filter(filteredTags, function (tag) {
          // handle multi-array match eg. accountTagsToMatch = 'ALL,ONE' finds match for tag = 'ALL,THREE,TF'
          //  match = true, as one of the accountTagsToMatch ('ALL') matches one fo the tags ('ALL')
          return generatorUtils.checkTagsMatch(tagsToMatch, tag);
        });
        //only return result if full tag is found in the 'ADD_TO' column
        return matchingTags.length > 0;
      } else {
        return false;
      }

    });

  },

  getMatchingFilteredSet: function getMatchingFilteredSet (genObj, workbook, filteredSetWorkSheet, filteredSetConfigObj, dataRow, resultsFile) {

    var filteredSetData = generatorUtils.readContentsOfWorksheet(filteredSetWorkSheet);
    var filteredSetTagColumn = filteredSetConfigObj.sectionSheetTagColumn;
    var primarySheetColumn = filteredSetConfigObj.primarySheetTagColumn;
    var replacementParamName = filteredSetConfigObj.replacementParamName;
    var tagsToMatch = dataRow[primarySheetColumn];
    var filteredFileTemplate = filteredSetConfigObj.templateFromFile;
    var filteredSet = '';
    var matchingDataSet;

    if (!(filteredSetConfigObj.hasOwnProperty('templates') || filteredSetConfigObj.hasOwnProperty('templateFromFile'))) {
      throw ('Unable to find property "templates" or "templateFromFile" in "filteredTemplate" object');
    }

    if (filteredSetConfigObj.hasOwnProperty('columnMappings')) {
      var columnMappings = filteredSetConfigObj.columnMappings;
      var fromTag, fromTagColumn, fromData, toTag, toTagColumn, toData;
      var fromSheetName, toSheetName, toSheetWorksheet;

      _.forEach(columnMappings, function (mapping, index) {

        fromTagColumn = mapping.fromSheetColumn;

        //if first row then
        //  else set fromData to use the previously filtered set of data
        if (index === 0) {
          fromData = dataRow;
          fromTag = dataRow[fromTagColumn];
        } else {
          fromData = matchingDataSet;
        }

        //check if from/to sheet names are different
        if (mapping.fromSheetName === mapping.toSheetName) {
          //if sheets are different, then read contents of new worksheet
          //  else if the same, then just assign it as the previous sheet
          if (!fromData) {
            toSheetWorksheet = workbook.Sheets[mapping.toSheetName];
            toData = generatorUtils.readContentsOfWorksheet(toSheetWorksheet);
          } else {
            toData = fromData;
          }
        }

        //set worksheet for toData
        toSheetWorksheet = workbook.Sheets[mapping.toSheetName];
        toData = generatorUtils.readContentsOfWorksheet(toSheetWorksheet);
        toTagColumn = mapping.toSheetColumn;

        //need to do something here about dealing with an array (1st time round it's fine, but next time round it's not)
        //  need to consider 1-D array then multi-D array
        matchingDataSet = {};

        _.forEach(fromData, function (fromDataRow) {
          //if the mapping sheet is the same, then need to set fromTag to be the value in the 'toSheetColumn'
          //  so it will correctly match
          if (mapping.fromSheetName === mapping.toSheetName) {
            fromTag = fromDataRow[mapping.toSheetColumn];
          } else {
            if (!fromTag) {
              fromTag = fromDataRow[mapping.fromSheetColumn]
            }
          }
          //if fromTag exists, then apply mapping filter else don't
          if (fromTag) {
            //append matchingDataSet results together
            matchingDataSet = _.extend(matchingDataSet, generatorUtils.getFilteredSet(toData, toTagColumn, fromTag));
          }

        });

        fromSheetName = mapping.fromSheetName;
        toSheetName = mapping.toSheetName;

        fromData = matchingDataSet;
      });

      //convert result into an array, to make it consistent with what is returned from the result of the getFilterSet function
      matchingDataSet = _.toArray(matchingDataSet);

    } else {
      //when you have no columnMappings to handle
      matchingDataSet = generatorUtils.getFilteredSet(filteredSetData, filteredSetTagColumn, tagsToMatch);
    }

    console.log('num of matches: ' + matchingDataSet.length);

    if (matchingDataSet.length > 0) {
      var templateValues;

      //if use config has templates property then use templates to determine the templates to use
      //  else assume config is using templateFromFile instead
      if (filteredSetConfigObj.hasOwnProperty('templates')) {
        var defaultTemplate = generatorUtils.getNamedTemplate(filteredSetConfigObj, 'default');
        replacementParamName = defaultTemplate.replacementParamName;
        _.forEach(matchingDataSet, function (matchedRow, rowIndex) {

          var count = rowIndex + 1;
          //apply template specified in the filtered set config
          templateValues = generatorUtils.replaceValues(genObj, matchedRow, defaultTemplate.parameters, defaultTemplate.template, count);
          // if template is a json, then add ','
          if (filteredSetConfigObj.templates[0].fileName.indexOf('.json') > 1 && count > 1) {
            filteredSet = filteredSet + ',';
          }
          filteredSet = filteredSet + templateValues;
        });
      } else {
        //config has property: templateFromFile
        var templatefile = filteredFileTemplate.templateInputFolder + filteredFileTemplate.templateFileNameFormat;
        replacementParamName = filteredFileTemplate.replacementParamName;

        _.forEach(matchingDataSet, function (matchedRow) {
          var identifier = matchedRow[filteredFileTemplate.templateFileParamColumn];
          var fileName = templatefile.replace(filteredFileTemplate.templateFileParamName, identifier);
          templateValues = generatorUtils.readFile(fileName);
          filteredSet = filteredSet + templateValues;
        });
      }

      //replace it in the primary template file
      resultsFile = resultsFile.replace(replacementParamName, filteredSet);
    }

    return resultsFile;
  },

  checkAllTemplateConditionalValues: function checkAllTemplateConditionalValues (dataRow, templateConditions, templateUsed, indexValue) {
    var result = false;

    //if template is already used, then don't generate using another template
    if (!templateUsed) {
      _.forEach(templateConditions, function (condition, index) {
        // if condition has uniqueIdentifier with prefix and suffix, to determine columnName
        if (condition.hasOwnProperty('uniqueIdentifier')) {
          condition.columnName = condition.uniqueIdentifier.prefix + indexValue + condition.uniqueIdentifier.suffix
        }

        //first time through, get result from checking template conditional value
        //  subsequent times through, && result and previous result
        if (index === 0) {
          result = generatorUtils.checkTemplateConditionalValue(dataRow[condition.columnName], condition, indexValue);
        } else {
          result = result && generatorUtils.checkTemplateConditionalValue(dataRow[condition.columnName], condition, indexValue);
        }
      });
    }

    return result;
  },

  checkTemplateConditionalValue: function checkTemplateConditionalValue (dataRowValue, templateCondition, indexValue) {
    var dataTemplateConditionValue = dataRowValue;
    var templateConditionValue;
    if (templateCondition.hasOwnProperty('columnValue')) {
      templateConditionValue = templateCondition.columnValue;
    } else {
      if (templateCondition.hasOwnProperty('uniqueIdentifier')) {
        templateConditionValue = templateCondition.uniqueIdentifier.prefix
          + indexValue + templateCondition.uniqueIdentifier.suffix
      } else {
        throw new Error('template condition does not have "columnValue" or "uniqueIdentifier" property')
      }
    }

    var templateComparsionValue = templateCondition.conditionalValue;
    if (templateConditionValue === '%EMPTY%') {
      templateConditionValue = '';
    }
    //handle undefined value as blank value
    if (dataTemplateConditionValue === undefined) {
      dataTemplateConditionValue = '';
    }

    switch (templateComparsionValue) {
      case "=":
        return dataTemplateConditionValue === templateConditionValue;
      case "!=":
        return dataTemplateConditionValue !== templateConditionValue;
      case "<":
        return dataTemplateConditionValue < templateConditionValue;
      case ">":
        return dataTemplateConditionValue > templateConditionValue;
      case "<=":
        return dataTemplateConditionValue <= templateConditionValue;
      case ">=":
        return dataTemplateConditionValue >= templateConditionValue;
      default:
        console.log('template condition (' + templateCondition + ') is not valid');
        return false;
    }
  },

  useOtherTemplate: function useOtherTemplate (genObj, otherTemplate, dataRow) {
    var pathToOtherTemplate = otherTemplate.path + otherTemplate.fileName;

    if (otherTemplate.fileName !== '%NONE%') {
      var template = generatorUtils.readFile(pathToOtherTemplate);
      var parameters = generatorUtils.getParameters(template);
      //if no parameters found, just return the template file
      if (parameters.length > 0) {
        return generatorUtils.replaceValues(genObj, dataRow, parameters, template);
      } else {
        return template;
      }
    } else {
      return '%NONE%'
    }
  },

  generateSimulatorConfig: function generateSimulatorConfig (dataRow, simObj, simTemplate, simParameters, simFile) {
    simTemplate = simTemplate.replace(simObj.simulatorConfigFilenameParam, simFile);
    return generatorUtils.replaceValues(simObj, dataRow, simParameters, simTemplate);
  },

  generateAdditionalSimulatorConfig: function generateSimulatorConfig (dataRow, additionalSimObj, simFilename) {
    var addSimFile = '';
    var simDataRow = dataRow;
    var addSimFileName = '';
    var origDataRowColumnValue = '';

    _.forEach(additionalSimObj, function (simObj) {
      //handle multiple conditions
      _.forEach(simObj.condition, function (simObjCondition) {
        // save original value for dataRowColumnValue, so it doesn't get overwritten
        if (origDataRowColumnValue === '') {
          origDataRowColumnValue = simDataRow[simObjCondition.columnName];
        }
        var dataRowColumnValue = simDataRow[simObjCondition.columnName];
        //if column value is empty, then no value is assigned in the array
        if (dataRowColumnValue) {
          var useSimConfig = generatorUtils.checkTemplateConditionalValue(dataRowColumnValue, simObjCondition);
          if (useSimConfig) {
            var pathToSimTemplate = simObj.simulatorConfigTemplatePath + simObj.simulatorConfigTemplate;
            var simTemplate = generatorUtils.readFile(pathToSimTemplate);
            var simParameters = generatorUtils.getParameters(simTemplate);
            //apply additional formatting - if specified
            if (simObjCondition.hasOwnProperty('format')) {
              if (simObjCondition.format === '%NO SPACES%') {
                simDataRow[simObjCondition.columnName] = generatorUtils.removeSpacesFromString(origDataRowColumnValue);
              } else if (simObjCondition.format === '%ENCODE SPACES%') {
                if (simObjCondition.hasOwnProperty('encodeWith')) {
                  simDataRow[simObjCondition.columnName] = generatorUtils.encodeSpacesFromStringWith(origDataRowColumnValue, simObjCondition.encodeWith);
                } else {
                  simDataRow[simObjCondition.columnName] = generatorUtils.encodeSpacesFromStringWith(origDataRowColumnValue);
                }
              }
            }

            // if simulator config has property simulatorConfigFilenameParam then
            if (simObj.hasOwnProperty('simulatorConfigFilenameParam')) {
              addSimFileName = simObj.simulatorConfigFilenameParam.replace('{', '');
              addSimFileName = addSimFileName.replace('}', '');
              simDataRow[addSimFileName] = simFilename;
            }
            addSimFile = addSimFile + generatorUtils.replaceValues(simObj, simDataRow, simParameters, simTemplate);
          }
        }
      })
    });

    return addSimFile;
  },

  getNamedTemplate: function getNamedTemplate (generatorObj, templateName) {
    //determine the default template to use
    var defaultTemplate = _.find(generatorObj.templates, function (templates) {
      return templates.name === templateName;
    });
    if (defaultTemplate) {
      var result = defaultTemplate;
      var pathToTemplate = defaultTemplate.path + defaultTemplate.fileName;
      /* Read the file */
      result.template = generatorUtils.readFile(pathToTemplate);
      result.parameters = generatorUtils.getParameters(result.template);
      return result;
    } else {
      new Error("Unable to find default template");
    }


  },

  getDefaultTemplate: function getDefaultTemplate (generatorObj) {
    return generatorUtils.getNamedTemplate(generatorObj, 'default');
  },

  generateTemplateWithJSON: function generateTemplateWithJSON (generateObjectFile) {
    var defaultGeneratorObj = JSON.parse(generatorUtils.readFile('config/default.json'));
    var generatorObj = JSON.parse(generatorUtils.readFile(generateObjectFile));
    //merge with default generator config
    generatorObj = _.merge(defaultGeneratorObj, generatorObj);

    var workbook = xlsx.readFile(generatorObj.inputSheet);
    var worksheet = workbook.Sheets[generatorObj.sheetName];
    if (!worksheet) {
      throw 'Unable to find sheet name (' + generatorObj.sheetName + ') in spreadsheet: (' + generatorObj.inputSheet + ')';
    }

    var defaultTemplate = generatorUtils.getDefaultTemplate(generatorObj);
    var template = defaultTemplate.template;
    var parameters = defaultTemplate.parameters;

    var useExistingFilenameColumn = generatorObj.useExistingFilenameColumn;

    if (generatorObj.hasOwnProperty('simulator') && _.isObject(generatorObj.simulator)) {
      var pathToSimTemplate = generatorObj.simulator.simulatorConfigTemplatePath + generatorObj.simulator.simulatorConfigTemplate;
      var simTemplate = generatorUtils.readFile(pathToSimTemplate);
      var simParameters = generatorUtils.getParameters(simTemplate);
      var simFile = '';
    }

    //===========================================\\
    // READ in contents of worksheet
    //===========================================\\
    var data = generatorUtils.readContentsOfWorksheet(worksheet);

    //===========================================\\
    // REPLACE values in template file with
    //      values from spreadsheet
    //===========================================\\
    var resultsFile = template;
    var paramName, fullParamName, paramValue;
    var fileName;
    var positionBased = false;

    var startRow, endRow;
    if (generatorObj.hasOwnProperty('startRow')) {
      startRow = parseInt(generatorObj.startRow);
      //excel rows should start from 2, but index starts from 0, so need to compensate to make sure
      //  index starts from 0 and you start the index from the correct value
      if (startRow < 2) {
        startRow = 0;
      } else {
        startRow -= 2;
      }
    } else {
      startRow = 0;
    }

    if (generatorObj.hasOwnProperty('endRow')) {
      endRow = parseInt(generatorObj.endRow);
      if (endRow > data.length) {
        endRow = data.length;
      } else {
        endRow -= 2;
      }
    } else {
      endRow = data.length;
    }
    console.log('startRow: ' + startRow + '; endRow: ' + endRow);

    //loop through each row
    Object.keys(data).forEach(function (r, index) {

      //Only required for testing, if you want to limit the number of results
      if (index >= startRow && index <= endRow) {

        paramName = '';
        fullParamName = '';
        paramValue = '';
        resultsFile = template;

        var useTemplate;

        if (generatorObj.hasOwnProperty('mappedSection') && _.isObject(generatorObj.mappedSection)) {
          var repeatingGrps = generatorObj.mappedSection;
          var fileExtension = generatorObj.output.fileExtension;

          repeatingGrps.forEach(function (repeatingGrp) {
            // if the repeating group template has splitValues element, then need to be handled differently
            if (repeatingGrp.hasOwnProperty('splitValues')) {
              resultsFile = generatorUtils.addRepeatingGrpWithSplitValues(data[r], resultsFile, repeatingGrp, fileExtension);
            } else {
              resultsFile = generatorUtils.addRepeatingGrp(data[r], resultsFile, repeatingGrp, fileExtension);
            }
          })

        }

        //check if default template has any conditions, if it does then apply template only when condition is true
        //  else just apply default template
        if (defaultTemplate.hasOwnProperty('condition')) {
          useTemplate = generatorUtils.checkAllTemplateConditionalValues(data[r], defaultTemplate.condition);
        } else {
          useTemplate = true;
        }

        //check if conditions to generate template are met AND existing file specified
        if (useTemplate && data[r][useExistingFilenameColumn] !== undefined) {
          resultsFile = '%USE_EXISTING%';
          fileName = data[r][useExistingFilenameColumn];
          console.log('> ' + index + ' > use existing file: ' + data[r][useExistingFilenameColumn]);

        } else {
          // apply template
          if (useTemplate) {

            //check to see if a filtered template is to be applied
            if (generatorObj.hasOwnProperty('filteredSection') && _.isObject(generatorObj.filteredSection)) {
              //find matching accounts
              var filteredSetWorksheet = workbook.Sheets[generatorObj.filteredSection.sectionSheetName];
              resultsFile = generatorUtils.getMatchingFilteredSet(generatorObj, workbook, filteredSetWorksheet, generatorObj.filteredSection, data[r], resultsFile)
            }

            //check for other templates
            if (generatorObj.templates.length > 1) {
              var otherTemplates = _.filter(generatorObj.templates, function (template) {
                return template.name !== 'default';
              });

              var useOtherTemplate;

              _.forEach(otherTemplates, function (otherTemplate) {
                if (!otherTemplate.hasOwnProperty('condition') && !otherTemplate.hasOwnProperty('parameterTemplate')) {
                  throw 'Non-default templates must have "condition" or "template" parameters';
                } else {
                  if (otherTemplate.hasOwnProperty('condition')) {
                    useOtherTemplate = generatorUtils.checkAllTemplateConditionalValues(data[r], otherTemplate.condition, useOtherTemplate);

                    //if use other template conditions are met, then use other template
                    //  else use existing template
                    if (useOtherTemplate) {
                      resultsFile = generatorUtils.useOtherTemplate(generatorObj, otherTemplate, data[r]);
                    } else {
                      resultsFile = generatorUtils.replaceValues(generatorObj, data[r], parameters, resultsFile);
                    }

                  } else if (otherTemplate.hasOwnProperty('parameterTemplate')) {
                    // if you have pre-existing values set up in a file,
                    //  and want to replace with the pre-exisiting values
                    var paramGrp = otherTemplate.parameterTemplate;
                    resultsFile = generatorUtils.addParamGrp(resultsFile, paramGrp);

                    //also apply default template
                    resultsFile = generatorUtils.replaceValues(generatorObj, data[r], parameters, resultsFile);
                  }
                }
              })

            } else {
              //apply default template
              resultsFile = generatorUtils.replaceValues(generatorObj, data[r], parameters, resultsFile);
            }
          } else {
            //if default template conditions are not met, then don't create resultFile
            resultsFile = '%NONE%';
          }
        }

        //==========================================\\
        // FINAL check if parameters have NOT been updated
        //==========================================\\
        var checkParameters = generatorUtils.getParameters(resultsFile);
        if (checkParameters.length > 0) {
          console.log('NOT all PARAMETERS have been mapped!!!! Check parameters: ' + checkParameters.toString())
        }

        //===========================================\\
        // OUTPUT new results File
        //===========================================\\

        //check if resultsFile tagged with %NONE% > which means don't create a file for this row
        if (resultsFile !== '%NONE%') {
          //only create file when existing file not specified
          if (resultsFile !== '%USE_EXISTING%') {
            if (generatorObj.output.fileName === '%SET_FILENAME_TO%') {
              var setFileNameTo = generatorObj.output.setFilenameTo.replace(/[{}]/g, '');
              fileName = data[r][setFileNameTo] + generatorObj.output.fileExtension;
            } else {
              var idColumnName = generatorObj.output.fileIdColumn;
              if (!data[r].hasOwnProperty(idColumnName))
                throw ('Row: ' + r + ' - Column Name (' + idColumnName + ') not found in spreadsheet');
              var identifier = data[r][idColumnName];

              fileName = generatorObj.output.fileNamePrefix + identifier + generatorObj.output.fileExtension;
            }
            generatorUtils.writeFile(generatorObj.output.folder, fileName, resultsFile);
            console.log('> ' + index + ' > create file for >> ' + identifier + ' >> filename >> ' + fileName);
          }

          //===========================================\\
          // OUTPUT new simulator config File
          //===========================================\\
          if (simTemplate) {
            simFile = simFile + generatorUtils.generateSimulatorConfig(data[r], generatorObj.simulator, simTemplate, simParameters, fileName);
            //If there's additional simulator config that needs to be added ..
            if (generatorObj.simulator.hasOwnProperty('additionalSimulatorConfig')) {
              simFile = simFile + generatorUtils.generateAdditionalSimulatorConfig(data[r], generatorObj.simulator.additionalSimulatorConfig, fileName)
            }
            console.log('generated fileName: ' + fileName)
          }

        } else {
          console.log('> ' + index + ' > don\'t create file for >> ' + identifier);
        }

      }
    });

    //output simulator config file
    if (simTemplate && simFile !== '') {
      generatorUtils.writeFile(generatorObj.simulator.simulatorConfigOutput, generatorObj.simulator.simulatorFilename, simFile);
    }

  }
};

module.exports = generatorUtils;