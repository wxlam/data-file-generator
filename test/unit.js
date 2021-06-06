var chai = require('chai');
var expect = chai.expect;
var should = chai.should;
var assert = chai.assert;
var simple = require('simple-mock');
var utils = require('../support/generator.js');
var fs = require('fs');
var fsExtra = require('fs-extra');
var xlsx = require('xlsx');
var fse = require('fs-extra');
var fsmock = require('mock-fs');

//add in afterEach function to clean up after each test
afterEach(function () {
  //restore simple-mock back to original state
  simple.restore();

  //remove extra folders
  fsExtra.removeSync('data-files/test/data/output');
});

describe('unit tests for getParameters function in generator', function () {
  it('should test match for parameters', function () {
    var addressInput = fs.readFileSync('./data-files/test/data/ADDRESS.xml', {encoding: 'utf-8'});
    expect(utils.getParameters(addressInput).length).to.equal(10);
  });

  it('should test not match for parameters', function () {
    var addressInput = fs.readFileSync('./data-files/test/data/NoParameters.xml', {encoding: 'utf-8'});
    expect(utils.getParameters(addressInput).length).to.equal(0);
  });

});

describe('unit tests for readContentsOfWorksheet function in generator', function () {
  it('should test data is read from the worksheet', function () {
    var workBook = xlsx.readFile('./data-files/test/data/worksheet.xlsx');
    var worksheet = workBook.Sheets['AOCM Search'];
    var contents = utils.readContentsOfWorksheet(worksheet);
    expect(contents[0]['SEARCH_IDENTIFIER']).to.equal('All');
  });

  it('should test no. of rows read from the worksheet', function () {
    var workBook = xlsx.readFile('./data-files/test/data/worksheet.xlsx');
    var worksheet = workBook.Sheets['AOCM Search'];
    expect(utils.readContentsOfWorksheet(worksheet).length).to.equal(2);
  });

  it('should test no. of non empty row 1 read from the worksheet', function () {
    var workBook = xlsx.readFile('./data-files/test/data/worksheet.xlsx');
    var worksheet = workBook.Sheets['AOCM Search'];
    var contents = utils.readContentsOfWorksheet(worksheet);
    expect(Object.keys(contents[0]).length).to.equal(6);
    expect(Object.keys(contents[1]).length).to.equal(7);
  });

});

describe('unit tests for readFile function in generator', function () {
  it('should file is read', function () {
    simple.mock(fs, 'readFileSync').returnWith("<ONE>{ONE}</ONE><TWO>{TWO}</TWO>");
    expect(utils.readFile('/test/filename.xml')).to.equal('<ONE>{ONE}</ONE><TWO>{TWO}</TWO>');
  });

  it('should test file read is returned with an error', function () {
    simple.mock(fs, 'readFileSync').callbackWith(new Error());
    utils.readFile('test/filename.xml');
    expect(fs.readFileSync.lastCall.returned, Error);
  });

});

describe('unit tests for writeFile function in generator', function () {
  it('should confirm file is written', function () {

    fsmock({
      'path/to/fake/dir': {
        'test.xml': 'abc'
      }
    });

    simple.mock(fs, 'writeFileSync');
    utils.writeFile('path/to/fake/dir', 'test.xml', 'abc');
    expect(fs.writeFileSync.callCount).to.equal(1);

    fsmock.restore();
  });

  it('should test file write is returned with an error', function () {

    fsmock({
      'path/to/fake/dir': {
        'test2.xml': 'abc'
      }
    });

    simple.mock(fs, 'writeFileSync').callbackWith(new Error());
    utils.writeFile('path/to/fake/dir', 'test.xml', 'abc');
    expect(fs.writeFileSync.lastCall.returned, Error);

    fsmock.restore();

  });

});

describe('unit tests for getFiles function in generator', function () {
  it('should confirm array of files are returned', function () {

    fsmock({
      'path': {
        'to': {
          'dir': {
            'test1.xml': 'abc',
            'test2.xml': 'abc'
          },
          'dir2': {}
        }
      }
    });
    var arrayName;
    var exp = ['path/to/dir/test1.xml', 'path/to/dir/test2.xml'];

    simple.mock(fs, 'readdirSync');
    simple.mock(fs.statSync, 'isDirectory').returnWith(true);
    var res = utils.getFiles('path', arrayName);
    expect(res.length).to.equal(2);
    expect(res[0]).to.equal(exp[0]);
    expect(fs.readdirSync.callCount).to.equal(4);
    expect(fs.statSync.isDirectory.callCount).to.equal(0);

    fsmock.restore();
  });

});

describe('unit tests for removeFilesFromDir function in generator', function () {
  it('should test files are removed from directory', function () {
    fsmock({
      'path': {
        'to': {
          'dir': {
            'test1.xml': 'abc',
            'test2.xml': 'abc'
          },
          'dir2': {}
        }
      }
    });

    simple.mock(fs, 'existsSync');
    simple.mock(fsExtra, 'mkdirSync');
    simple.mock(utils, 'getFiles').returnWith(['path/to/dir/test1.xml', 'path/to/dir/test2.xml']);
    simple.mock(fsExtra, 'removeSync').returnWith(true);
    utils.removeFilesFromDir('path/to/dir/');
    expect(fsExtra.removeSync.callCount).to.equal(2);

    fsmock.restore();

  });

  it('should test files with prefix are removed from directory', function () {
    fsmock({
      'path': {
        'to': {
          'dir': {
            'test1-one.xml': 'abc',
            'test1-two.xml': 'abc',
            'test2-one.xml': 'abc'
          },
          'dir2': {}
        }
      }
    });

    simple.mock(fs, 'existsSync');
    simple.mock(fsExtra, 'mkdirSync');
    simple.mock(utils, 'getFiles').returnWith(['path/to/dir/test1-one.xml', 'path/to/dir/test1-two.xml', 'path/to/dir/test2-one.xml']);
    simple.mock(fsExtra, 'removeSync').returnWith(true);
    utils.removeFilesFromDir('path/to/dir/', 'test1-');
    expect(fsExtra.removeSync.callCount).to.equal(2);

    fsmock.restore();

  });

  it('should test folders are created if directory not found', function () {
    fsmock({
      'path': {
        'to': {
          'dir': {
            'test1-one.xml': 'abc',
            'test1-two.xml': 'abc',
            'test2-one.xml': 'abc'
          },
          'dir2': {}
        }
      }
    });

    simple.mock(fs, 'existsSync').returnWith(false);
    simple.mock(fsExtra, 'mkdirsSync').returnWith(true);
    simple.mock(utils, 'getFiles').returnWith(['path/to/dir/test1-one.xml', 'path/to/dir/test1-two.xml', 'path/to/dir/test2-one.xml']);
    simple.mock(fsExtra, 'removeSync').returnWith(true);
    utils.removeFilesFromDir('path/to/dir3/', 'test1-');
    expect(fsExtra.mkdirsSync.callCount).to.equal(1);
    expect(fsExtra.removeSync.callCount).to.equal(0);

    fsmock.restore();

  });

});

describe('unit tests for removeSpacesFromString function in generator', function () {
  it('should test spaces are removed from  strings', function () {
    var str = "Hello world I am here";
    expect(utils.removeSpacesFromString(str)).to.equal('HelloworldIamhere');
  });
});

describe('unit tests for removeSpacesFromString function in generator', function () {
  it('should test mocked value is replaced by dataRow', function () {
    var repeatingGroupMap = {
      "ONE": "VALUE_ONE",
      "TWO": "VALUE_TWO"
    };
    var dataRow = {"VALUE1_ONE": 'four', "VALUE1_TWO": "two", "VALUE2_ONE": 'one', "VALUE2_TWO": "three"};
    var count = 2;
    var templatePath = 'abcd';
    simple.mock(utils, 'readFile').returnWith("<ONE>{ONE}</ONE><TWO>{TWO}</TWO>");
    var contents = utils.getRepeatingGroupValues(repeatingGroupMap, dataRow, count, templatePath);
    expect(contents).to.equal('<ONE>one</ONE><TWO>three</TWO>');
  });

  it('should test %AUTO_INCREMENT% value is replaced by dataRow', function () {
    var repeatingGroupMap = {
      "ONE": "%AUTO_INCREMENT%",
      "TWO": "VALUE_TWO"
    };
    var dataRow = {"VALUE1_ONE": 'four', "VALUE1_TWO": "two", "VALUE2_ONE": 'one', "VALUE2_TWO": "three"};
    var count = 0;
    var templatePath = 'abcd';
    simple.mock(utils, 'readFile').returnWith("<ONE>{ONE}</ONE><TWO>{TWO}</TWO>");
    var contents = utils.getRepeatingGroupValues(repeatingGroupMap, dataRow, count, templatePath);
    expect(contents).to.equal('<ONE>0</ONE><TWO></TWO>');
  });
});

describe('unit tests for addRepeatingGrp function in generator', function () {
  it('should test to add a parameter group value', function () {
    var repeatingGrpTemplate = {
      "name": "repeating template example",
      "templateFile": "data/template/repeating-template.xml",
      "parameter": "{REPLACEMENT_PARAMETER}",
      "uniqueIdentifier": {
        "prefix": "VALUE",
        "suffix": "_ONE"
      },
      "map": {
        "ONE": "VALUE_ONE",
        "TWO": "VALUE_TWO"
      }
    };
    var dataRow = {"VALUE1_ONE": 'four', "VALUE1_TWO": "two", "VALUE2_ONE": 'one', "VALUE2_TWO": "three"};
    var resultsFile = 'Hello {REPLACEMENT_PARAMETER} Marry';
    simple.mock(utils, 'checkKeyNameExists').returnWith(["VALUE1_ONE"]);
    simple.mock(utils, 'getRepeatingGroupValues').returnWith("Moana");
    var contents = utils.addRepeatingGrp(dataRow, resultsFile, repeatingGrpTemplate);
    expect(contents).to.equal('Hello Moana Marry');
  });

  it('should test to add a parameter group value when checkKeyNameExists is not found', function () {
    var repeatingGrpTemplate = {
      "name": "repeating template example",
      "templateFile": "data/template/repeating-template.xml",
      "parameter": "{REPLACEMENT_PARAMETER}",
      "uniqueIdentifier": {
        "prefix": "VALUE",
        "suffix": "_ONE"
      },
      "map": {
        "ONE": "VALUE_ONE",
        "TWO": "VALUE_TWO"
      }
    };
    var dataRow = {"VALUE1_ONE": 'four', "VALUE1_TWO": "two", "VALUE2_ONE": 'one', "VALUE2_TWO": "three"};
    var resultsFile = 'Hello {REPLACEMENT_PARAMETER} Marry';
    simple.mock(utils, 'checkKeyNameExists').returnWith(undefined);
    simple.mock(utils, 'getRepeatingGroupValues').returnWith("Moana");
    var contents = utils.addRepeatingGrp(dataRow, resultsFile, repeatingGrpTemplate);
    expect(contents).to.equal('Hello  Marry');
  });
});

