const xlsx = require('xlsx');
const fs = require('fs');
const fsExtra = require('fs-extra');
const escape = require("html-escape");
const _ = require('lodash');
const jexl = require('jexl')
const falsey = require('falsey');
var sumTotal;
var mainGenObj;

var generatorUtils = {

  getDelimiters: function getDelimiters() {
    let delim = {}
    // default delimiter = '{' '}' eg. param => {ADDRESS} where column name = ADDRESS
    delim.startDelim = '\{' 
    delim.endDelim = '\}'

    // use global mainGenObj
    if(mainGenObj && mainGenObj.hasOwnProperty('customDelimiter')) {
      if(mainGenObj.customDelimiter.hasOwnProperty('startsWith') && mainGenObj.customDelimiter.hasOwnProperty('endsWith')) {
        delim.startDelim = mainGenObj.customDelimiter.startsWith
        delim.endDelim = mainGenObj.customDelimiter.endsWith
      } else {
        throw new Error('generator config > [ customDelimiter ] missing "startsWith" and "endsWith"')
      }
    }
    return delim
  },

  getParameters: function getParameters(template, genObj) {
    let delim = generatorUtils.getDelimiters()
    /* Match from template file */

    // if delim contains '[' or ']' or '(' or ')' need to properly escape it for regex
    //  only need to escape it for regex
    let regexStartDelim = delim.startDelim
    let regexEndDelim = delim.endDelim
    regexStartDelim  = regexStartDelim.replace(/\[/g, "\\[").replace(/\(/g, "\\(").replace(/\]/g, "\\]").replace(/\)/g, "\\)")
    regexEndDelim  = regexEndDelim.replace(/\[/g, "\\[").replace(/\(/g, "\\(").replace(/\]/g, "\\]").replace(/\)/g, "\\)")
    var regexPattern = new RegExp(`${regexStartDelim}([^"]*?)${regexEndDelim}`, 'g');
    var templateParameters = template.match(regexPattern);
    var parameters = [];
    var param;

    //check to make sure templateParameters is an object before attempting to use parameters
    if (_.isObject(templateParameters)) {
      //create array of matches for the parameters name values
      Object.keys(templateParameters).forEach(function (p) {
        let mockoonParamMatch = null
        // add check for single line mockoon response helpers (faker, header, now, date)
        // eg. {{faker 'random.uuid'}}
        if(genObj && genObj.hasOwnProperty('hasMockoonResponseHelperFormat') && genObj.hasMockoonResponseHelperFormat) {
          mockoonParamMatch = templateParameters[p].match(/(?<=\{\{)\w+ |(\d+ \d+){1}|('[\w\.\-\: ]+' ?){1,}| ?(\d+ \d+){1}(?=\})/)
        }
        // only add to parameters array if not checking if mockoonParam
        if(_.isNull(mockoonParamMatch)) {
          // delim values do not need to be escaped when used here
          param = templateParameters[p].toString().replace(delim.startDelim, "").replace(delim.endDelim, "");
          parameters.push(param);
        }
      });
    }
    //can return empty array if no matches found in parameters
    return parameters;
  },

  escapeJSON: function escapeJSON(str) {
    if(str) {
      return str.replace(/[\\]/g, '\\\\')
      .replace(/[\/]/g, '\\/')
      .replace(/[\b]/g, '\\b')
      .replace(/[\f]/g, '\\f')
      .replace(/[\n]/g, '\\n')
      .replace(/[\r]/g, '\\r')
      .replace(/[\t]/g, '\\t')
      .replace(/[\"]/g, '\\\"')
      .replace(/[\']/g, "\\\'")
      .replace(/[']/g, "\\'")
      .replace(/[&]/g, "\\\\&"); 
    }
  },

  readContentsOfWorksheet: function readContentsOfWorksheet(worksheet) {

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
      //  then using that value, use utils.encode_col to convert ColNum into a varter, eg. AA instead of '27'
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

  readDataGenFolderLocation: function readDataGenFolderLocation() {
    // if datafile.opt exists, then read from file
    if (fsExtra.existsSync(process.cwd() + '/datafile.opt')) {
      // read from datafile.opt
      return fs.readFileSync(process.cwd() + '/datafile.opt', { encoding: 'utf-8' }, function (err) {
        if (err) {
          return console.warn(err);
        }
      });
    } else {
      return '';
    }
  },

  readFile: function readFile(file, folderLocationSet) {
    var fileLocation
    if (!folderLocationSet) {
      // read from location datafile.opt
      var folderLocation = generatorUtils.readDataGenFolderLocation()
      fileLocation = folderLocation + '/' + file
    } else {
      fileLocation = file
    }

    return fs.readFileSync(fileLocation, { encoding: 'utf-8' }, function (err) {
      if (err) {
        return console.warn(err);
      }
    });
  },

  writeFile: function writeFile(pathToOutputFile, fileName, fileContents) {
    var outfilePath;
    // read from datafile.opt
    var folderLocation = generatorUtils.readDataGenFolderLocation()
    outfilePath = folderLocation + '/' + pathToOutputFile;
    //confirm directories are created, if not then have them created before attempting to create file
    fsExtra.ensureDirSync(outfilePath);
    fs.writeFileSync(outfilePath + fileName, fileContents, 'utf-8', function (err) {
      if (err) {
        return console.warn(err);
      }
    });
  },

  getFiles: function getFiles(dir, filesArr) {
    filesArr = filesArr || [];
    if (fs.existsSync(dir)) {
      var files = fs.readdirSync(dir);
      for (var i in files) {
        var name = dir + '/' + files[i];
        if (fs.statSync(name).isDirectory()) {
          getFiles(name, filesArr);
        } else {
          filesArr.push(name);
        }
      }
    }
    return filesArr;
  },

  removeFilesFromDir: function removeFilesFromDir(pathTo, filePrefix) {

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

  removeSpacesFromString: function removeSpacesFromString(stringValue) {
    return stringValue.replace(/\s/g, '');
  },

  encodeSpacesFromStringWith: function encodeSpacesFromString(stringValue, replaceWith) {
    // default to %20% if nothing is sent
    if (!replaceWith) {
      replaceWith = '%20';
    }
    return stringValue.replace(/\s/g, replaceWith);
  },

  getRepeatingGroupValues: function getRepeatingGroupValues(repeatingGroupMap, dataRow, count, templatePath, isSplitValue, repeatingGrpTransform) {
    var identifier, splitPos, prefixValue, suffixValue, paramName, paramValue, templateParamName;
    var template = generatorUtils.readFile(templatePath);
    var savedTemplate = template
    var isJson = false
    if (templatePath.indexOf('json', templatePath.length - 4) > 0) {
      isJson = true
    }

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
        if (isJson) {
          paramValue = dataRow[paramName] === undefined ? null : dataRow[paramName];
        } else {
          paramValue = dataRow[paramName] === undefined ? '' : dataRow[paramName];
        }

        // if JSON && paramValue is null, paramName may be wrapped in quotes
        // template = template.replace(templateParamName, paramValue);
        if (isJson && paramValue === null) {
          template = template.replace(`\"${templateParamName}\"`, paramValue);
          // incase paramName not wrapped in quotes
          template = template.replace(templateParamName, paramValue);
        } else {

          // check if transform required
          if (repeatingGrpTransform && _.isArray(repeatingGrpTransform) && repeatingGrpTransform.length > 0) {
            let useParamName = prefixValue + '_' + suffixValue
            // find matching transform for columnName && paramValue
            let transformMatch = _.find(repeatingGrpTransform, function (matchObj) {
              return matchObj.columnName === useParamName && matchObj.columnValue === paramValue
            })
            if (transformMatch) {
              let transformParamValue = generatorUtils.transformValues(transformMatch, useParamName, paramValue)
              template = template.replace(templateParamName, transformParamValue);
            }
          }
          // catch all for when transform is not required
          template = template.replace(templateParamName, paramValue);
        }
      }

    });

    return template;
  },

  applyRepeatingGrp: function applyRepeatingGrp(dataRow, repeatingGrpTemplate, counter, isSplitValue) {
    var applyCondition = true;
    var repeatingGrpValue = ''
    var repeatingGrpTransform = false
    isSplitValue = isSplitValue == true

    // check to see if condition applied to repeating group
    if (repeatingGrpTemplate.hasOwnProperty('condition')) {
      applyCondition = generatorUtils.checkAllTemplateConditionalValues(dataRow, repeatingGrpTemplate.condition, '', counter + 1)
    }
    // apply condition if it exists, default is true
    if (applyCondition) {

      //check if transform object exists
      if (repeatingGrpTemplate.hasOwnProperty('transform')) {
        repeatingGrpTransform = repeatingGrpTemplate.transform
      }

      //append repeating groups into single instance to be added to results file
      repeatingGrpValue = generatorUtils.getRepeatingGroupValues(repeatingGrpTemplate.map, dataRow, counter + 1, repeatingGrpTemplate.templateFile, isSplitValue, repeatingGrpTransform);
    }

    return repeatingGrpValue
  },

  generateRepeatingGrp: function generateRepeatingGrp(dataRow, repeatingGrpTemplate, fileExtension) {
    var repeatingGrp = '';
    var repeatingGrpPrefix, repeatingGrpSuffix
    if (repeatingGrpTemplate.hasOwnProperty('uniqueIdentifier')) {
      repeatingGrpPrefix = repeatingGrpTemplate.uniqueIdentifier.prefix;
      repeatingGrpSuffix = repeatingGrpTemplate.uniqueIdentifier.suffix;
    } else {
      repeatingGrpPrefix = ''
      repeatingGrpSuffix = ''
    }


    //check if column contains value in spreadsheet
    var repeatingGrpHeadings = generatorUtils.checkKeyNameExists(dataRow, repeatingGrpPrefix, repeatingGrpSuffix, false);
    if (repeatingGrpHeadings && repeatingGrpHeadings.length > 0) {
      for (var i = 0; i < repeatingGrpHeadings.length; i++) {
        // add comma for json files
        // for json files
        // and only when comma does not already exist as last character
        let applyRepeatingGrp = generatorUtils.applyRepeatingGrp(dataRow, repeatingGrpTemplate, i)
        if (i > 0 && applyRepeatingGrp != '' && i < repeatingGrpHeadings.length && fileExtension === '.json'
          && repeatingGrp.lastIndexOf(',') < (repeatingGrp.length - 1)) {
          repeatingGrp = repeatingGrp + ','
        }
        repeatingGrp = repeatingGrp + applyRepeatingGrp
      }
    }

    // for JSON response - clean up to make sure array elements separated correctly
    if (fileExtension === '.json') {
      repeatingGrp = repeatingGrp.replace(/}\s+{/g, '},{')
    }

    // console.log(`repeatingGrp >>> ${repeatingGrp}`)
    return repeatingGrp
  },

  addRepeatingGrp: function addRepeatingGrp(dataRow, resultsFile, repeatingGrpTemplate, fileExtension) {
    var repeatingGrp = '';

    var repeatingGrpParam = repeatingGrpTemplate.parameter;
    repeatingGrp = generatorUtils.generateRepeatingGrp(dataRow, repeatingGrpTemplate, fileExtension)

    resultsFile = resultsFile.replace(repeatingGrpParam, repeatingGrp);
    return resultsFile;
  },

  addRepeatingGrpWithSplitValues: function addRepeatingGrpWithSplitValues(dataRow, resultsFile, repeatingGrpTemplate, fileExtension) {
    var repeatingGrp = '';

    var repeatingGrpParam = repeatingGrpTemplate.parameter;
    var repeatingGrpSplitColumnName = repeatingGrpTemplate.splitValues.columnName.replace(/[{}]/g, '');
    var repeatingGrpSplitWith = repeatingGrpTemplate.splitValues.splitWith;

    var repeatingGrpValues = dataRow[repeatingGrpSplitColumnName];
    var repeatingGrpArray = repeatingGrpValues.split(repeatingGrpSplitWith);

    _.forEach(repeatingGrpArray, function (value, index) {
      // set isSplitValue flag to true
      repeatingGrp = repeatingGrp + generatorUtils.applyRepeatingGrp(value, repeatingGrpTemplate, index, true)
    })

    resultsFile = resultsFile.replace(repeatingGrpParam, repeatingGrp);
    return resultsFile;
  },

  addParamGrp: function addParamGrp(resultsFile, paramGrpTemplate) {
    var paramFile = generatorUtils.readFile(paramGrpTemplate.templateFile);

    resultsFile = resultsFile.replace(paramGrpTemplate.parameter, paramFile);
    return resultsFile;
  },

  checkKeyNameExists: function checkKeyNameExists(dataRow, keyName, secondMatch, exactMatch) {
    return _.filter(dataRow, function (value, key) {
      // apply check if value is empty then don't return as a match for repeating group
      if(value != '') {
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
      }
    })
  },

  padOutParamValues: function padOutParamValues(paramObject, param) {
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

  getMatchingPositionBasedValue: function getMatchingPositionBasedValue(positionObject, param) {
    return _.filter(positionObject, function (value) {
      return value.paramName === param;
    })
  },

  transformValues: function transformValues(transformObj, paramName, paramValue) {
    // "expression": "{GENDER} == 'M'",
    // "columnName": "GENDER",
    // "conditionalValue": "==",
    // "columnValue": "M",
    // "replacementValue": "Male"
    let transformValue
    if (transformObj.hasOwnProperty("columnName") && transformObj.hasOwnProperty("conditionalValue") &&
      transformObj.hasOwnProperty("columnValue") && transformObj.hasOwnProperty("replacementValue")) {
      // if(transObj.hasOwnProperty('expression')) {
      //   if(jexl.evalSync(transObj.expression)) {
      //     console.log(`>>> EXPRESSION: ${transObj.expression} evaluates to TRUE!`)
      //   } else {
      //     console.log(`>>> EXPRESSION: ${transObj.expression} evaluates to FALSE!`)
      //   }
      // }
      if (paramName === transformObj.columnName && paramValue === transformObj.columnValue) {
        transformValue = transformObj.replacementValue
      }
    } else {
      throw new Error("config for transform object has to have all the folowing values: " +
        "columnName, conditionalValue, columnValue and replacementValue")
    }
    return transformValue
  },

  replaceValues: function replaceValues(genObj, dataRow, parameters, resultsFile, incrementalValue, simIndex) {
    var paramName, fullParamName, paramValue;
    var fileExtension;
    var simIndexValue = 0
    //check if output object exists, if it does not then default to '.xml'
    //  eg. in the case of simulator config
    if (genObj.output) {
      fileExtension = genObj.output.fileExtension;
    } else if (genObj.hasOwnProperty('simulator')) {
      if(simIndex && simIndex != '') {
        simIndexValue = simIndex
      }
      if(genObj.simulator[simIndexValue] && genObj.simulator[simIndexValue].hasOwnProperty('simulatorConfigTemplate')) {
        fileExtension = '.' + genObj.simulator[simIndexValue].simulatorConfigTemplate.split('.').pop()
      }
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
      let delim = generatorUtils.getDelimiters(genObj)      //match header returned from template
      Object.keys(parameters).forEach(function (x) {
        paramName = parameters[x];
        fullParamName = delim.startDelim + paramName + delim.endDelim;
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

        // //only escape if json in simulator config > not quite working
        // if (fileExtension === '.json' && genObj.hasOwnProperty('simulator') &&
        //   (genObj.simulator.hasOwnProperty('simulatorConfigTemplate') ||
        //   genObj.simulator[simIndexValue].hasOwnProperty('simulatorConfigTemplate')) ) {
        //   paramValue = generatorUtils.escapeJSON(paramValue);
        // }

        // handle when parameter is not set, set to default values empty or null
        if (paramValue === undefined) {
          // if default value has been set in config then use it
          if (genObj.hasOwnProperty('setAsDefaultValue')) {
            paramValue = genObj.setAsDefaultValue
          } else {
            // not default value has been set in config, then set as empty or null
            if (fileExtension === '.json') {
              // need to handle the 3 types >> sometimes it will be repeatingGroup
              // and other times will be single value
              // so need to test for all then determine what to do
              // if single value then can be using defaultValue
              // if repeatingGroup then need to remove
              paramValue = null;
              fullParamName = `"${delim.startDelim}${paramName}${delim.endDelim}"`;
              let pNameRegEx = new RegExp(fullParamName)  // {ADDRESS}
              let pNameInBodyRegEx = new RegExp(`\\:\\s+?"${delim.startDelim}${paramName}${delim.endDelim}",?`)       // "streetNumber": "{STREET_NUMBER}",
              let pNameInBodyNumberRegEx = new RegExp(`\\:\\s+?${delim.startDelim}${paramName}${delim.endDelim},?`)   // "unitFlatLevel": {UNIT}
              if (pNameInBodyRegEx.test(resultsFile)) {
                // if in body > it's likely to be a value matched to a key
                paramValue = '""'
              } else if(pNameInBodyNumberRegEx.test(resultsFile)) {
                // if in body (as a number) > it's likely to be a value matched to a key
                if(genObj.hasOwnProperty('jsonDefaultValue')) {
                  // value can be set as string or null
                  // eg. jsonDefaultValue: "\"\"" or jsonDefaultValue: null
                  paramValue = genObj.jsonDefaultValue
                } else {
                  paramValue = null
                }
              } else {
                // if not then likely to be repeating grp value > so should be empty
                // eg. {ADDRESS}
                if(pNameRegEx.test(resultsFile)) {
                  paramValue = ''
                } else {
                  // catch all remaining
                  if(genObj.hasOwnProperty('jsonDefaultValue')) {
                    // value can be set as string or null
                    // eg. jsonDefaultValue: "\"\"" or jsonDefaultValue: null
                    paramValue = genObj.jsonDefaultValue
                  } 
                }
              }
            } else {
              paramValue = '';
            }
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

        // check if transformation needs to be applied to value, eg. convert 'ADDR' to 'addressProperty'
        if (genObj.hasOwnProperty('transform') && !(_.isUndefined(_.find(genObj.transform, { columnName: paramName })))) {
          // loop through each of the transform options to see if it applies
          _.forEach(genObj.transform, function (transObj) {
            let replacementParamValue = generatorUtils.transformValues(transObj, paramName, paramValue)
            // if replacementParamValue is not empty then replace it
            if(replacementParamValue != undefined && replacementParamValue) {
              resultsFile = resultsFile.replace(fullParamName, replacementParamValue)
            } 
          })
        }

        resultsFile = resultsFile.replace(fullParamName, paramValue).replace('%BACKSLASH_APOSTROPHE%', '\\\'');
        // removed check to replace any outstanding params here
        //  there's another check before resultsFile is generated
        //  this allows for sub-templates to be used
      });
    }

    return resultsFile;
  },

  checkTagsMatch: function checkTagsMatch(tagsToMatch, tag) {
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

  getFilteredSet: function getFilteredSet(filteredSetData, filteredSetTagColumn, tagsToMatch) {
    return _.filter(filteredSetData, function (rows) {
      //need to check if tag column exists, if it does then continue
      //  else ignore row
      if (rows && rows[filteredSetTagColumn]) {
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

  applyColumnMapping: function applyColumnMapping(workbook, dataRow, filteredSetConfigObj, filteredSetData) {
    var matchingDataSet;
    var filteredSetTagColumn = filteredSetConfigObj.sectionSheetTagColumn;
    var primarySheetColumn = filteredSetConfigObj.primarySheetTagColumn;
    var tagsToMatch = dataRow[primarySheetColumn];

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
        let fromDataArr = []
        // fromData can still be an object with more than 1 item
        if(!_.isArray(fromData)) {
          fromDataArr.push(fromData)
        } else {
          fromDataArr = fromData
        }

        _.forEach(fromDataArr, function (fromDataRow) {
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
            //append matchingDataSet results together to an array
            matchingDataSet = _.toArray(_.extend(matchingDataSet, generatorUtils.getFilteredSet(toData, toTagColumn, fromTag)));
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
    return matchingDataSet
  },

  applyFilteredSetToMatches: function applyFilteredSetToMatches(genObj, filteredSetConfigObj, resultsFile, generatedTemplateFile, matchingDataSet) {
    var filteredFileTemplate = filteredSetConfigObj.templateFromFile;
    var matchingDataSet;
    var replacementParamName;
    var templateValues;
    var filteredSet = '';

    //if use config has templates property then use templates to determine the templates to use
    //  else assume config is using templateFromFile instead
    if (filteredSetConfigObj.hasOwnProperty('templates')) {

      var defaultTemplate = generatorUtils.getNamedTemplate(filteredSetConfigObj, 'default', generatedTemplateFile);
      replacementParamName = defaultTemplate.replacementParamName;
      // need to use make a clean copy of the default template for use
      //  as default template is used to overwritten with updates
      //  so may result in removing any additional params once those values have been replaced
      let cleanTemplate = ''
      cleanTemplate = defaultTemplate.template
      _.forEach(filteredSetConfigObj.templates, (filteredSetConfigTemplate) => {
        _.forEach(matchingDataSet, (matchedRow, rowIndex) => {
          // check if conditionalTemplates exist
          if (filteredSetConfigTemplate.hasOwnProperty('templates')) {
            let conditionalTemplates = filteredSetConfigTemplate.templates
            // setting new variables for templates used so that they'll be 'clean' on each
            //  iteration of the loop
            let useTemplate = cleanTemplate
            _.forEach(conditionalTemplates, cTemplateObj => {
              // check to see if condition applied 
              if (cTemplateObj.hasOwnProperty('condition')) {
                applyCondition = generatorUtils.checkAllTemplateConditionalValues(matchedRow, cTemplateObj.condition)
              }
              // apply condition if it exists, default is true
              if (applyCondition) {
                let cTemplateValues
                let cReplacementParamName
                let cTemplate = ''
                cTemplate = generatorUtils.getNamedTemplate(filteredSetConfigTemplate, cTemplateObj.name, generatedTemplateFile);
                cTemplateValues = generatorUtils.replaceValues(genObj, matchedRow, cTemplate.parameters, cTemplate.template);
                cReplacementParamName = cTemplateObj.replacementParamName;
                //replace it in the template file
                useTemplate = useTemplate.replace(cReplacementParamName, cTemplateValues);
              }
            })
            // apply any updates to default template
            defaultTemplate.template = useTemplate
          }

          var count = rowIndex + 1;
          //apply template specified in the filtered set config
          templateValues = generatorUtils.replaceValues(genObj, matchedRow, defaultTemplate.parameters, defaultTemplate.template, count);
          // if template is a json, then add ','
          if (filteredSetConfigTemplate.fileName.indexOf('.json') > 1 && count > 1
            && templateValues != ''
            && filteredSet.lastIndexOf(',') < (filteredSet.length - 1)) {
              if(filteredSetConfigTemplate.hasOwnProperty('separator')) {
                filteredSet = filteredSet + filteredSetConfigTemplate.separator;
              } else {
                filteredSet = filteredSet + ',';
              }
          }
          filteredSet = filteredSet + templateValues;
        });
      })
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

    return filteredSet
  },

  getMatchingFilteredSet: function getMatchingFilteredSet(genObj, workbook, filteredSetWorkSheet, filteredSetConfigObj, dataRow, resultsFile, generatedTemplateFile) {

    var filteredSetData = generatorUtils.readContentsOfWorksheet(filteredSetWorkSheet);
    var filteredSetTagColumn = filteredSetConfigObj.sectionSheetTagColumn;
    var primarySheetColumn = filteredSetConfigObj.primarySheetTagColumn;
    var tagsToMatch = dataRow[primarySheetColumn];
    var filteredFileTemplate = filteredSetConfigObj.templateFromFile;
    var filteredSet = '';
    var matchingDataSet;
    var replacementParamName;

    // sometimes filteredSetConfig obj has template array, so need to check for that
    if (filteredSetConfigObj.hasOwnProperty('replacementParamName')) {
      replacementParamName = filteredSetConfigObj.replacementParamName
    } else if (filteredSetConfigObj.hasOwnProperty('templates')
      && filteredSetConfigObj.templates[0].hasOwnProperty('replacementParamName')) {
      replacementParamName = filteredSetConfigObj.templates[0].replacementParamName
    }

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

        // can be cases where fromData is just single row of data already
        //  fromData can be Array or array of objects
        //  need to check if fromData[0] also exists, as it can be identified as an object even though it's array-like
        if(Array.isArray(fromData) || _.isObject(fromData[0])) {  
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
        } else {
          // when single row of data
          if (mapping.fromSheetName === mapping.toSheetName) {
            fromTag = fromData[mapping.toSheetColumn];
          } else {
            if (!fromTag) {
              fromTag = fromData[mapping.fromSheetColumn]
            }
          }
          //if fromTag exists, then apply mapping filter else don't
          if (fromTag) {
            //append matchingDataSet results together
            matchingDataSet = _.extend(matchingDataSet, generatorUtils.getFilteredSet(toData, toTagColumn, fromTag));
          }
        }

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

        var defaultTemplate = generatorUtils.getNamedTemplate(filteredSetConfigObj, 'default', generatedTemplateFile);
        replacementParamName = defaultTemplate.replacementParamName;
        // need to use make a clean copy of the default template for use
        //  as default template is used to overwritten with updates
        //  so may result in removing any additional params once those values have been replaced
        let cleanTemplate = ''
        cleanTemplate = defaultTemplate.template
        _.forEach(filteredSetConfigObj.templates, (filteredSetConfigTemplate) => {
          _.forEach(matchingDataSet, (matchedRow, rowIndex) => {
            // check if conditionalTemplates exist
            if (filteredSetConfigTemplate.hasOwnProperty('templates')) {
              let conditionalTemplates = filteredSetConfigTemplate.templates
              // setting new variables for templates used so that they'll be 'clean' on each
              //  iteration of the loop
              let useTemplate = cleanTemplate
              
              // useGeneratedTemplate
              if(filteredSetConfigTemplate.hasOwnProperty('useGeneratedTemplate') && filteredSetConfigTemplate.useGeneratedTemplate) {
                useTemplate = generatedTemplateFile
              }

              _.forEach(conditionalTemplates, cTemplateObj => {
                // check to see if condition applied 
                if (cTemplateObj.hasOwnProperty('condition')) {
                  applyCondition = generatorUtils.checkAllTemplateConditionalValues(matchedRow, cTemplateObj.condition)
                }
                // apply condition if it exists, default is true
                if (applyCondition) {
                  let cTemplateValues
                  let cReplacementParamName
                  let cTemplate = ''
                  cTemplate = generatorUtils.getNamedTemplate(filteredSetConfigTemplate, cTemplateObj.name, generatedTemplateFile);
                  cTemplateValues = generatorUtils.replaceValues(genObj, matchedRow, cTemplate.parameters, cTemplate.template);
                  cReplacementParamName = cTemplateObj.replacementParamName;
                  //replace it in the template file
                  useTemplate = useTemplate.replace(cReplacementParamName, cTemplateValues);
                }
              })

              // apply this updated template as the clean template so that it'll be used
              cleanTemplate = useTemplate
              // save to primary template
              defaultTemplate.template = useTemplate
            }

            // if filteredSetConfig has 'applyTemplate' property
            //  it means that you need to apply a 'child' filtered template before applying the current filtered set
            if(filteredSetConfigTemplate.hasOwnProperty('applyTemplate') && _.isObject(filteredSetConfigTemplate.applyTemplate)) {
              // if applyTemplate is not an array then push into array
              if(!_.isArray(filteredSetConfigTemplate.applyTemplate)) {
                let tempApplyTemplate = filteredSetConfigTemplate.applyTemplate
                let tempApplyTemplateArr = []
                tempApplyTemplateArr.push(tempApplyTemplate)
                filteredSetConfigTemplate.applyTemplate = tempApplyTemplateArr
              }
              // set up new filteredCleanTemplate to use for filteredSection
              let filteredCleanTemplate = {} = cleanTemplate
              
              // for each arrayTemplate in filteredSetConfigTemplate > apply the template config
              _.forEach(filteredSetConfigTemplate.applyTemplate, (applyTempateObj) => {
                let applyTemplate = {} = applyTempateObj
                let applyCondition = true // default to always applyCondition, as 'condition' property may not always exist
                let applyTemplatePath = applyTemplate.applyToTemplate.path + applyTemplate.applyToTemplate.fileName
                let tempResultsFile = generatorUtils.readFile(applyTemplatePath);
                var tempDefaultTemplate = generatorUtils.getNamedTemplate(applyTemplate, 'default');
                let tempReplacementParamName = tempDefaultTemplate.replacementParamName;
                let tempFilteredSet = ''
                // if condition property exists and check if it should be applied or not
                if (tempDefaultTemplate.hasOwnProperty('condition')) {
                  applyCondition = generatorUtils.checkAllTemplateConditionalValues(matchedRow, tempDefaultTemplate.condition)
                }
                // apply condition (if it exists, applyCondition is set to true as default)
                if(applyCondition) {
                  var tempFilteredSetWorksheet = workbook.Sheets[applyTemplate.sectionSheetName];
                  let tempFilteredSetData = generatorUtils.readContentsOfWorksheet(tempFilteredSetWorksheet);
                  let tempMatchingDataSet = generatorUtils.applyColumnMapping(workbook, matchedRow, applyTemplate, tempFilteredSetData) 
                  if(tempMatchingDataSet.length > 0) {
                    tempFilteredSet = generatorUtils.applyFilteredSetToMatches(genObj, applyTemplate, tempResultsFile, generatedTemplateFile, tempMatchingDataSet)
                  } 
                }
                // re-apply the clean template each time
                let templateToUse = ''
                templateToUse = filteredCleanTemplate
                //replace it in the primary template file
                templateToUse = templateToUse.replace(tempReplacementParamName, tempFilteredSet);
                // save to primary template
                defaultTemplate.template = templateToUse
                // save "new" clean template with previous values
                filteredCleanTemplate = templateToUse
              })
            }

            var count = rowIndex + 1;
            //apply template specified in the filtered set config
            templateValues = generatorUtils.replaceValues(genObj, matchedRow, defaultTemplate.parameters, defaultTemplate.template, count);
            // if template is a json, then add ','
            if (filteredSetConfigTemplate.fileName.indexOf('.json') > 1 && count > 1
              && templateValues != ''
              && filteredSet.lastIndexOf(',') < (filteredSet.length - 1)) {
                if(filteredSetConfigTemplate.hasOwnProperty('separator')) {
                  filteredSet = filteredSet + filteredSetConfigTemplate.separator;
                } else {
                  filteredSet = filteredSet + ',';
                }
            }
            filteredSet = filteredSet + templateValues;
          });

        })
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

    } else {
      // if no result then empty response for filteredSet
      resultsFile = resultsFile.replace(replacementParamName, '');
    }
    return resultsFile;
  },

  checkAllTemplateConditionalValues: function checkAllTemplateConditionalValues(dataRow, templateConditions, templateUsed, indexValue) {
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

  checkTemplateConditionalValue: function checkTemplateConditionalValue(dataRowValue, templateCondition, indexValue) {
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
      case "==":
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

  useOtherTemplate: function useOtherTemplate(genObj, otherTemplate, dataRow) {
    var pathToOtherTemplate = otherTemplate.path + otherTemplate.fileName;

    if (otherTemplate.fileName !== '%NONE%') {
      var template = generatorUtils.readFile(pathToOtherTemplate);
      var parameters = generatorUtils.getParameters(template, genObj);
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

  generateSimulatorConfig: function generateSimulatorConfig(dataRow, simObj, simTemplate, simParameters, simFile, simIndex) {
    var useSimConfig = true
    // should really check if condition exists
    if (simObj.hasOwnProperty('condition')) {
      let simConditions = []
      if(!_.isArray(simObj.condition)) {
        simConditions.push(simObj.condition)
      } else {
        simConditions = simObj.condition
      }
      _.forEach(simConditions, (simCondition) => {
        var dataRowColumnValue = dataRow[simCondition.columnName];
        useSimConfig = generatorUtils.checkTemplateConditionalValue(dataRowColumnValue, simCondition);
        if(useSimConfig) {
          // apply format to sim condition
          if (simCondition.hasOwnProperty('format')) { 
            if (simCondition.format === '%NO SPACES%') {
              // remove spaces from column value
              dataRow[simCondition.columnName] = generatorUtils.removeSpacesFromString(dataRowColumnValue);
            } else if(simCondition.format === '%USE_BACKSLASH_APOSTROPHE%') {
              // use \' as escape value for apostrophe
              dataRow[simCondition.columnName] = dataRowColumnValue.replace('\'', '%BACKSLASH_APOSTROPHE%');
            } 
          }
        }
      })

    }
    if (useSimConfig) {
      // apply global match when replacing filename
      let simFilenameRegex = new RegExp(simObj.simulatorConfigFilenameParam, 'g')
      simTemplate = simTemplate.replace(simFilenameRegex, simFile);
      return generatorUtils.replaceValues(simObj, dataRow, simParameters, simTemplate, '', simIndex);
    }
  },

  generateAdditionalSimulatorConfig: function generateAdditionalSimulatorConfig(dataRow, additionalSimObj, simFilename) {
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
                simDataRow[simObjCondition.columnName] = generatorUtils.removeSpacesFromString(dataRowColumnValue);
              } else if (simObjCondition.format === '%ENCODE SPACES%') {
                if (simObjCondition.hasOwnProperty('encodeWith')) {
                  simDataRow[simObjCondition.columnName] = generatorUtils.encodeSpacesFromStringWith(dataRowColumnValue, simObjCondition.encodeWith);
                } else {
                  simDataRow[simObjCondition.columnName] = generatorUtils.encodeSpacesFromStringWith(dataRowColumnValue);
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

  // currently not used
  generateSimulatorJSONResponse: function generateSimulatorJSONResponse(dataRow, jsonSimObj, generatedFilename) {

    // when you don't have a template for the simulator AND it's a JSON object
    //  can describe JSON object in simulator config
    if (jsonSimObj.hasOwnProperty('jsonPrimaryNode') && jsonSimObj.hasOwnProperty('jsonMap')) {
      let mappedValue = {}

      _.forEach(jsonSimObj.jsonMap, function (mapValue, mapKey) {
        let paramName, paramValue
        let fullParamName = mapValue
        // check if mapValue is a param
        //  if param > get paramValue
        //  if not > pass value through
        let match = new RegExp(/^{.*}$/)
        if (match.test(fullParamName)) {
          paramName = fullParamName.replace('{', '').replace('}', '')
          if (paramName === 'FILE_NAME') {
            mappedValue[mapKey] = generatedFilename
          } else {
            paramValue = dataRow[paramName]
            mappedValue[mapKey] = paramValue
          }
        } else {
          mappedValue[mapKey] = mapValue
        }
      })

      return mappedValue
    }
  },

  getNamedTemplate: function getNamedTemplate(generatorObj, templateName, generatedTemplateFile) {
    //determine the default template to use
    var defaultTemplate = _.find(generatorObj.templates, function (templates) {
      return templates.name === templateName;
    });
    if (defaultTemplate) {
      var result = defaultTemplate;
      if(defaultTemplate.hasOwnProperty('useGeneratedTemplate') && defaultTemplate.useGeneratedTemplate) {
        result.useGeneratedTemplate = true
        result.template = generatedTemplateFile
      } else {
        var pathToTemplate = defaultTemplate.path + defaultTemplate.fileName;
        /* Read the file */
        result.template = generatorUtils.readFile(pathToTemplate);
      }
      result.parameters = generatorUtils.getParameters(result.template, generatorObj);
      return result;
    } else {
      new Error("Unable to find default template");
    }
  },

  getDefaultTemplate: function getDefaultTemplate(generatorObj) {
    return generatorUtils.getNamedTemplate(generatorObj, 'default');
  },

  generateTemplateWithJSON: function generateTemplateWithJSON(generateObjectFile) {
    var defaultGeneratorObj = JSON.parse(generatorUtils.readFile('config/default.json'));
    var generatorObj = JSON.parse(generatorUtils.readFile(generateObjectFile, true));
    //merge with default generator config
    generatorObj = _.merge(defaultGeneratorObj, generatorObj);
    // save generator obj as global value mainGenObj
    mainGenObj = generatorObj

    // read folder location from datafile.opt
    var folderLocation = generatorUtils.readDataGenFolderLocation()
    var workbook = xlsx.readFile(folderLocation + '/' + generatorObj.inputSheet);
    var worksheet = workbook.Sheets[generatorObj.sheetName];
    if (!worksheet) {
      throw 'Unable to find sheet name (' + generatorObj.sheetName + ') in spreadsheet: (' + generatorObj.inputSheet + ')';
    }

    var defaultTemplate = generatorUtils.getDefaultTemplate(generatorObj);
    var template = defaultTemplate.template;
    var parameters = defaultTemplate.parameters;
    var isTemplateSim = false
    var isJsonSim = false
    let templateSimArr = []
    var templateSim = []
    var jsonMapSim = []
    var simFile = ''

    var useExistingFilenameColumn = generatorObj.useExistingFilenameColumn;

    if (generatorObj.hasOwnProperty('simulator') && _.isObject(generatorObj.simulator)) {
      _.forEach(generatorObj.simulator, function (simObj, index) {
        if(simObj.hasOwnProperty('simulatorConfigTemplate')) {
          templateSim.push(simObj)
        }

        if(simObj.hasOwnProperty('jsonPrimaryNode')) {
          jsonMapSim.push(findJsonMapMatch)
        }
      })

      if (templateSim) {
        _.forEach(templateSim, function(template) {
          let templateSimObj = {}
          templateSimObj.pathToSimTemplate = template.simulatorConfigTemplatePath + template.simulatorConfigTemplate;
          templateSimObj.simTemplate = generatorUtils.readFile(templateSimObj.pathToSimTemplate);
          templateSimObj.simParameters = generatorUtils.getParameters(templateSimObj.simTemplate);
          templateSimObj.simFile = '';
          templateSimObj.isTemplateSim = true
          templateSimArr.push(templateSimObj)
        })
      }

      if (_.isObject(jsonMapSim)) {
        isJsonSim = true
        var simJsonMapResult = []
      }
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
      // default genRowFlag to true > to always genRow unless flag value evaluates to false
      let genRowFlag = true
      // if useGenRowFlag is set and data[r] contains the col with genRowColumnName and data[r][genRowColumnName] value is !falsey() then continue
      if (generatorObj.hasOwnProperty('useGenRowFlag')) {
        let setGenRowFlag = true
        // if additional option is set 'setGenRowFlag' then use it to determine whether or not getRow options should be used or not
        if(generatorObj.useGenRowFlag.hasOwnProperty('setGenRowFlag')) {
          setGenRowFlag = generatorObj.useGenRowFlag.setGenRowFlag
        }
        if(setGenRowFlag) {
          if (generatorObj.useGenRowFlag.hasOwnProperty('genRowColumnName')) {
            let genRowColName = generatorObj.useGenRowFlag.genRowColumnName
            let genRowValue = data[r][genRowColName] 
            // add extra check with falsey for missing negative values 'N' and 'n'
            genRowFlag = !falsey(genRowValue) && !falsey(genRowValue, ['N', 'n'])
            if(genRowFlag) {
              console.log(`genRowFlag active for row [ ${index} ]`)
            }
          } else {
            throw new Error ('config "useGenRowFlag" does not have "genRowColumnName" property')
          }
        }
      }
      // check if within startRow/endRow OR genRowFlag is set for row
      if ((index >= startRow && index <= endRow) && genRowFlag) {

        paramName = '';
        fullParamName = '';
        paramValue = '';
        resultsFile = template;

        var useTemplate;

        //==========================================\\
        // Check if any GLOBAL parameter values to be set from config file
        //==========================================\\
        if (generatorObj.hasOwnProperty('fixedMappingValues')) {
          var fixedMappingValues = []
          var fixedMapParams = []
          fixedMappingValues = _.forEach(generatorObj.fixedMappingValues, function (value, key) {
            fixedMappingValues[key] = value
          })
          // create array with param names for fixed param names
          _.forEach(fixedMappingValues, function (value, key) {
            fixedMapParams.push(key)
          })
          resultsFile = generatorUtils.replaceValues(generatorObj, fixedMappingValues, fixedMapParams, resultsFile);
        }

        //==========================================\\
        // Apply the template
        //==========================================\\
        if (generatorObj.hasOwnProperty('mappedSection') && _.isObject(generatorObj.mappedSection)) {
          var repeatingGrps = generatorObj.mappedSection;
          var fileExtension = generatorObj.output.fileExtension;
          let useRGrpTemplate = true

          repeatingGrps.forEach(function (repeatingGrp) {
            if(repeatingGrp.hasOwnProperty('condition')) {
              useRGrpTemplate = generatorUtils.checkAllTemplateConditionalValues(data[r], repeatingGrp.condition);
            } 
            if(useRGrpTemplate) {
              // if the repeating group template has splitValues element, then need to be handled differently
              if (repeatingGrp.hasOwnProperty('splitValues')) {
                resultsFile = generatorUtils.addRepeatingGrpWithSplitValues(data[r], resultsFile, repeatingGrp, fileExtension);
              } else {
                resultsFile = generatorUtils.addRepeatingGrp(data[r], resultsFile, repeatingGrp, fileExtension);
              }
            }
          })
        }

        if (generatorObj.hasOwnProperty('conditionalSection') && _.isObject(generatorObj.conditionalSection)) {
          let conditionalSections = generatorObj.conditionalSection;
          let useConditionalTemplate = true

          conditionalSections.forEach(function (conditionSec) {
            let parentTemplate = ''
            if(conditionSec.hasOwnProperty('condition')) {
              useConditionalTemplate = generatorUtils.checkAllTemplateConditionalValues(data[r], conditionSec.condition);
            } 
            if(useConditionalTemplate) {
              parentTemplate = generatorUtils.readFile(conditionSec.templateFile)
              let cParameters = generatorUtils.getParameters(parentTemplate, generatorObj);
              parentTemplate = generatorUtils.replaceValues(generatorObj, data[r], cParameters, parentTemplate);
            }
            resultsFile = resultsFile.replace(conditionSec.parameter, parentTemplate)
          })
        }

        // if mappedJSONSection exists
        if (generatorObj.hasOwnProperty('mappedJSONSection') && _.isObject(generatorObj.mappedJSONSection)) {
          // read mappedJSONSection.templateFile
          var jsonParentTemplate = generatorUtils.readFile(generatorObj.mappedJSONSection.templateFile)
          let addComma = false

          _.forEach(generatorObj.mappedJSONSection.childMap, function (cMap, index) {
            let childMapResult = ''
            let childRepeatingGrp = generatorUtils.generateRepeatingGrp(data[r], cMap, '.json')
            if (cMap.hasOwnProperty('isInJSONArray') && cMap.isInJSONArray) {
              // append ',' between each jsonObj
              //  check if last character is not comma or '}'
              if (index > 0 && addComma && childRepeatingGrp != ''
                && childRepeatingGrp.lastIndexOf(',') < (childRepeatingGrp.length - 1)
                && (childRepeatingGrp.lastIndexOf('}') === (childRepeatingGrp.length - 1))) {
                childMapResult = childMapResult + ','
              }
              childMapResult = childMapResult + childRepeatingGrp
              // additional check for when to add comma, if empty result returned then 
              //  no need to add comma
              addComma = childMapResult != ''
            } else {
              childMapResult = childRepeatingGrp
            }
            jsonParentTemplate = jsonParentTemplate.replace(cMap.parameter, childMapResult)
          })
          resultsFile = resultsFile.replace(generatorObj.mappedJSONSection.parameter, jsonParentTemplate)
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
              // filtered section may be an array
              if (_.isArray(generatorObj.filteredSection)) {
                let filterResultsTemplate = resultsFile
                _.forEach(generatorObj.filteredSection, function (section) {
                  if(section.hasOwnProperty('applyToTemplate') 
                    && _.isObject(section.applyToTemplate)) {
                    var applyTemplatePath = section.applyToTemplate.path + section.applyToTemplate.fileName
                    filterResultsTemplate = generatorUtils.readFile(applyTemplatePath);

                    //generate using specific template to apply
                    var filteredSetWorksheet = workbook.Sheets[section.sectionSheetName];
                    filterResultsTemplate = generatorUtils.getMatchingFilteredSet(generatorObj, workbook, filteredSetWorksheet, section, data[r], filterResultsTemplate)
                  } else {
                    //find matching rows and apply to template
                    var filteredSetWorksheet = workbook.Sheets[section.sectionSheetName];
                    resultsFile = generatorUtils.getMatchingFilteredSet(generatorObj, workbook, filteredSetWorksheet, section, data[r], resultsFile, filterResultsTemplate)
                  }
                })
              } else {
                //find matching rows and apply to template
                var filteredSetWorksheet = workbook.Sheets[generatorObj.filteredSection.sectionSheetName];
                resultsFile = generatorUtils.getMatchingFilteredSet(generatorObj, workbook, filteredSetWorksheet, generatorObj.filteredSection, data[r], resultsFile)
              }
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
        // FINAL check if any parameters have NOT been updated
        //==========================================\\
        var checkParameters = generatorUtils.getParameters(resultsFile, generatorObj);
        if (checkParameters.length > 0) {
          //apply default values
          console.log('NOT all PARAMETERS have been mapped!')
          var remainingParams = []
          if (generatorObj.hasOwnProperty('setAsDefaultValue')) {
            console.log('APPLYING default param value: ' + generatorObj.setAsDefaultValue)
            // applying default value as set in config file
            checkParameters.forEach(function (param) {
              remainingParams[param] = generatorObj.setAsDefaultValue
            })
          } 
          resultsFile = generatorUtils.replaceValues(generatorObj, remainingParams, checkParameters, resultsFile);
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
            if (generatorObj.output.fileExtension === '.json') {
              resultsFile = resultsFile.replace(/}\s{0,}{/g, '},{').replace(/""""/g, '""')
                .replace(/},\s+\],/g, '}],').replace(/[[\s]{0,}""[[\s]{0,}]/g, '[]')
                .replace(/,\s{0,}\}/g, '}').replace(/\[\s{0,}\{\s{0,}}\s{0,}\]/g, '[]')
                .replace(/"\s+"/g, '","')
                .replace(/"?:\s+}/g, '":{}')
                .replace(/":\s?[\r\n]+"/g, '":{"')
                .replace(/":\s{0,},/g, '":{},')
              try {
                resultsFile = JSON.stringify(JSON.parse(resultsFile), null, 2)
              } catch (e) {
                console.log(`>>> JSON formatting ERROR: ${e}`)
              }
            }
            generatorUtils.writeFile(generatorObj.output.folder, fileName, resultsFile);
            console.log('> ' + index + ' > create file for >> ' + identifier + ' >> filename >> ' + fileName);
          }

          //===========================================\\
          // OUTPUT new simulator config File
          //===========================================\\

          // handle multiple simTemplates
          _.forEach(templateSimArr, function (singleSimTemplate, index) {

              let simTemplate = singleSimTemplate.simTemplate
              let isTemplateSim = singleSimTemplate.isTemplateSim
              let simParameters = singleSimTemplate.simParameters

              if (simTemplate && isTemplateSim) {
                let newTemplate = generatorUtils.generateSimulatorConfig(data[r], templateSim[index], simTemplate, simParameters, fileName, index);
                // if JSON, escape backslash
                if (templateSim[index].simulatorConfigTemplate.indexOf('.json') > 0) {
                  newTemplate = newTemplate.replace(/\\/g, "\\\\")
                }
                singleSimTemplate.simFile = singleSimTemplate.simFile + newTemplate
                //If there's additional simulator config that needs to be added ..
                if (templateSim[index].hasOwnProperty('additionalSimulatorConfig')) {
                  singleSimTemplate.simFile = singleSimTemplate.simFile + generatorUtils.generateAdditionalSimulatorConfig(data[r], templateSim[index].additionalSimulatorConfig, fileName)
                }
                // if JSON, make sure commas in correct place and properly update '&apos;' to "\\'"
                if (templateSim[index].simulatorConfigTemplate.indexOf('.json') > 0) {
                  singleSimTemplate.simFile = singleSimTemplate.simFile.replace(/}\s{0,}{/g, '},{').replace(/}{/g, '},{').replace(/&apos;/g, "\\\\'")
                }
                console.log('generated fileName: ' + fileName)
              }

              //output simulator config file
              if (simTemplate && simTemplate.simFile !== '') {
                generatorUtils.writeFile(templateSim[index].simulatorConfigOutput, templateSim[index].simulatorFilename, singleSimTemplate.simFile);
              }
        
              if (jsonMapSim && jsonMapSim.length > 0 && _.isObject(simJsonMapResult)) {
                let finalSimJson = {}
                finalSimJson[jsonMapSim[index].jsonPrimaryNode] = simJsonMapResult
                generatorUtils.writeFile(jsonMapSim[index].simulatorConfigOutput, jsonMapSim[index].simulatorFilename, JSON.stringify(finalSimJson, null, 2));
              }
          })

        } else {
          console.log('> ' + index + ' > don\'t create file for >> ' + identifier);
        }

      }
    });

  }
};

module.exports = generatorUtils;