describe('unit tests for addParamGrp function in generator', function () {
  it('should test to add a repeating group value', function () {
    var paramGrpTemplate = {
      "templateFile": "data/template/repeating-template.xml",
      "parameter": "{REPLACEMENT_PARAMETER}"
    };
    var resultsFile = 'Hello {REPLACEMENT_PARAMETER} Marry';
    simple.mock(utils, 'readFile').returnWith("<ONE>one</ONE>");
    var contents = utils.addParamGrp(resultsFile, paramGrpTemplate);
    expect(contents).to.equal('Hello <ONE>one</ONE> Marry');
  });
});

describe('unit tests for checkKeyNameExists function in generator', function () {
  it('should test for checkKeyNameExists for first match', function () {
    var dataRow = {"VALUE1_ONE": 'four', "VALUE1_TWO": "two", "VALUE2_ONE": 'one', "VALUE2_TWO": "three"};
    var keyName = 'VALUE2_ONE';
    var secondMatch = '';
    var exactMatch = true;
    var contents = utils.checkKeyNameExists(dataRow, keyName, secondMatch, exactMatch);
    expect(contents.length).to.equal(1);
    expect(contents[0]).to.equal('one');
  });

  it('should test for checkKeyNameExists for second match', function () {
    var dataRow = {"VALUE1_ONE": 'four', "VALUE1_TWO": "two", "VALUE2_ONE": 'one', "VALUE2_TWO": "three"};
    var keyName = 'VALUE1';
    var secondMatch = 'TWO';
    var exactMatch = false;
    var contents = utils.checkKeyNameExists(dataRow, keyName, secondMatch, exactMatch);
    expect(contents.length).to.equal(1);
    expect(contents[0]).to.equal('two');
  });

  it('should test for checkKeyNameExists for first match', function () {
    var dataRow = {"VALUE1_ONE": 'four', "VALUE1_TWO": "two", "VALUE2_ONE": 'one', "VALUE2_TWO": "three"};
    var keyName = 'VALUE1';
    var secondMatch = '';
    var exactMatch = false;
    var contents = utils.checkKeyNameExists(dataRow, keyName, secondMatch, exactMatch);
    expect(contents.length).to.equal(2);
  });
});

describe('unit tests for padOutParamValues function in generator', function () {
  it('should test the param length is 40', function () {
    var paramObject = {
      "paramName": "{RELATIONSHIP_MANAGER_NAME}",
      "paramLength": 40,
      "padding": {
        "padWith": " ",
        "leadingWith": false
      }
    };
    var param = "ABCDDADADA";
    var contents = utils.padOutParamValues(paramObject, param);
    expect(contents.length).to.equal(40);
  });

  it('should test for pad out content with trailing pad width', function () {
    var paramObject = {
      "paramName": "{RELATIONSHIP_MANAGER_NAME}",
      "paramLength": 40,
      "padding": {
        "padWith": "Q",
        "leadingWith": false
      }
    };
    var param = "ABCDDADADA";
    var contents = utils.padOutParamValues(paramObject, param);
    expect(contents.length).to.equal(40);
    expect(contents).to.equal('ABCDDADADAQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQ');
  });

  it('should test for pad out content with leading pad width', function () {
    var paramObject = {
      "paramName": "{RELATIONSHIP_MANAGER_NAME}",
      "paramLength": 40,
      "padding": {
        "padWith": "Q",
        "leadingWith": true
      }
    };
    var param = "ABCDDADADA";
    var contents = utils.padOutParamValues(paramObject, param);
    expect(contents.length).to.equal(40);
    expect(contents).to.equal('QQQQQQQQQQQQQQQQQQQQQQQQQQQQQQABCDDADADA');
  });
});

describe('unit tests for replaceValues function in generator', function () {

  var genObj = {
    "profileName": "test-profile",
    "output": {
      "folder": "output/custcpidinq/",
      "fileNamePrefix": "CPID-RelMgr-",
      "fileIdColumn": "CONTROLLING_POST",
      "fileExtension": ".xml"
    }
  };

  it('should test for replaceValues for parameters < 0', function () {

    var dataRow = {"VALUE1_ONE": 'four', "VALUE1_TWO": "two", "VALUE2_ONE": 'one', "VALUE2_TWO": "three"};
    var parameters = [];
    var resultsFile = "abc {VALUE1_ONE} def";
    var incrementalValue = 1;
    var sumTotal = 1;

    var res = utils.replaceValues(genObj, dataRow, parameters, resultsFile, incrementalValue);
    expect(res).to.equal('abc {VALUE1_ONE} def');

  });

  it('should test for replaceValues for xml', function () {

    var dataRow = {"VALUE1_ONE": 'four', "VALUE1_TWO": "two", "VALUE2_ONE": 'one', "VALUE2_TWO": "three"};
    var parameters = ["VALUE1_ONE", "VALUE2_ONE"];
    var resultsFile = "abc {VALUE1_ONE} def";
    var incrementalValue = 1;
    var sumTotal = 1;

    var res = utils.replaceValues(genObj, dataRow, parameters, resultsFile, incrementalValue);
    expect(res).to.equal('abc four def');

  });

  it('should test for replaceValues for no incremental value', function () {

    var dataRow = {"VALUE1_ONE": 'four', "VALUE1_TWO": "two", "VALUE2_ONE": 'one', "VALUE2_TWO": "three"};
    var parameters = ["VALUE1_ONE", "VALUE2_ONE"];
    var resultsFile = "abc {VALUE1_ONE} def";
    var incrementalValue = '';
    // var sumTotal = 1;

    var res = utils.replaceValues(genObj, dataRow, parameters, resultsFile, incrementalValue);
    expect(res).to.equal('abc four def');

  });

  it('should test for replaceValues for non xml', function () {
    var genObj = {
      "profileName": "test-profile",
      "output": {
        "folder": "output/custcpidinq/",
        "fileNamePrefix": "CPID-RelMgr-",
        "fileIdColumn": "CONTROLLING_POST",
        "fileExtension": ".pdf"
      }
    };

    var dataRow = {"VALUE1_ONE": 'four', "VALUE1_TWO": "two", "VALUE2_ONE": 'one', "VALUE2_TWO": "three"};
    var parameters = ["VALUE1_ONE", "VALUE2_ONE"];
    var resultsFile = "abc {VALUE1_ONE} def";
    var incrementalValue = 1;
    var sumTotal = 1;

    var res = utils.replaceValues(genObj, dataRow, parameters, resultsFile, incrementalValue);
    expect(res).to.equal('abc four def');

  });

  it('should test for replaceValues for fileExtension no output object', function () {

    var genObj = {
      "profileName": "test-profile"
    };
    var dataRow = {"VALUE1_ONE": "four", "VALUE1_TWO": "two", "VALUE2_ONE": 'one', "VALUE2_TWO": "three"};
    var parameters = ["VALUE1_ONE", "VALUE2_ONE"];
    var resultsFile = "abc {VALUE1_ONE} def";
    var incrementalValue = 1;
    var sumTotal = 1;

    var res = utils.replaceValues(genObj, dataRow, parameters, resultsFile, incrementalValue);
    expect(res).to.equal('abc four def');

  });

  it('should test for replaceValues for AUTO_INCREMENT', function () {

    var dataRow = {"VALUE1_ONE": 'four', "VALUE1_TWO": "two", "VALUE2_ONE": 'one', "VALUE2_TWO": "three"};
    var parameters = ["%AUTO_INCREMENT%", "VALUE2_ONE"];
    var resultsFile = "abc {%AUTO_INCREMENT%} def";
    var incrementalValue = 1;
    var sumTotal = 1;

    var res = utils.replaceValues(genObj, dataRow, parameters, resultsFile, incrementalValue);
    expect(res).to.equal('abc 1 def');

  });

  it('should test for replaceValues for SUM_TOTAL', function () {

    var dataRow = {"VALUE1_ONE": 'four', "VALUE1_TWO": "two", "VALUE2_ONE": 'one', "VALUE2_TWO": "three"};
    var parameters = ["%SUM_TOTAL%", "VALUE2_ONE"];
    var resultsFile = "abc {%SUM_TOTAL%} def";
    var incrementalValue = 2;
    var sumTotal = 1;

    var res = utils.replaceValues(genObj, dataRow, parameters, resultsFile, incrementalValue);
    expect(res).to.equal('abc 2 def');

  });

  it('should test for replaceValues for position based', function () {

    var genObj = {
      "profileName": "test-profile",
      "output": {
        "folder": "output/custcpidinq/",
        "fileNamePrefix": "CPID-RelMgr-",
        "fileIdColumn": "CONTROLLING_POST",
        "fileExtension": ".xml"
      },
      "positionBasedTemplate": [
        {
          "paramName": "{VALUE1_ONE}",
          "paramLength": 5,
          "padding": {
            "padWith": "0",
            "leadingWith": false
          }
        },
        {
          "paramName": "{VALUE2_ONE}",
          "paramLength": 3,
          "padding": {
            "padWith": " ",
            "leadingWith": false
          }
        }]
    };

    var dataRow = {"VALUE1_ONE": "four", "VALUE1_TWO": "two", "VALUE2_ONE": 'one', "VALUE2_TWO": "three"};
    var parameters = ["VALUE1_ONE", "VALUE2_ONE"];
    var resultsFile = "abc {VALUE1_ONE} def";
    var incrementalValue = 1;

    var res = utils.replaceValues(genObj, dataRow, parameters, resultsFile, incrementalValue);
    expect(res).to.equal('abc four0 def');

  });

  it('should test for replaceValues for position based with no match for position based param', function () {

    var genObj = {
      "profileName": "test-profile",
      "output": {
        "folder": "output/custcpidinq/",
        "fileNamePrefix": "CPID-RelMgr-",
        "fileIdColumn": "CONTROLLING_POST",
        "fileExtension": ".xml"
      },
      "positionBasedTemplate": [
        {
          "paramName": "{VALUE1_ONE}",
          "paramLength": 5,
          "padding": {
            "padWith": "0",
            "leadingWith": false
          }
        },
        {
          "paramName": "{VALUE2_ONE}",
          "paramLength": 3,
          "padding": {
            "padWith": " ",
            "leadingWith": false
          }
        }]
    };

    var dataRow = {"VALUE1_ONE": "four", "VALUE1_TWO": "two", "VALUE2_ONE": 'one', "VALUE2_TWO": "three"};
    var parameters = ["VALUE1_ONE", "VALUE2_ONE"];
    var resultsFile = "abc {VALUE1_ONE} def";
    var incrementalValue = 1;

    simple.mock(utils, 'getMatchingPositionBasedValue').returnWith(undefined);

    var res = utils.replaceValues(genObj, dataRow, parameters, resultsFile, incrementalValue);
    expect(res).to.equal('abc four def');

  });

});

describe('unit tests for checkTagsMatch function in generator', function () {
  it('should test for checkTagsMatch for true match', function () {
    var tagsToMatch = "ALL,DEFAULT,NO_DDA,NO_CDA,NO_PCA,NO_OLL,NO_ILS,OTHER,DNO_OLL";
    var tag = 'DEFAULT';
    var contents = utils.checkTagsMatch(tagsToMatch, tag);
    expect(contents).to.equal(true);
  });

  it('should test for checkTagsMatch for no match', function () {
    var tagsToMatch = "ALL,DEFAULT,NO_DDA,NO_CDA,NO_PCA,NO_OLL,NO_ILS,OTHER,DNO_OLL";
    var tag = 'APPLE';
    var contents = utils.checkTagsMatch(tagsToMatch, tag);
    expect(contents).to.equal(false);
  });

  it('should test for checkTagsMatch if tagsToMatch is empty', function () {
    var tagsToMatch = "";
    var tag = 'APPLE';
    var contents = utils.checkTagsMatch(tagsToMatch, tag);
    expect(contents).to.equal(false);
  });

  it('should test for checkTagsMatch if tagsToMatch does not exist', function () {
    var tag = 'APPLE';
    var contents = utils.checkTagsMatch(undefined, tag);
    expect(contents).to.equal(false);
  });

});

describe('unit tests for getFilteredSet function in generator', function () {

  it('should test for getFilteredSet for true match', function () {
    var filteredSetData = [{
      "VALUE1_ONE": "four",
      "VALUE1_TWO": "two",
      "VALUE2_THREE": "one",
      "VALUE2_TWO": "three"
    }, {
      "VALUE1_ONE": "four",
      "VALUE1_TWO": "two",
      "VALUE2_ONE": "one",
      "VALUE2_TWO": "three"
    }];

    var filteredSetTagColumn = "VALUE2_THREE";
    var tagsToMatch = "four,two,one,three";
    simple.mock(utils, 'checkTagsMatch').returnWith(true);
    var contents = utils.getFilteredSet(filteredSetData, filteredSetTagColumn, tagsToMatch);
    var exp = {
      "VALUE1_ONE": "four",
      "VALUE1_TWO": "two",
      "VALUE2_THREE": "one",
      "VALUE2_TWO": "three"
    };
    expect(contents[0]).to.contain(exp);
  });
});

describe('unit tests for getMatchingFilteredSet function in generator', function () {

  var genObj = {
    "profileName": "test-profile",
    "sheetName": "Sheet 1",
    "templates": [
      {
        "name": "default",
        "path": "data/template/",
        "fileName": "qasSearch.xml"
      }
    ],
    "filteredSection": {
      "sectionSheetName": "Sheet 2",
      "sectionSheetTagColumn": "VALUE1_ONE",
      "columnMappings": [
        {
          "fromSheetName": "Sheet 2",
          "fromSheetColumn": "VALUE1_ONE",
          "toSheetName": "Sheet 1",
          "toSheetColumn": "VALUE1_ONE"
        }
      ],
      "templates": [
        {
          "name": "default",
          "path": "data/template/",
          "fileName": "qasSearch_picklistEntryItem.xml",
          "replacementParamName": "{REPLACE_VALUE}"
        }
      ]
    }
  };

  var workbook = {
    "SheetNames": ["Sheet 1", "Sheet 2"],
    "Sheets": [{
      "Sheet 1": [{
        "A1": {"a": "value"}
      }, {
        "B2": {"b": "value"}
      }],
      "Sheet 2": [{
        "A1": {"a": "value"}
      }, {
        "B2": {"b": "value"}
      }]
    }]
  };
  var filteredSetWorkSheet = 'Sheet 2';
  var filteredSetConfigObj = {
    "sectionSheetName": "Sheet 2",
    "sectionSheetTagColumn": "VALUE1_ONE",
    "columnMappings": [
      {
        "fromSheetName": "Sheet 2",
        "fromSheetColumn": "VALUE1_ONE",
        "toSheetName": "Sheet 1",
        "toSheetColumn": "VALUE1_ONE"
      }
    ],
    "templates": [
      {
        "name": "default",
        "path": "data/template/",
        "fileName": "qasSearch_picklistEntryItem.xml",
        "replacementParamName": "{REPLACE_VALUE}"
      }
    ]
  };
  var dataRow = [{
    "VALUE1_ONE": "four",
    "VALUE1_TWO": "two",
    "VALUE2_THREE": "one",
    "VALUE2_TWO": "three"
  }, {
    "VALUE1_ONE": "four",
    "VALUE1_TWO": "two",
    "VALUE2_ONE": "one",
    "VALUE2_TWO": "three"
  }];
  var resultsFile = 'abc {REPLACE_VALUE} def';

  var filteredSetData = [{
    "VALUE1_ONE": "four",
    "VALUE1_TWO": "two",
    "VALUE2_THREE": "one",
    "VALUE2_TWO": "three"
  }, {
    "VALUE1_ONE": "four",
    "VALUE1_TWO": "two",
    "VALUE2_ONE": "one",
    "VALUE2_TWO": "three"
  }];

  it('should test for getMatchingFilteredSet returns match', function () {

    simple.mock(utils, 'readContentsOfWorksheet').returnWith(['{"VALUE1_ONE": "four"}{"VALUE1_TWO": "two"}{"VALUE2_THREE": "one"}{"VALUE1_TWO": "VALUE2_TWO": "three}', '{"VALUE1_ONE": "four"}{"VALUE1_TWO": "two"}{"VALUE2_THREE": "one"}{"VALUE1_TWO": "VALUE2_TWO": "three}']);
    simple.mock(utils, 'getFilteredSet').returnWith(filteredSetData);
    simple.mock(utils, 'getNamedTemplate').returnWith({
      "name": "default",
      "path": "data/template/",
      "fileName": "qasSearch_picklistEntryItem.xml",
      "replacementParamName": "{REPLACE_VALUE}"
    });
    simple.mock(utils, 'replaceValues').returnWith('abc test def');
    simple.mock(utils, 'readFile').returnWith('aa bb cc dd');

    var res = utils.getMatchingFilteredSet(genObj, workbook, filteredSetWorkSheet, filteredSetConfigObj, dataRow, resultsFile);
    expect(res).to.equal('abc abc test defabc test def def');
  });

  it('should test for getMatchingFilteredSet for mapping to the same sheet', function () {

    filteredSetConfigObj = {
      "sectionSheetName": "Sheet 2",
      "sectionSheetTagColumn": "VALUE1_ONE",
      "columnMappings": [
        {
          "fromSheetName": "Sheet 2",
          "fromSheetColumn": "VALUE1_ONE",
          "toSheetName": "Sheet 2",
          "toSheetColumn": "VALUE1_TWO"
        }
      ],
      "templates": [
        {
          "name": "default",
          "path": "data/template/",
          "fileName": "qasSearch_picklistEntryItem.xml",
          "replacementParamName": "{REPLACE_VALUE}"
        }
      ]
    };

    simple.mock(utils, 'readContentsOfWorksheet').returnWith(['{"VALUE1_ONE": "four"}{"VALUE1_TWO": "two"}{"VALUE2_THREE": "one"}{"VALUE1_TWO": "VALUE2_TWO": "three}', '{"VALUE1_ONE": "four"}{"VALUE1_TWO": "two"}{"VALUE2_THREE": "one"}{"VALUE1_TWO": "VALUE2_TWO": "three}']);
    simple.mock(utils, 'getFilteredSet').returnWith(filteredSetData);
    simple.mock(utils, 'getNamedTemplate').returnWith({
      "name": "default",
      "path": "data/template/",
      "fileName": "qasSearch_picklistEntryItem.xml",
      "replacementParamName": "{REPLACE_VALUE}"
    });
    simple.mock(utils, 'replaceValues').returnWith('abc test def');
    simple.mock(utils, 'readFile').returnWith('aa bb cc dd');

    var res = utils.getMatchingFilteredSet(genObj, workbook, filteredSetWorkSheet, filteredSetConfigObj, dataRow, resultsFile);
    expect(res).to.equal('abc abc test defabc test def def');
  });

  it('should test for getMatchingFilteredSet for json file', function () {

    filteredSetConfigObj = {
      "sectionSheetName": "Sheet 2",
      "sectionSheetTagColumn": "VALUE1_ONE",
      "columnMappings": [
        {
          "fromSheetName": "Sheet 2",
          "fromSheetColumn": "VALUE1_ONE",
          "toSheetName": "Sheet 2",
          "toSheetColumn": "VALUE1_TWO"
        }
      ],
      "templates": [
        {
          "name": "default",
          "path": "data/template/",
          "fileName": "template.json",
          "replacementParamName": "{REPLACE_VALUE}"
        }
      ]
    };

    simple.mock(utils, 'readContentsOfWorksheet').returnWith(['{"VALUE1_ONE": "four"}{"VALUE1_TWO": "two"}{"VALUE2_THREE": "one"}{"VALUE1_TWO": "VALUE2_TWO": "three}', '{"VALUE1_ONE": "four"}{"VALUE1_TWO": "two"}{"VALUE2_THREE": "one"}{"VALUE1_TWO": "VALUE2_TWO": "three}']);
    simple.mock(utils, 'getFilteredSet').returnWith(filteredSetData);
    simple.mock(utils, 'getNamedTemplate').returnWith({
      "name": "default",
      "path": "data/template/",
      "fileName": "template.json",
      "replacementParamName": "{REPLACE_VALUE}"
    });
    simple.mock(utils, 'replaceValues').returnWith('abc test def');
    simple.mock(utils, 'readFile').returnWith('aa bb cc dd');

    var res = utils.getMatchingFilteredSet(genObj, workbook, filteredSetWorkSheet, filteredSetConfigObj, dataRow, resultsFile);
    expect(res).to.equal('abc abc test def,abc test def def');
  });

  it('should test for getMatchingFilteredSet with multiple column mappings', function () {

    filteredSetConfigObj = {
      "sectionSheetName": "Sheet 2",
      "sectionSheetTagColumn": "VALUE1_ONE",
      "columnMappings": [
        {
          "fromSheetName": "Sheet 2",
          "fromSheetColumn": "VALUE1_ONE",
          "toSheetName": "Sheet 2",
          "toSheetColumn": "VALUE1_TWO"
        },
        {
          "fromSheetName": "Sheet 2",
          "fromSheetColumn": "VALUE1_TWO",
          "toSheetName": "Sheet 2",
          "toSheetColumn": "VALUE2_THREE"
        }
      ],
      "templates": [
        {
          "name": "default",
          "path": "data/template/",
          "fileName": "template.json",
          "replacementParamName": "{REPLACE_VALUE}"
        }
      ]
    };

    simple.mock(utils, 'readContentsOfWorksheet').returnWith(['{"VALUE1_ONE": "four"}{"VALUE1_TWO": "two"}{"VALUE2_THREE": "one"}{"VALUE1_TWO": "VALUE2_TWO": "three}', '{"VALUE1_ONE": "four"}{"VALUE1_TWO": "two"}{"VALUE2_THREE": "one"}{"VALUE1_TWO": "VALUE2_TWO": "three}']);
    simple.mock(utils, 'getFilteredSet').returnWith(filteredSetData);
    simple.mock(utils, 'getNamedTemplate').returnWith({
      "name": "default",
      "path": "data/template/",
      "fileName": "template.json",
      "replacementParamName": "{REPLACE_VALUE}"
    });
    simple.mock(utils, 'replaceValues').returnWith('abc test def');
    simple.mock(utils, 'readFile').returnWith('aa bb cc dd');

    var res = utils.getMatchingFilteredSet(genObj, workbook, filteredSetWorkSheet, filteredSetConfigObj, dataRow, resultsFile);
    expect(res).to.equal('abc abc test def,abc test def def');
  });

  it('should test for getMatchingFilteredSet to get filterSet from file', function () {

    genObj = {
      "profileName": "test-profile",
      "sheetName": "Sheet 1",
      "templates": [
        {
          "name": "default",
          "path": "data/template/",
          "fileName": "qasSearch.xml"
        }
      ],
      "filteredSection": {
        "sectionSheetName": "Sheet 2",
        "sectionSheetTagColumn": "VALUE1_ONE",
        "primarySheetTagColumn": "VALUE1_ONE",
        "templateFromFile": {
          "templateInputFolder": "output/cap-profile-acc/",
          "templateFileNameFormat": "CAP-ACC-{ACCOUNT_NUMBER}.xml",
          "templateFileParamName": "{ACCOUNT_NUMBER}",
          "templateFileParamColumn": "ACCOUNT_NUMBER",
          "replacementParamName": "{REPLACE_VALUE}"
        }
      }
    };

    filteredSetConfigObj = {
      "sectionSheetName": "Sheet 2",
      "sectionSheetTagColumn": "VALUE1_ONE",
      "primarySheetTagColumn": "VALUE1_ONE",
      "templateFromFile": {
        "templateInputFolder": "output/cap-profile-acc/",
        "templateFileNameFormat": "CAP-ACC-{ACCOUNT_NUMBER}.xml",
        "templateFileParamName": "{ACCOUNT_NUMBER}",
        "templateFileParamColumn": "ACCOUNT_NUMBER",
        "replacementParamName": "{REPLACE_VALUE}"
      }
    };

    simple.mock(utils, 'readContentsOfWorksheet').returnWith(['{"VALUE1_ONE": "four"}{"VALUE1_TWO": "two"}{"VALUE2_THREE": "one"}{"VALUE1_TWO": "VALUE2_TWO": "three}', '{"VALUE1_ONE": "four"}{"VALUE1_TWO": "two"}{"VALUE2_THREE": "one"}{"VALUE1_TWO": "VALUE2_TWO": "three}']);
    simple.mock(utils, 'getFilteredSet').returnWith(filteredSetData);
    simple.mock(utils, 'getNamedTemplate').returnWith({
      "name": "default",
      "path": "data/template/",
      "fileName": "template.xml",
      "replacementParamName": "{REPLACE_VALUE}"
    });
    simple.mock(utils, 'replaceValues').returnWith('abc test def');
    simple.mock(utils, 'readFile').returnWith('aa bb cc dd');

    var res = utils.getMatchingFilteredSet(genObj, workbook, filteredSetWorkSheet, filteredSetConfigObj, dataRow, resultsFile);
    expect(res).to.equal('abc aa bb cc ddaa bb cc dd def');
  });

  it('should test for getMatchingFilteredSet where getFilteredSet returned undefined', function () {

    filteredSetConfigObj = {
      "sectionSheetName": "Sheet 2",
      "sectionSheetTagColumn": "VALUE1_ONE",
      "columnMappings": [
        {
          "fromSheetName": "Sheet 2",
          "fromSheetColumn": "VALUE1_ONE",
          "toSheetName": "Sheet 2",
          "toSheetColumn": "VALUE1_TWO"
        }
      ],
      "templates": [
        {
          "name": "default",
          "path": "data/template/",
          "fileName": "template.json",
          "replacementParamName": "{REPLACE_VALUE}"
        }
      ]
    };

    simple.mock(utils, 'readContentsOfWorksheet').returnWith(['{"VALUE1_ONE": "four"}{"VALUE1_TWO": "two"}{"VALUE2_THREE": "one"}{"VALUE1_TWO": "VALUE2_TWO": "three}', '{"VALUE1_ONE": "four"}{"VALUE1_TWO": "two"}{"VALUE2_THREE": "one"}{"VALUE1_TWO": "VALUE2_TWO": "three}']);
    simple.mock(utils, 'getFilteredSet').returnWith(undefined);
    simple.mock(utils, 'getNamedTemplate').returnWith({
      "name": "default",
      "path": "data/template/",
      "fileName": "template.json",
      "replacementParamName": "{REPLACE_VALUE}"
    });
    simple.mock(utils, 'replaceValues').returnWith('abc test def');
    simple.mock(utils, 'readFile').returnWith('aa bb cc dd');

    var res = utils.getMatchingFilteredSet(genObj, workbook, filteredSetWorkSheet, filteredSetConfigObj, dataRow, resultsFile);
    expect(res).to.equal('abc  def');
  });

  it('should test for getMatchingFilteredSet does not have matching filteredSection property - templateFromFile', function () {

    genObj = {
      "profileName": "test-profile",
      "sheetName": "Sheet 1",
      "templates": [
        {
          "name": "default",
          "path": "data/template/",
          "fileName": "qasSearch.xml"
        }
      ],
      "filteredSection": {
        "sectionSheetName": "Sheet 2",
        "sectionSheetTagColumn": "VALUE1_ONE",
        "primarySheetTagColumn": "VALUE1_ONE",
        "templateFromFiles": {
          "templateInputFolder": "output/cap-profile-acc/",
          "templateFileNameFormat": "CAP-ACC-{ACCOUNT_NUMBER}.xml",
          "templateFileParamName": "{ACCOUNT_NUMBER}",
          "templateFileParamColumn": "ACCOUNT_NUMBER",
          "replacementParamName": "{REPLACE_VALUE}"
        }
      }
    };

    filteredSetConfigObj = {
      "sectionSheetName": "Sheet 2",
      "sectionSheetTagColumn": "VALUE1_ONE",
      "primarySheetTagColumn": "VALUE1_ONE",
      "templateFromFiles": {
        "templateInputFolder": "output/cap-profile-acc/",
        "templateFileNameFormat": "CAP-ACC-{ACCOUNT_NUMBER}.xml",
        "templateFileParamName": "{ACCOUNT_NUMBER}",
        "templateFileParamColumn": "ACCOUNT_NUMBER",
        "replacementParamName": "{REPLACE_VALUE}"
      }
    };

    simple.mock(utils, 'readContentsOfWorksheet').returnWith(['{"VALUE1_ONE": "four"}{"VALUE1_TWO": "two"}{"VALUE2_THREE": "one"}{"VALUE1_TWO": "VALUE2_TWO": "three}', '{"VALUE1_ONE": "four"}{"VALUE1_TWO": "two"}{"VALUE2_THREE": "one"}{"VALUE1_TWO": "VALUE2_TWO": "three}']);
    simple.mock(utils, 'getFilteredSet').returnWith(filteredSetData);
    simple.mock(utils, 'getNamedTemplate').returnWith({
      "name": "default",
      "path": "data/template/",
      "fileName": "template.xml",
      "replacementParamName": "{REPLACE_VALUE}"
    });
    simple.mock(utils, 'replaceValues').returnWith('abc test def');
    simple.mock(utils, 'readFile').returnWith('aa bb cc dd');
    var spy = simple.spy(utils, 'getMatchingFilteredSet');

    expect(spy.lastCall.threw, Error);
  });

});

describe('unit tests for getMatchingPositionBasedValue function in generator', function () {

  it('should test for getMatchingPositionBasedValue for position', function () {
    var positionObject = [
      {
        "paramName": "{RELATIONSHIP_MANAGER_NAME}",
        "paramLength": 40,
        "padding": {
          "padWith": " ",
          "leadingWith": false
        }
      },
      {
        "paramName": "{RELATIONSHIP_MANAGER_PHONE}",
        "paramLength": 12,
        "padding": {
          "padWith": " ",
          "leadingWith": false
        }
      }];
    var param = '{RELATIONSHIP_MANAGER_NAME}';
    var contents = utils.getMatchingPositionBasedValue(positionObject, param);
    var expResult = {
      "paramName": "{RELATIONSHIP_MANAGER_NAME}",
      "paramLength": 40,
      "padding": {
        "padWith": " ",
        "leadingWith": false
      }
    };
    expect(contents).to.contain(expResult);
  });

  it('should test for getMatchingPositionBasedValue for no match', function () {
    var positionObject = [
      {
        "paramName": "{RELATIONSHIP_MANAGER_NAME}",
        "paramLength": 40,
        "padding": {
          "padWith": " ",
          "leadingWith": false
        }
      },
      {
        "paramName": "{RELATIONSHIP_MANAGER_PHONE}",
        "paramLength": 12,
        "padding": {
          "padWith": " ",
          "leadingWith": false
        }
      }];
    var param = '{RELATIONSHIP}';
    var contents = utils.getMatchingPositionBasedValue(positionObject, param);
    expect(contents[0]).to.equal(undefined);
  });

});

describe('unit tests for checkAllTemplateConditionalValues function in generator', function () {
  it('should test for checkAllTemplateConditionalValues with templatedUsed, so ignore conditions', function () {
    var templateUsed = true;
    var dataRow = {"ACCOUNT_TYPE": 'DDA', "STATUS_CODE": "4", "VALUE2_TWO": "three"};
    var templateConditions = [{
      "columnName": "ACCOUNT_TYPE",
      "conditionalValue": "=",
      "columnValue": "DDA"
    }];

    simple.mock(utils, 'checkTemplateConditionalValue').returnWith(true);
    var contents = utils.checkAllTemplateConditionalValues(dataRow, templateConditions, templateUsed);
    expect(contents).to.equal(false);
  });

  it('should test for checkAllTemplateConditionalValues without templatedUsed so check for singular condition', function () {
    var templateUsed = false;
    var dataRow = {"ACCOUNT_TYPE": 'DDA', "STATUS_CODE": "4", "VALUE2_TWO": "three"};
    var templateConditions = [{
      "columnName": "ACCOUNT_TYPE",
      "conditionalValue": "=",
      "columnValue": "DDA"
    }];

    simple.mock(utils, 'checkTemplateConditionalValue').returnWith(true);
    var contents = utils.checkAllTemplateConditionalValues(dataRow, templateConditions, templateUsed);
    expect(contents).to.equal(true);
  });

  it('should test for checkAllTemplateConditionalValues without templatedUsed so check for singular condition', function () {
    var templateUsed = false;
    var dataRow = {"ACCOUNT_TYPE": 'DDA', "STATUS_CODE": "4", "VALUE2_TWO": "three"};
    var templateConditions = [{
      "columnName": "ACCOUNT_TYPE",
      "conditionalValue": "!=",
      "columnValue": "DDA"
    }];

    simple.mock(utils, 'checkTemplateConditionalValue').returnWith(false);
    var contents = utils.checkAllTemplateConditionalValues(dataRow, templateConditions, templateUsed);
    expect(contents).to.equal(false);
  });

  it('should test for checkAllTemplateConditionalValues without templatedUsed so check for multiiple condition', function () {
    var templateUsed = false;
    var dataRow = {"ACCOUNT_TYPE": 'DDA', "STATUS_CODE": "4", "VALUE2_TWO": "three"};
    var templateConditions = [
      {
        "columnName": "ACCOUNT_TYPE",
        "conditionalValue": "=",
        "columnValue": "DDA"
      }, {
        "columnName": "STATUS_CODE",
        "conditionalValue": "=",
        "columnValue": "4"
      }
    ];

    simple.mock(utils, 'checkTemplateConditionalValue').returnWith(true);
    var contents = utils.checkAllTemplateConditionalValues(dataRow, templateConditions, templateUsed);
    expect(contents).to.equal(true);
  });

  it('should test for checkAllTemplateConditionalValues without templatedUsed so check for multiiple condition', function () {
    var templateUsed = false;
    var dataRow = {"ACCOUNT_TYPE": 'DDA', "STATUS_CODE": "4", "VALUE2_TWO": "three"};
    var templateConditions = [
      {
        "columnName": "ACCOUNT_TYPE",
        "conditionalValue": "!=",
        "columnValue": "DDA"
      }, {
        "columnName": "STATUS_CODE",
        "conditionalValue": "=",
        "columnValue": "2"
      }
    ];

    simple.mock(utils, 'checkTemplateConditionalValue').returnWith(false);
    var contents = utils.checkAllTemplateConditionalValues(dataRow, templateConditions, templateUsed);
    expect(contents).to.equal(false);
  });
});

describe('unit tests for checkTemplateConditionalValue function in generator', function () {
  it('should test for checkTemplateConditionalValue for =', function () {
    var dataRowValue = "4";
    var templateCondition = {
      "columnName": "ACCOUNT_TYPE",
      "conditionalValue": "=",
      "columnValue": "DDA"
    };
    var contents = utils.checkTemplateConditionalValue(dataRowValue, templateCondition);
    expect(contents).to.equal(false);
  });

  it('should test for checkTemplateConditionalValue for !=', function () {
    var dataRowValue = "4";
    var templateCondition = {
      "columnName": "STATUS_CODE",
      "conditionalValue": "!=",
      "columnValue": "0"
    };
    var contents = utils.checkTemplateConditionalValue(dataRowValue, templateCondition);
    expect(contents).to.equal(true);
  });

  it('should test for checkTemplateConditionalValue for <', function () {
    var dataRowValue = "4";
    var templateCondition = {
      "columnName": "STATUS_CODE",
      "conditionalValue": "<",
      "columnValue": "6"
    };
    var contents = utils.checkTemplateConditionalValue(dataRowValue, templateCondition);
    expect(contents).to.equal(true);
  });

  it('should test for checkTemplateConditionalValue for >', function () {
    var dataRowValue = "4";
    var templateCondition = {
      "columnName": "STATUS_CODE",
      "conditionalValue": ">",
      "columnValue": "6"
    };
    var contents = utils.checkTemplateConditionalValue(dataRowValue, templateCondition);
    expect(contents).to.equal(false);
  });

  it('should test for checkTemplateConditionalValue for <=', function () {
    var dataRowValue = "5";
    var templateCondition = {
      "columnName": "STATUS_CODE",
      "conditionalValue": "<=",
      "columnValue": "6"
    };
    var contents = utils.checkTemplateConditionalValue(dataRowValue, templateCondition);
    expect(contents).to.equal(true);
  });

  it('should test for checkTemplateConditionalValue for >=', function () {
    var dataRowValue = "8";
    var templateCondition = {
      "columnName": "STATUS_CODE",
      "conditionalValue": ">=",
      "columnValue": "6"
    };
    var contents = utils.checkTemplateConditionalValue(dataRowValue, templateCondition);
    expect(contents).to.equal(true);
  });

  it('should test for checkTemplateConditionalValue for %EMPTY% columnValue', function () {
    var dataRowValue = "8";
    var templateCondition = {
      "columnName": "STATUS_CODE",
      "conditionalValue": "!=",
      "columnValue": "%EMPTY%"
    };
    var contents = utils.checkTemplateConditionalValue(dataRowValue, templateCondition);
    expect(contents).to.equal(true);
  });

  it('should test for checkTemplateConditionalValue for undefined', function () {
    var dataRowValue = undefined;
    var templateCondition = {
      "columnName": "STATUS_CODE",
      "conditionalValue": "<",
      "columnValue": "6"
    };
    var contents = utils.checkTemplateConditionalValue(dataRowValue, templateCondition);
    expect(contents).to.equal(true);
  });

  it('should test for checkTemplateConditionalValue for no match', function () {
    var dataRowValue = undefined;
    var templateCondition = {
      "columnName": "STATUS_CODE",
      "conditionalValue": "$",
      "columnValue": "6"
    };
    var contents = utils.checkTemplateConditionalValue(dataRowValue, templateCondition);
    expect(contents).to.equal(false);
  });
});

describe('unit tests for useOtherTemplate function in generator', function () {
  it('should test data useOtherTemplate for %None%', function () {
    var genObj = {
      "profileName": "test-profile",
      "sheetName": "Sheet 1",
      "templates": [
        {
          "name": "default",
          "path": "data/template/",
          "fileName": "qasSearch.xml"
        }
      ],
      "filteredSection": {
        "sectionSheetName": "Sheet 2",
        "sectionSheetTagColumn": "VALUE1_ONE",
        "columnMappings": [
          {
            "fromSheetName": "Sheet 2",
            "fromSheetColumn": "VALUE1_ONE",
            "toSheetName": "Sheet 1",
            "toSheetColumn": "VALUE1_ONE"
          }
        ],
        "templates": [
          {
            "name": "default",
            "path": "data/template/",
            "fileName": "qasSearch_picklistEntryItem.xml",
            "replacementParamName": "{REPLACE_VALUE}"
          }
        ]
      }
    };
    var dataRow = {"VALUE1_ONE": "four", "VALUE1_TWO": "two", "VALUE2_ONE": 'one', "VALUE2_TWO": "three"};
    var otherTemplate = {
      "path": "data/template/",
      "fileName": "%NONE%"
    };
    simple.mock(utils, 'readFile').returnWith('');
    var contents = utils.useOtherTemplate(genObj, otherTemplate, dataRow);
    expect(contents).to.equal('%NONE%');
  });

  it('should test data useOtherTemplate for pathFile', function () {
    var genObj = {
      "profileName": "test-profile",
      "sheetName": "Sheet 1",
      "templates": [
        {
          "name": "default",
          "path": "data/template/",
          "fileName": "qasSearch.xml"
        }
      ],
      "filteredSection": {
        "sectionSheetName": "Sheet 2",
        "sectionSheetTagColumn": "VALUE1_ONE",
        "columnMappings": [
          {
            "fromSheetName": "Sheet 2",
            "fromSheetColumn": "VALUE1_ONE",
            "toSheetName": "Sheet 1",
            "toSheetColumn": "VALUE1_ONE"
          }
        ],
        "templates": [
          {
            "name": "default",
            "path": "data/template/",
            "fileName": "qasSearch_picklistEntryItem.xml",
            "replacementParamName": "{REPLACE_VALUE}"
          }
        ]
      }
    };
    var dataRow = {"VALUE1_ONE": "four", "VALUE1_TWO": "two", "VALUE2_ONE": 'one', "VALUE2_TWO": "three"};
    var otherTemplate = {
      "path": "data/template/",
      "fileName": "qasSearch.xml"
    };
    simple.mock(utils, 'readFile').returnWith('abc');
    simple.mock(utils, 'getParameters').returnWith(['a', 'd']);
    simple.mock(utils, 'replaceValues').returnWith('x');
    var contents = utils.useOtherTemplate(genObj, otherTemplate, dataRow);
    expect(contents).to.equal('x');
  });

  it('should test data useOtherTemplate for pathFile for parameters length < 0', function () {
    var genObj = {
      "profileName": "test-profile",
      "sheetName": "Sheet 1",
      "templates": [
        {
          "name": "default",
          "path": "data/template/",
          "fileName": "qasSearch.xml"
        }
      ],
      "filteredSection": {
        "sectionSheetName": "Sheet 2",
        "sectionSheetTagColumn": "VALUE1_ONE",
        "columnMappings": [
          {
            "fromSheetName": "Sheet 2",
            "fromSheetColumn": "VALUE1_ONE",
            "toSheetName": "Sheet 1",
            "toSheetColumn": "VALUE1_ONE"
          }
        ],
        "templates": [
          {
            "name": "default",
            "path": "data/template/",
            "fileName": "qasSearch_picklistEntryItem.xml",
            "replacementParamName": "{REPLACE_VALUE}"
          }
        ]
      }
    };
    var dataRow = {"VALUE1_ONE": "four", "VALUE1_TWO": "two", "VALUE2_ONE": 'one', "VALUE2_TWO": "three"};
    var otherTemplate = {
      "path": "data/template/",
      "fileName": "qasSearch.xml"
    };
    simple.mock(utils, 'readFile').returnWith('abc');
    simple.mock(utils, 'getParameters').returnWith([]);
    simple.mock(utils, 'replaceValues').returnWith('x');
    var contents = utils.useOtherTemplate(genObj, otherTemplate, dataRow);
    expect(contents).to.equal('abc');
  });
});

describe('unit tests for generateSimulatorConfig function in generator', function () {
  it('should test data useOtherTemplate for %None%', function () {
    var simObj = {
      "simulatorConfigOutput": "output/00Simulator/",
      "simulatorFilename": "00-sim-aocm-retrieve-all-clg",
      "simulatorConfigTemplatePath": "data/template/",
      "simulatorConfigTemplate": "SIM_AOCM_RetrieveAllClg.xml",
      "simulatorConfigFilenameParam": "{FILE_NAME}"
    };
    var dataRow = {"VALUE1_ONE": "four", "VALUE1_TWO": "two", "VALUE2_ONE": 'one', "VALUE2_TWO": "three"};
    var simTemplate = 'xzzz';
    var simParameters = ["VALUE1_ONE", "VALUE2_ONE"];
    var simFile = "abc {VALUE1_ONE} def";
    simple.mock(utils, 'replaceValues').returnWith('aav'); //doesn't return array, just a string
    var contents = utils.generateSimulatorConfig(dataRow, simObj, simTemplate, simParameters, simFile);
    expect(contents).to.equal('aav');
  });
});

describe('unit tests for generateAdditionalSimulatorConfig function in generator', function () {
  it('should test for generateAdditionalSimulatorConfig with additional sim config', function () {

    var dataRow = {"ACCOUNT_TYPE": 'DDA', "STATUS_CODE": "4", "VALUE2_TWO": "three"};
    var additionalSimObj = [{
      "name": "additional simulator config name",
      "simulatorConfigTemplatePath": "data/template/",
      "simulatorConfigTemplate": "SIM_ADDITIONAL_CONFIG_FILE.xml",
      "simulatorConfigFilenameParam": "{FILE_NAME}",
      "condition": [
        {
          "columnName": "ACCOUNT_TYPE",
          "conditionalValue": "!=",
          "columnValue": "%EMPTY%",
          "format": "%NO SPACES%"
        }
      ]
    }];

    simple.mock(utils, 'checkTemplateConditionalValue').returnWith(true);
    simple.mock(utils, 'readFile').returnWith('abc def');
    simple.mock(utils, 'getParameters').returnWith(['a', 'b']);
    simple.mock(utils, 'removeSpacesFromString').returnWith('abc');
    simple.mock(utils, 'replaceValues').returnWith('abc def ghi');
    var contents = utils.generateAdditionalSimulatorConfig(dataRow, additionalSimObj);
    expect(contents).to.equal('abc def ghi');
  });

  it('should test for generateAdditionalSimulatorConfig with additional sim config and condition with no format option', function () {

    var dataRow = {"ACCOUNT_TYPE": 'DDA', "STATUS_CODE": "4", "VALUE2_TWO": "three"};
    var additionalSimObj = [{
      "name": "additional simulator config name",
      "simulatorConfigTemplatePath": "data/template/",
      "simulatorConfigTemplate": "SIM_ADDITIONAL_CONFIG_FILE.xml",
      "simulatorConfigFilenameParam": "{FILE_NAME}",
      "condition": [
        {
          "columnName": "ACCOUNT_TYPE",
          "conditionalValue": "!=",
          "columnValue": "%EMPTY%"
        }
      ]
    }];

    simple.mock(utils, 'checkTemplateConditionalValue').returnWith(false);
    simple.mock(utils, 'readFile').returnWith('abc def');
    simple.mock(utils, 'getParameters').returnWith(['a', 'b']);
    simple.mock(utils, 'removeSpacesFromString').returnWith('abc');
    simple.mock(utils, 'replaceValues').returnWith('abc def ghi');
    var contents = utils.generateAdditionalSimulatorConfig(dataRow, additionalSimObj);
    expect(contents).to.equal('');
  });

  it('should test for generateAdditionalSimulatorConfig with additional sim config and multiple conditions', function () {

    var dataRow = {"ACCOUNT_TYPE": 'DDA', "STATUS_CODE": "4", "VALUE2_TWO": "three"};
    var additionalSimObj = [{
      "name": "additional simulator config name",
      "simulatorConfigTemplatePath": "data/template/",
      "simulatorConfigTemplate": "SIM_ADDITIONAL_CONFIG_FILE.xml",
      "simulatorConfigFilenameParam": "{FILE_NAME}",
      "condition": [
        {
          "columnName": "ACCOUNT_TYPE",
          "conditionalValue": "!=",
          "columnValue": "%EMPTY%"
        },
        {
          "columnName": "STATUS_CODE",
          "conditionalValue": "!=",
          "columnValue": "200",
          "format": "%NO SPACES%"
        }
      ]
    }];

    simple.mock(utils, 'checkTemplateConditionalValue').returnWith(true);
    simple.mock(utils, 'readFile').returnWith('abc def');
    simple.mock(utils, 'getParameters').returnWith(['a', 'b']);
    simple.mock(utils, 'removeSpacesFromString').returnWith('abc');
    simple.mock(utils, 'replaceValues').returnWith('abc def ghi');
    var contents = utils.generateAdditionalSimulatorConfig(dataRow, additionalSimObj);
    expect(contents).to.equal('abc def ghiabc def ghi');
  });

  it('should test for generateAdditionalSimulatorConfig with additional sim config with no condition', function () {

    var dataRow = {"ACCOUNT_TYPE": 'DDA', "STATUS_CODE": "4", "VALUE2_TWO": "three"};
    var additionalSimObj = [{
      "name": "additional simulator config name",
      "simulatorConfigTemplatePath": "data/template/",
      "simulatorConfigTemplate": "SIM_ADDITIONAL_CONFIG_FILE.xml",
      "simulatorConfigFilenameParam": "{FILE_NAME}"
    }];

    simple.mock(utils, 'checkTemplateConditionalValue').returnWith(true);
    simple.mock(utils, 'readFile').returnWith('abc def');
    simple.mock(utils, 'getParameters').returnWith(['a', 'b']);
    simple.mock(utils, 'removeSpacesFromString').returnWith('abc');
    simple.mock(utils, 'replaceValues').returnWith('abc def ghi');
    var contents = utils.generateAdditionalSimulatorConfig(dataRow, additionalSimObj);
    expect(contents).to.equal('');
  });

  it('should test for generateAdditionalSimulatorConfig with columnName not matching', function () {

    var dataRow = {"ACCOUNT_TYPE": 'DDA', "STATUS_CODE": "4", "VALUE2_TWO": "three"};
    var additionalSimObj = [{
      "name": "additional simulator config name",
      "simulatorConfigTemplatePath": "data/template/",
      "simulatorConfigTemplate": "SIM_ADDITIONAL_CONFIG_FILE.xml",
      "simulatorConfigFilenameParam": "{FILE_NAME}",
      "condition": [
        {
          "columnName": "VALUE1_ONE",
          "conditionalValue": "!=",
          "columnValue": "%EMPTY%"
        }
      ]
    }];

    simple.mock(utils, 'checkTemplateConditionalValue').returnWith(true);
    simple.mock(utils, 'readFile').returnWith('abc def');
    simple.mock(utils, 'getParameters').returnWith(['a', 'b']);
    simple.mock(utils, 'removeSpacesFromString').returnWith('abc');
    simple.mock(utils, 'replaceValues').returnWith('abc def ghi');
    var contents = utils.generateAdditionalSimulatorConfig(dataRow, additionalSimObj);
    expect(contents).to.equal('');
  });

});

describe('unit tests for getDefaultTemplate function in generator', function () {
  it('should test for getDefaultTemplate', function () {

    var generatorObj = {
      "profileName": "test-profile",
      "sheetName": "Sheet 1",
      "templates": [
        {
          "name": "default",
          "path": "data/template/",
          "fileName": "qasSearch.xml"
        }
      ],
      "filteredSection": {
        "sectionSheetName": "Sheet 2",
        "sectionSheetTagColumn": "VALUE1_ONE",
        "columnMappings": [
          {
            "fromSheetName": "Sheet 2",
            "fromSheetColumn": "VALUE1_ONE",
            "toSheetName": "Sheet 1",
            "toSheetColumn": "VALUE1_ONE"
          }
        ],
        "templates": [
          {
            "name": "default",
            "path": "data/template/",
            "fileName": "qasSearch_picklistEntryItem.xml",
            "replacementParamName": "{REPLACE_VALUE}"
          }
        ]
      }
    };

    simple.mock(utils, 'getNamedTemplate').returnWith('Returned me this');
    var contents = utils.getDefaultTemplate(generatorObj);
    expect(contents).to.equal('Returned me this');
  });
});

describe('unit tests for getNamedTemplate function in generator', function () {
  it('should test for getNamedTemplate', function () {
    var templateName = 'abc';
    var generatorObj = {
      "templates": [
        {
          "name": "abc",
          "path": "data/template/",
          "fileName": "qasSearch.xml"
        }
      ]
    };

    simple.mock(utils, 'readFile').returnWith('abc');
    simple.mock(utils, 'getParameters').returnWith(['a', 'b']);
    var contents = utils.getNamedTemplate(generatorObj, templateName);
    expect(contents.template).to.equal('abc');
    expect(contents.parameters.length).to.equal(2);
    expect(contents.parameters[0]).to.equal('a');
    expect(contents.parameters[1]).to.equal('b');
  });

  it('should test for getNamedTemplate for default template', function () {
    simple.mock(utils, 'readFile').returnWith('abc');
    simple.mock(utils, 'getParameters').returnWith(['a', 'b']);
    assert.throws(utils.getNamedTemplate, Error, "Cannot read property 'templates' of undefined");
  });

  it('should test for getNamedTemplate for undefined template', function () {
    var templateName = 'abc';
    var generatorObj = {
      "peter": [
        {
          "name": "abc",
          "path": "data/template/",
          "fileName": "qasSearch.xml"
        }
      ]
    };
    simple.mock(utils, 'readFile').returnWith('abc');
    simple.mock(utils, 'getParameters').returnWith(['a', 'b']);
    var p = utils.getNamedTemplate(generatorObj, templateName);
    expect(p).to.equal(undefined);
  });

});

describe('unit tests for generateTemplateWithJSON function in generator', function () {

  it('should test for generateTemplateWithJSON for basic config', function () {

    var fileName = './data-files/test/data/config/basic.json';
    utils.generateTemplateWithJSON(fileName);

    var simFiles = utils.getFiles('data-files/test/data/output/00Simulator/', simFiles);
    var configFiles = utils.getFiles('data-files/test/data/output/sample/', configFiles);

    expect(fs.existsSync('data-files/test/data/output/00Simulator')).to.equal(true);
    expect(simFiles.length).to.equal(1);
    expect(fs.existsSync('data-files/test/data/output/00Simulator/00-sim-basic.xml')).to.equal(true);
    expect(configFiles.length).to.equal(2);
    expect(fs.existsSync('data-files/test/data/output/sample/BASIC-001.xml')).to.equal(true);
    expect(fs.existsSync('data-files/test/data/output/sample/BASIC-002.xml')).to.equal(true);

    var simFile = utils.readFile('test/data/output/00Simulator/00-sim-basic.xml');
    var simParams = utils.getParameters(simFile);
    expect(simParams.length).to.equal(0);

    var genFile = utils.readFile('test/data/output/sample/BASIC-001.xml');
    var genParams = utils.getParameters(genFile);
    expect(genParams.length).to.equal(0);
    expect(genFile).to.contain('<UNIQUE_ID>001</UNIQUE_ID>');
    expect(genFile).to.contain('<VALUE1>Value1</VALUE1>');
    expect(genFile).to.contain('<VALUE2>Value1</VALUE2>');
  });

  it('should test for generateTemplateWithJSON with no simulator config', function () {

    var fileName = './data-files/test/data/config/basic-no-simulator.json';
    utils.generateTemplateWithJSON(fileName);

    var configFiles = utils.getFiles('data-files/test/data/output/sample/', configFiles);

    expect(fs.existsSync('data-files/test/data/output/00Simulator')).to.equal(false);
    expect(configFiles.length).to.equal(3);
    expect(fs.existsSync('data-files/test/data/output/sample/BASIC-001.xml')).to.equal(true);
    expect(fs.existsSync('data-files/test/data/output/sample/BASIC-002.xml')).to.equal(true);
    expect(fs.existsSync('data-files/test/data/output/sample/BASIC-003.xml')).to.equal(true);

    var genFile = utils.readFile('test/data/output/sample/BASIC-001.xml');
    var genParams = utils.getParameters(genFile);
    expect(genParams.length).to.equal(0);
    expect(genFile).to.contain('<UNIQUE_ID>001</UNIQUE_ID>');
    expect(genFile).to.contain('<VALUE1>Value1</VALUE1>');
    expect(genFile).to.contain('<VALUE2>Value1</VALUE2>');

  });

  it('should test for generateTemplateWithJSON with no start and end rows', function () {

    var fileName = './data-files/test/data/config/basic-no-start-end-rows.json';
    utils.generateTemplateWithJSON(fileName);

    var configFiles = utils.getFiles('data-files/test/data/output/sample/', configFiles);

    expect(fs.existsSync('data-files/test/data/output/00Simulator')).to.equal(false);
    expect(configFiles.length).to.equal(3);
    expect(fs.existsSync('data-files/test/data/output/sample/BASIC-001.xml')).to.equal(true);
    expect(fs.existsSync('data-files/test/data/output/sample/BASIC-002.xml')).to.equal(true);
    expect(fs.existsSync('data-files/test/data/output/sample/BASIC-003.xml')).to.equal(true);

    var genFile = utils.readFile('test/data/output/sample/BASIC-001.xml');
    var genParams = utils.getParameters(genFile);
    expect(genParams.length).to.equal(0);
    expect(genFile).to.contain('<UNIQUE_ID>001</UNIQUE_ID>');
    expect(genFile).to.contain('<VALUE1>Value1</VALUE1>');
    expect(genFile).to.contain('<VALUE2>Value1</VALUE2>');

  });

  it('should test for generateTemplateWithJSON with multiple templates', function () {

    var fileName = './data-files/test/data/config/multi-template-with-conditions.json';
    utils.generateTemplateWithJSON(fileName);

    var configFiles = utils.getFiles('data-files/test/data/output/sample/', configFiles);

    expect(fs.existsSync('data-files/test/data/output/00Simulator')).to.equal(false);
    expect(configFiles.length).to.equal(2);
    expect(fs.existsSync('data-files/test/data/output/sample/BASIC-001.xml')).to.equal(true);
    expect(fs.existsSync('data-files/test/data/output/sample/BASIC-002.xml')).to.equal(false);
    expect(fs.existsSync('data-files/test/data/output/sample/BASIC-003.xml')).to.equal(true);

    var genFile = utils.readFile('test/data/output/sample/BASIC-001.xml');
    var genParams = utils.getParameters(genFile);
    expect(genParams.length).to.equal(0);
    expect(genFile).to.contain('<UNIQUE_ID>001</UNIQUE_ID>');
    expect(genFile).to.contain('<VALUE1>Value1</VALUE1>');
    expect(genFile).to.contain('<VALUE2>Value1</VALUE2>');

  });

  it('should test for generateTemplateWithJSON with filtered templates', function () {

    var fileName = './data-files/test/data/config/filtered-template.json';
    utils.generateTemplateWithJSON(fileName);

    var configFiles = utils.getFiles('data-files/test/data/output/sample/', configFiles);

    expect(fs.existsSync('data-files/test/data/output/00Simulator')).to.equal(true);
    expect(configFiles.length).to.equal(2);
    expect(fs.existsSync('data-files/test/data/output/sample/BASIC-001.xml')).to.equal(true);
    expect(fs.existsSync('data-files/test/data/output/sample/BASIC-002.xml')).to.equal(true);
    expect(fs.existsSync('data-files/test/data/output/sample/BASIC-003.xml')).to.equal(false);

    var genFile = utils.readFile('test/data/output/sample/BASIC-001.xml');
    var genParams = utils.getParameters(genFile);
    expect(genParams.length).to.equal(0);
    expect(genFile).to.contain('<UNIQUE_ID>001</UNIQUE_ID>');
    expect(genFile).to.contain('<VALUE1>Value1</VALUE1>');
    expect(genFile).to.contain('<VALUE2>Value1</VALUE2>');
    expect(genFile).to.contain('<FILTER-VALUE1>Matched1</FILTER-VALUE1>');
    expect(genFile).to.contain('<FILTER-VALUE2>001</FILTER-VALUE2>');

  });

  it('should test for generateTemplateWithJSON with mapped templates', function () {

    var fileName = './data-files/test/data/config/mapped-template.json';
    utils.generateTemplateWithJSON(fileName);

    var configFiles = utils.getFiles('data-files/test/data/output/sample/', configFiles);

    expect(fs.existsSync('data-files/test/data/output/00Simulator')).to.equal(true);
    expect(configFiles.length).to.equal(3);
    expect(fs.existsSync('data-files/test/data/output/sample/BASIC-001.xml')).to.equal(true);
    expect(fs.existsSync('data-files/test/data/output/sample/BASIC-002.xml')).to.equal(true);
    expect(fs.existsSync('data-files/test/data/output/sample/BASIC-003.xml')).to.equal(true);

    var genFile = utils.readFile('test/data/output/sample/BASIC-001.xml');
    var genParams = utils.getParameters(genFile);
    expect(genParams.length).to.equal(0);
    expect(genFile).to.contain('<UNIQUE_ID>001</UNIQUE_ID>');
    expect(genFile).to.contain('<VALUE1>Value1</VALUE1>');
    expect(genFile).to.contain('<VALUE2>Value1</VALUE2>');
    expect(genFile).to.contain('<MAP>\n        <MAP-VALUE1>Value1</MAP-VALUE1>\n        <MAP-VALUE2>Value1</MAP-VALUE2>\n        <MAP-VALUE3>Value1</MAP-VALUE3>\n    </MAP>\n\n</SampleRs>');

    var genFile2 = utils.readFile('test/data/output/sample/BASIC-002.xml');
    var genParams2 = utils.getParameters(genFile2);
    expect(genParams2.length).to.equal(0);
    expect(genFile2).to.contain('<UNIQUE_ID>002</UNIQUE_ID>');
    expect(genFile2).to.contain('<MAP>\n        <MAP-VALUE1>Value1</MAP-VALUE1>\n        <MAP-VALUE2>Value1</MAP-VALUE2>\n        <MAP-VALUE3></MAP-VALUE3>\n    </MAP>\n    <MAP>\n        <MAP-VALUE1>Value</MAP-VALUE1>\n        <MAP-VALUE2>Value</MAP-VALUE2>\n        <MAP-VALUE3>Value</MAP-VALUE3>\n    </MAP>\n\n</SampleRs>');

  });

  it('should test for generateTemplateWithJSON with other template', function () {

    var fileName = './data-files/test/data/config/basic-other-template.json';
    utils.generateTemplateWithJSON(fileName);

    var configFiles = utils.getFiles('data-files/test/data/output/sample/', configFiles);

    expect(fs.existsSync('data-files/test/data/output/00Simulator')).to.equal(false);
    expect(configFiles.length).to.equal(3);
    expect(fs.existsSync('data-files/test/data/output/sample/BASIC-001.xml')).to.equal(true);
    expect(fs.existsSync('data-files/test/data/output/sample/BASIC-002.xml')).to.equal(true);
    expect(fs.existsSync('data-files/test/data/output/sample/BASIC-003.xml')).to.equal(true);

    var genFile = utils.readFile('test/data/output/sample/BASIC-001.xml');
    var genParams = utils.getParameters(genFile);
    expect(genParams.length).to.equal(0);
    expect(genFile).to.contain('<UNIQUE_ID>001</UNIQUE_ID>');
    expect(genFile).to.contain('<ERROR_VALUE1>Value1</ERROR_VALUE1>');

    var genFile2 = utils.readFile('test/data/output/sample/BASIC-002.xml');
    var genParams2 = utils.getParameters(genFile2);
    expect(genParams2.length).to.equal(0);
    expect(genFile2).to.contain('<UNIQUE_ID>002</UNIQUE_ID>');
    expect(genFile2).to.contain('<VALUE1>Value1</VALUE1>');
    expect(genFile2).to.contain('<VALUE2>Value1</VALUE2>');

  });

  it('should test for generateTemplateWithJSON with simulator template with additional config', function () {

    var fileName = './data-files/test/data/config/basic-additional-simulator.json';
    utils.generateTemplateWithJSON(fileName);

    var configFiles = utils.getFiles('data-files/test/data/output/sample/', configFiles);

    expect(fs.existsSync('data-files/test/data/output/00Simulator')).to.equal(true);
    expect(configFiles.length).to.equal(2);
    expect(fs.existsSync('data-files/test/data/output/sample/BASIC-001.xml')).to.equal(true);
    expect(fs.existsSync('data-files/test/data/output/sample/BASIC-002.xml')).to.equal(true);
    expect(fs.existsSync('data-files/test/data/output/sample/BASIC-003.xml')).to.equal(false);

    var genFile2 = utils.readFile('test/data/output/sample/BASIC-002.xml');
    var genParams2 = utils.getParameters(genFile2);
    expect(genParams2.length).to.equal(0);
    expect(genFile2).to.contain('<UNIQUE_ID>002</UNIQUE_ID>');
    expect(genFile2).to.contain('<VALUE1>Value1</VALUE1>');
    expect(genFile2).to.contain('<VALUE2>Value1</VALUE2>');

  });

  it('should test for generateTemplateWithJSON with use existing filename set', function () {

    var fileName = './data-files/test/data/config/basic-use-existing-file.json';
    utils.generateTemplateWithJSON(fileName);

    var configFiles = utils.getFiles('data-files/test/data/output/sample/', configFiles);

    expect(fs.existsSync('data-files/test/data/output/00Simulator')).to.equal(true);
    expect(configFiles.length).to.equal(3);
    expect(fs.existsSync('data-files/test/data/output/sample/BASIC-001.xml')).to.equal(true);
    expect(fs.existsSync('data-files/test/data/output/sample/BASIC-002.xml')).to.equal(true);
    expect(fs.existsSync('data-files/test/data/output/sample/BASIC-003.xml')).to.equal(true);
    expect(fs.existsSync('data-files/test/data/output/sample/BASIC-004.xml')).to.equal(false);

    var genFile2 = utils.readFile('test/data/output/sample/BASIC-002.xml');
    var genParams2 = utils.getParameters(genFile2);
    expect(genParams2.length).to.equal(0);
    expect(genFile2).to.contain('<UNIQUE_ID>002</UNIQUE_ID>');
    expect(genFile2).to.contain('<VALUE1>Value1</VALUE1>');
    expect(genFile2).to.contain('<VALUE2>Value1</VALUE2>');

  });

  it('should test for generateTemplateWithJSON with parameter template', function () {

    var fileName = './data-files/test/data/config/parameter-template.json';
    utils.generateTemplateWithJSON(fileName);

    var configFiles = utils.getFiles('data-files/test/data/output/sample/', configFiles);

    expect(fs.existsSync('data-files/test/data/output/00Simulator')).to.equal(false);
    expect(configFiles.length).to.equal(3);
    expect(fs.existsSync('data-files/test/data/output/sample/BASIC-001.xml')).to.equal(true);
    expect(fs.existsSync('data-files/test/data/output/sample/BASIC-002.xml')).to.equal(true);
    expect(fs.existsSync('data-files/test/data/output/sample/BASIC-003.xml')).to.equal(true);

    var genFile2 = utils.readFile('test/data/output/sample/BASIC-002.xml');
    var genParams2 = utils.getParameters(genFile2);
    expect(genParams2.length).to.equal(0);
    expect(genFile2).to.contain('<UNIQUE_ID>002</UNIQUE_ID>');
    expect(genFile2).to.contain('<VALUE1>Value1</VALUE1>');
    expect(genFile2).to.contain('<VALUE2>Value1</VALUE2>');
    expect(genFile2).to.contain('        <PARAM-TEMPLATE-VALUE1>001</PARAM-TEMPLATE-VALUE1>\n    <PARAM-TEMPLATE-VALUE2>ABC</PARAM-TEMPLATE-VALUE2>\n    <PARAM-TEMPLATE-VALUE3>002</PARAM-TEMPLATE-VALUE3>\n    <PARAM-TEMPLATE-VALUE4>DEF</PARAM-TEMPLATE-VALUE4>\n    <PARAM-TEMPLATE-VALUE5>003</PARAM-TEMPLATE-VALUE5>\n    <PARAM-TEMPLATE-VALUE6>GHI</PARAM-TEMPLATE-VALUE6>\n</SampleRs>')

  });

  it('should test for generateTemplateWithJSON with position based template', function () {

    var fileName = './data-files/test/data/config/position-based-template.json';
    utils.generateTemplateWithJSON(fileName);

    var configFiles = utils.getFiles('data-files/test/data/output/sample/', configFiles);

    expect(fs.existsSync('data-files/test/data/output/00Simulator')).to.equal(true);
    expect(configFiles.length).to.equal(3);
    expect(fs.existsSync('data-files/test/data/output/sample/BASIC-001.txt')).to.equal(true);
    expect(fs.existsSync('data-files/test/data/output/sample/BASIC-002.txt')).to.equal(true);
    expect(fs.existsSync('data-files/test/data/output/sample/BASIC-003.txt')).to.equal(true);

    var genFile1 = utils.readFile('test/data/output/sample/BASIC-001.txt');
    var genParams1 = utils.getParameters(genFile1);
    expect(genParams1.length).to.equal(0);
    expect(genFile1).to.equal('SAMPLE   00001Value1    00SOME TEXT HERE000111');

    var genFile2 = utils.readFile('test/data/output/sample/BASIC-002.txt');
    var genParams2 = utils.getParameters(genFile2);
    expect(genParams2.length).to.equal(0);
    expect(genFile2).to.equal('SAMPLE   00002Value2    00SOME TEXT HERE000111');

    var genFile3 = utils.readFile('test/data/output/sample/BASIC-003.txt');
    var genParams3 = utils.getParameters(genFile3);
    expect(genParams3.length).to.equal(0);
    expect(genFile3).to.equal('SAMPLE   00003Value3    00SOME TEXT HERE000111');

  });

});



