var chai = require('chai');
var expect = chai.expect;
var should = chai.should;
var assert = chai.assert;
var simple = require('simple-mock');
var utils = require('../support/generator.js');
var fs = require('fs');
var fsExtra = require('fs-extra');
var xlsx = require('xlsx');
var fsmock = require('mock-fs');
var _ = require('lodash');
const { it } = require('mocha');

//add in afterEach function to clean up after each test
afterEach(function () {
  //restore simple-mock back to original state
  simple.restore();

  //remove extra folders
  fsExtra.removeSync('test/data/output');
});

describe('unit tests for getDelimiters function in generator', function () {
  it('should test match for delimiters (default)', function () {
    expect(utils.getDelimiters()).to.deep.equal({startDelim: '\{', endDelim: '\}' })
  });
});

describe('unit tests for getParameters function in generator', function () {
  it('should test match for parameters', function () {
    var addressInput = fs.readFileSync('./test/data/template/ADDRESS.xml', { encoding: 'utf-8' });
    expect(utils.getParameters(addressInput).length).to.equal(10);
  });

  it('should test not match for parameters', function () {
    var addressInput = fs.readFileSync('./test/data/template/NoParameters.xml', { encoding: 'utf-8' });
    expect(utils.getParameters(addressInput).length).to.equal(0);
  });

  it('should test match for hasMockoonResponseHelperFormat (true) in genObj config - 0 matches (faker & time format)', function () {
    fsmock({
      'test/data/template': {
        'test.json': '{"value" : "{{faker \'random.uuid\'}}", "value1": "{{now \'yyyy-MM-dd\'}}T{{now \'HH:mm:ssxxx\'}} "}'
      }
    });
    simple.mock(fs, 'readFileSync');

    let genObj = {
      hasMockoonResponseHelperFormat: true
    }

    var templateInput = fs.readFileSync('./test/data/template/test.json', { encoding: 'utf-8' });
    expect(utils.getParameters(templateInput, genObj).length).to.equal(0);
    fsmock.restore();
  });

  it('should test match for hasMockoonResponseHelperFormat (true) in genObj config - 0 matches (time)', function () {
    fsmock({
      'test/data/template': {
        'test.json': '{"value" : "{{time \'09:00\' \'10:00\' \'HH:mm\'}}", "value1": "{{now \'yyyy-MM-dd\'}} "}'
      }
    });
    simple.mock(fs, 'readFileSync');

    let genObj = {
      hasMockoonResponseHelperFormat: true
    }

    var templateInput = fs.readFileSync('./test/data/template/test.json', { encoding: 'utf-8' });
    expect(utils.getParameters(templateInput, genObj).length).to.equal(0);
    fsmock.restore();
  });

  it('should test match for hasMockoonResponseHelperFormat (true) in genObj config - 0 matches (complex datetime)', function () {
    fsmock({
      'test/data/template': {
        'test.json': '{"value" : "{{date \'2020-11-20\' \'2020-11-25\' "yyyy-MM-dd\'T\'HH:mm:ss.SSS\'Z\'"}}" "}'
      }
    });
    simple.mock(fs, 'readFileSync');

    let genObj = {
      hasMockoonResponseHelperFormat: true
    }

    var templateInput = fs.readFileSync('./test/data/template/test.json', { encoding: 'utf-8' });
    expect(utils.getParameters(templateInput, genObj).length).to.equal(0);
    fsmock.restore();
  });

  it('should test match for hasMockoonResponseHelperFormat (true) in genObj config - 0 matches (header)', function () {
    fsmock({
      'test/data/template': {
        'test.json': '{"value" : "value2": "{{header \'MessageID\'}}" "value3": "{{header \'MessageID\' \'f77798de-6a43-4980-ba3c-411ebaeb123e\'}}" "}'
      }
    });
    simple.mock(fs, 'readFileSync');

    let genObj = {
      hasMockoonResponseHelperFormat: true
    }

    var templateInput = fs.readFileSync('./test/data/template/test.json', { encoding: 'utf-8' });
    expect(utils.getParameters(templateInput, genObj).length).to.equal(0);
    fsmock.restore();
  });

  it('should test match for hasMockoonResponseHelperFormat (true) in genObj config - 0 matches (queryParam)', function () {
    fsmock({
      'test/data/template': {
        'test.json': '{"value" : "{{queryParam \'path.to.property\'}}"}'
      }
    });
    simple.mock(fs, 'readFileSync');

    let genObj = {
      hasMockoonResponseHelperFormat: true
    }

    var templateInput = fs.readFileSync('./test/data/template/test.json', { encoding: 'utf-8' });
    expect(utils.getParameters(templateInput, genObj).length).to.equal(0);
    fsmock.restore();
  });

  it('should test match for hasMockoonResponseHelperFormat (true) in genObj config - 0 matches (includes)', function () {
    fsmock({
      'test/data/template': {
        'test.json': '{"value" : "{{includes \'Some data\' \'data\'}}"}'
      }
    });
    simple.mock(fs, 'readFileSync');

    let genObj = {
      hasMockoonResponseHelperFormat: true
    }

    var templateInput = fs.readFileSync('./test/data/template/test.json', { encoding: 'utf-8' });
    expect(utils.getParameters(templateInput, genObj).length).to.equal(0);
    fsmock.restore();
  });

  it('should test match for hasMockoonResponseHelperFormat (true) in genObj config - 0 matches (substr)', function () {
    fsmock({
      'test/data/template': {
        'test.json': '{"value" : "{{substr \'Some data\' 5 4}}"}'
      }
    });
    simple.mock(fs, 'readFileSync');

    let genObj = {
      hasMockoonResponseHelperFormat: true
    }

    var templateInput = fs.readFileSync('./test/data/template/test.json', { encoding: 'utf-8' });
    expect(utils.getParameters(templateInput, genObj).length).to.equal(0);
    fsmock.restore();
  });

  it('should test match for hasMockoonResponseHelperFormat (true) in genObj config - 0 matches (int (range))', function () {
    fsmock({
      'test/data/template': {
        'test.json': '{"value" : "{{int 0 100}}"}'
      }
    });
    simple.mock(fs, 'readFileSync');

    let genObj = {
      hasMockoonResponseHelperFormat: true
    }

    var templateInput = fs.readFileSync('./test/data/template/test.json', { encoding: 'utf-8' });
    expect(utils.getParameters(templateInput, genObj).length).to.equal(0);
    fsmock.restore();
  });

  it('should test match for hasMockoonResponseHelperFormat (true) in genObj config - 0 matches (objectId)', function () {
    fsmock({
      'test/data/template': {
        'test.json': '{"value" : "{{objectId 141409 3117}}", "value2": "{{objectId \'54495ad94c934721ede76d90\'}}"}'
      }
    });
    simple.mock(fs, 'readFileSync');

    let genObj = {
      hasMockoonResponseHelperFormat: true
    }

    var templateInput = fs.readFileSync('./test/data/template/test.json', { encoding: 'utf-8' });
    expect(utils.getParameters(templateInput, genObj).length).to.equal(0);
    fsmock.restore();
  });

  it('should test match for hasMockoonResponseHelperFormat (true) in genObj config - 1 match', function () {
    fsmock({
      'test/data/template': {
        'test.json': '{"value" : "{{faker \'random.uuid\'}}", "value1": "{paramVal}"}'
      }
    });
    simple.mock(fs, 'readFileSync');

    let genObj = {
      hasMockoonResponseHelperFormat: true
    }
    var templateInput = fs.readFileSync('./test/data/template/test.json', { encoding: 'utf-8' });
    expect(utils.getParameters(templateInput, genObj).length).to.equal(1);
    fsmock.restore();
  });

  it('should test match for hasMockoonResponseHelperFormat (false) in genObj config - 2 match', function () {
    fsmock({
      'test/data/template': {
        'test.json': '{"value" : "{{faker \'random.uuid\'}}", "value1": "{paramVal}"}'
      }
    });
    simple.mock(fs, 'readFileSync');

    let genObj = {
      hasMockoonResponseHelperFormat: false
    }
    var templateInput = fs.readFileSync('./test/data/template/test.json', { encoding: 'utf-8' });
    expect(utils.getParameters(templateInput, genObj).length).to.equal(2);
    fsmock.restore();
  });

});

describe('unit tests for readContentsOfWorksheet function in generator', function () {
  it('should test data is read from the worksheet', function () {
    var workBook = xlsx.readFile('./test/data/spreadsheet/worksheet.xlsx');
    var worksheet = workBook.Sheets['Search-Tab'];
    var contents = utils.readContentsOfWorksheet(worksheet);
    expect(contents[0]['SEARCH_IDENTIFIER']).to.equal('All');
  });

  it('should test no. of rows read from the worksheet', function () {
    var workBook = xlsx.readFile('./test/data/spreadsheet/worksheet.xlsx');
    var worksheet = workBook.Sheets['Search-Tab'];
    expect(utils.readContentsOfWorksheet(worksheet).length).to.equal(2);
  });

  it('should test no. of non empty row 1 read from the worksheet', function () {
    var workBook = xlsx.readFile('./test/data/spreadsheet/worksheet.xlsx');
    var worksheet = workBook.Sheets['Search-Tab'];
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

describe('unit tests for escapeJSON function in generator', function () {
  it('should JSON is escaped', function () {
    var str = 'Hello \\world\\ and \bbold\b';
    expect(utils.escapeJSON(str)).to.equal('Hello \\\\world\\\\ and \\bbold\\b');
  });

  it('should JSON is escaped \'', function () {
    var str = 'bob\'s here';
    expect(utils.escapeJSON(str)).to.equal("bob\\\\'s here");
  });

  it('should JSON is escaped "\'"', function () {
    var str = "bob's here";
    expect(utils.escapeJSON(str)).to.equal("bob\\\\'s here");
  });

  it('should JSON is escaped \"', function () {
    var str = '"hi" there';
    expect(utils.escapeJSON(str)).to.equal('\\\"hi\\\" there');
  });

  it('should JSON is escaped "\\t"', function () {
    var str = 'abc\tthere';
    expect(utils.escapeJSON(str)).to.equal('abc\\tthere');
  });

  it('should JSON is escaped "\\n"', function () {
    var str = 'abc\nthere';
    expect(utils.escapeJSON(str)).to.equal('abc\\nthere');
  });

  it('should JSON is escaped "\&"', function () {
    var str = 'abc & there';
    expect(utils.escapeJSON(str)).to.equal('abc \\\\& there');
  });

  it('should JSON escaped is empty', function () {
    expect(utils.escapeJSON()).to.equal(undefined);
  });

  it('should JSON is unchanged', function () {
    var str = 'abc there';
    expect(utils.escapeJSON(str)).to.equal('abc there');
  });
});

describe('unit tests for readFile function in generator', function () {
  it('should test readFile returns error', function () {
    let file = 'aa.json'
    let err = 'folderLocationSet is not defined'
    expect(function () { utils.readFile(file, folderLocationSet); }).to.throw(err)
  });
});

describe('unit tests for removeSpacesFromString function in generator', function () {
  it('should test spaces are removed from strings', function () {
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
    var dataRow = { "VALUE1_ONE": 'four', "VALUE1_TWO": "two", "VALUE2_ONE": 'one', "VALUE2_TWO": "three" };
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
    var dataRow = { "VALUE1_ONE": 'four', "VALUE1_TWO": "two", "VALUE2_ONE": 'one', "VALUE2_TWO": "three" };
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
    var dataRow = { "VALUE1_ONE": 'four', "VALUE1_TWO": "two", "VALUE2_ONE": 'one', "VALUE2_TWO": "three" };
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
    var dataRow = { "VALUE1_ONE": 'four', "VALUE1_TWO": "two", "VALUE2_ONE": 'one', "VALUE2_TWO": "three" };
    var resultsFile = 'Hello {REPLACEMENT_PARAMETER} Marry';
    simple.mock(utils, 'checkKeyNameExists').returnWith(undefined);
    simple.mock(utils, 'getRepeatingGroupValues').returnWith("Moana");
    var contents = utils.addRepeatingGrp(dataRow, resultsFile, repeatingGrpTemplate);
    expect(contents).to.equal('Hello  Marry');
  });

  it('should test to add a parameter group value with conditions', function () {
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
      },
      "condition": [
        {
          "columnName": "VALUE1_ONE",
          "conditionalValue": "!=",
          "columnValue": "%EMPTY%"
        }
      ]
    };
    var dataRow = { "VALUE1_ONE": 'four', "VALUE1_TWO": "two", "VALUE2_ONE": 'one', "VALUE2_TWO": "three" };
    var resultsFile = 'Hello {REPLACEMENT_PARAMETER} Marry';
    simple.mock(utils, 'checkKeyNameExists').returnWith(["VALUE1_ONE"]);
    simple.mock(utils, 'getRepeatingGroupValues').returnWith("Moana");
    var contents = utils.addRepeatingGrp(dataRow, resultsFile, repeatingGrpTemplate);
    expect(contents).to.equal('Hello Moana Marry');
  });
});

describe('unit tests for generateRepeatingGrp function in generator', function () {
  it('should test generate repeating group value', function () {
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

    var dataRow = { "VALUE1_ONE": 'four', "VALUE1_TWO": "two"};
    var fileExtension = '.xml'
    simple.mock(utils, 'checkKeyNameExists').returnWith(['VALUE1_ONE', 'VALUE1_TWO']);
    simple.mock(utils, 'applyRepeatingGrp').returnWith("abc def");
    var contents = utils.generateRepeatingGrp(dataRow, repeatingGrpTemplate, fileExtension);
    expect(contents).to.equal('abc defabc def');
  });

  it('should test generate repeating group value (no uniqueIdentifier)', function () {
    var repeatingGrpTemplate = {
      "name": "repeating template example",
      "templateFile": "data/template/repeating-template.xml",
      "parameter": "{REPLACEMENT_PARAMETER}",
      "map": {
        "ONE": "VALUE_ONE",
        "TWO": "VALUE_TWO"
      }
    };

    var dataRow = { "VALUE1_ONE": 'four', "VALUE1_TWO": "two"};
    var fileExtension = '.xml'
    simple.mock(utils, 'checkKeyNameExists').returnWith(['VALUE1_ONE', 'VALUE1_TWO']);
    simple.mock(utils, 'applyRepeatingGrp').returnWith("abc def");
    var contents = utils.generateRepeatingGrp(dataRow, repeatingGrpTemplate, fileExtension);
    expect(contents).to.equal('abc defabc def');
  });

  it('should test generate repeating group value (json fileExtension)', function () {
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

    var dataRow = { "VALUE1_ONE": 'four', "VALUE1_TWO": "two"};
    var fileExtension = '.json'
    simple.mock(utils, 'checkKeyNameExists').returnWith(['VALUE1_ONE', 'VALUE1_TWO']);
    simple.mock(utils, 'applyRepeatingGrp').returnWith("abc def");
    var contents = utils.generateRepeatingGrp(dataRow, repeatingGrpTemplate, fileExtension);
    expect(contents).to.equal('abc def,abc def');
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
    var dataRow = { "VALUE1_ONE": 'four', "VALUE1_TWO": "two", "VALUE2_ONE": 'one', "VALUE2_TWO": "three" };
    var keyName = 'VALUE2_ONE';
    var secondMatch = '';
    var exactMatch = true;
    var contents = utils.checkKeyNameExists(dataRow, keyName, secondMatch, exactMatch);
    expect(contents.length).to.equal(1);
    expect(contents[0]).to.equal('one');
  });

  it('should test for checkKeyNameExists for second match', function () {
    var dataRow = { "VALUE1_ONE": 'four', "VALUE1_TWO": "two", "VALUE2_ONE": 'one', "VALUE2_TWO": "three" };
    var keyName = 'VALUE1';
    var secondMatch = 'TWO';
    var exactMatch = false;
    var contents = utils.checkKeyNameExists(dataRow, keyName, secondMatch, exactMatch);
    expect(contents.length).to.equal(1);
    expect(contents[0]).to.equal('two');
  });

  it('should test for checkKeyNameExists for first match', function () {
    var dataRow = { "VALUE1_ONE": 'four', "VALUE1_TWO": "two", "VALUE2_ONE": 'one', "VALUE2_TWO": "three" };
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
      "paramName": "{MGR_NAME}",
      "paramLength": 40,
      "padding": {
        "padWith": " ",
        "leadingWith": false
      }
    };
    var param = "ABCDADADA";
    var contents = utils.padOutParamValues(paramObject, param);
    expect(contents.length).to.equal(40);
  });

  it('should test for pad out content with trailing pad width', function () {
    var paramObject = {
      "paramName": "{MGR_NAME}",
      "paramLength": 40,
      "padding": {
        "padWith": "Q",
        "leadingWith": false
      }
    };
    var param = "ABCDADADA";
    var contents = utils.padOutParamValues(paramObject, param);
    expect(contents.length).to.equal(40);
    expect(contents).to.equal('ABCDADADAQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQ');
  });

  it('should test for pad out content with leading pad width', function () {
    var paramObject = {
      "paramName": "{MGR_NAME}",
      "paramLength": 40,
      "padding": {
        "padWith": "Q",
        "leadingWith": true
      }
    };
    var param = "ABCDADADA";
    var contents = utils.padOutParamValues(paramObject, param);
    expect(contents.length).to.equal(40);
    expect(contents).to.equal('QQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQABCDADADA');
  });
});

describe('unit tests for replaceValues function in generator', function () {

  var genObj = {
    "profileName": "test-profile",
    "output": {
      "folder": "output/folder/",
      "fileNamePrefix": "Pre-",
      "fileIdColumn": "ID_COL",
      "fileExtension": ".xml"
    }
  };

  it('should test for replaceValues for parameters < 0', function () {

    var dataRow = { "VALUE1_ONE": 'four', "VALUE1_TWO": "two", "VALUE2_ONE": 'one', "VALUE2_TWO": "three" };
    var parameters = [];
    var resultsFile = "abc {VALUE1_ONE} def";
    var incrementalValue = 1;

    var res = utils.replaceValues(genObj, dataRow, parameters, resultsFile, incrementalValue);
    expect(res).to.equal('abc {VALUE1_ONE} def');

  });

  it('should test for replaceValues for xml', function () {

    var dataRow = { "VALUE1_ONE": 'four', "VALUE1_TWO": "two", "VALUE2_ONE": 'one', "VALUE2_TWO": "three" };
    var parameters = ["VALUE1_ONE", "VALUE2_ONE"];
    var resultsFile = "abc {VALUE1_ONE} def";
    var incrementalValue = 1;

    var res = utils.replaceValues(genObj, dataRow, parameters, resultsFile, incrementalValue);
    expect(res).to.equal('abc four def');

  });

  it('should test for replaceValues for no incremental value', function () {

    var dataRow = { "VALUE1_ONE": 'four', "VALUE1_TWO": "two", "VALUE2_ONE": 'one', "VALUE2_TWO": "three" };
    var parameters = ["VALUE1_ONE", "VALUE2_ONE"];
    var resultsFile = "abc {VALUE1_ONE} def";
    var incrementalValue = '';

    var res = utils.replaceValues(genObj, dataRow, parameters, resultsFile, incrementalValue);
    expect(res).to.equal('abc four def');

  });

  it('should test for replaceValues for non xml', function () {
    var genObj = {
      "profileName": "test-profile",
      "output": {
        "fileExtension": ".pdf",
        "folder": "output/folder/",
        "fileNamePrefix": "Pre-",
        "fileIdColumn": "ID_COL",
      }
    };

    var dataRow = { "VALUE1_ONE": 'four', "VALUE1_TWO": "two", "VALUE2_ONE": 'one', "VALUE2_TWO": "three" };
    var parameters = ["VALUE1_ONE", "VALUE2_ONE"];
    var resultsFile = "abc {VALUE1_ONE} def";
    var incrementalValue = 1;

    var res = utils.replaceValues(genObj, dataRow, parameters, resultsFile, incrementalValue);
    expect(res).to.equal('abc four def');

  });

  it('should test for replaceValues for fileExtension no output object', function () {

    var genObj = {
      "profileName": "test-profile"
    };
    var dataRow = { "VALUE1_ONE": "four", "VALUE1_TWO": "two", "VALUE2_ONE": 'one', "VALUE2_TWO": "three" };
    var parameters = ["VALUE1_ONE", "VALUE2_ONE"];
    var resultsFile = "abc {VALUE1_ONE} def";
    var incrementalValue = 1;

    var res = utils.replaceValues(genObj, dataRow, parameters, resultsFile, incrementalValue);
    expect(res).to.equal('abc four def');

  });

  it('should test for replaceValues with setAsDefaultValue', function () {

    var genObj = {
      "profileName": "test-profile",
      "setAsDefaultValue": "AAA"
    };
    var dataRow = { "VALUE1_TWO": "two", "VALUE2_ONE": 'one', "VALUE2_TWO": "three" };
    var parameters = ["VALUE1_ONE", "VALUE2_ONE"];
    var resultsFile = "abc {VALUE1_ONE} def";
    var incrementalValue = 1;

    var res = utils.replaceValues(genObj, dataRow, parameters, resultsFile, incrementalValue);
    expect(res).to.equal('abc AAA def');

  });

  it('should test for replaceValues for simObj with simulator', function () {

    var genObj = {
      "profileName": "test-profile",
      "simulator": {
        "simulatorFilename": "00-sim-json-basic.json"
      }
    };
    var dataRow = { "VALUE1_ONE": "four", "VALUE1_TWO": "two", "VALUE2_ONE": 'one', "VALUE2_TWO": "three" };
    var parameters = ["VALUE1_ONE", "VALUE2_ONE"];
    var resultsFile = "abc {VALUE1_ONE} def";
    var incrementalValue = 1;

    var res = utils.replaceValues(genObj, dataRow, parameters, resultsFile, incrementalValue);
    expect(res).to.equal('abc four def');
  });

  it('should test for replaceValues for simObj with sim array and simIndex', function () {

    var genObj = {
      "profileName": "test-profile",
      "simulator": [
        {
          "simulatorFilename": "00-sim-json-basic.json",
          "simulatorConfigTemplate": "sim-json-template-one.json"
        }
      ]
    };
    var dataRow = { "VALUE1_ONE": "four", "VALUE1_TWO": "two", "VALUE2_ONE": 'one', "VALUE2_TWO": "three" };
    var parameters = ["VALUE1_ONE", "VALUE2_ONE"];
    var resultsFile = "abc {VALUE1_ONE} def";
    var incrementalValue = 1;
    var simIndex = 0;

    var res = utils.replaceValues(genObj, dataRow, parameters, resultsFile, incrementalValue, simIndex);
    expect(res).to.equal('abc four def');
  });

  it('should test for replaceValues for simObj with sim array', function () {

    var genObj = {
      "profileName": "test-profile",
      "simulator": [
        {
          "simulatorConfigTemplate": "sim-json-template-one.json"
        },
        {
          "simulatorConfigTemplate": "sim-json-template-two.json"
        }
      ]
    };
    var dataRow = { "VALUE1_ONE": "four", "VALUE1_TWO": "two", "VALUE2_ONE": 'one', "VALUE2_TWO": "three" };
    var parameters = ["VALUE1_ONE", "VALUE2_ONE"];
    var resultsFile = "abc {VALUE1_ONE} def";
    var incrementalValue = 1;
    var simIndex = 1;

    var res = utils.replaceValues(genObj, dataRow, parameters, resultsFile, incrementalValue, simIndex);
    expect(res).to.equal('abc four def');
  });

  it('should test for replaceValues for AUTO_INCREMENT', function () {

    var dataRow = { "VALUE1_ONE": 'four', "VALUE1_TWO": "two", "VALUE2_ONE": 'one', "VALUE2_TWO": "three" };
    var parameters = ["%AUTO_INCREMENT%", "VALUE2_ONE"];
    var resultsFile = "abc {%AUTO_INCREMENT%} def";
    var incrementalValue = 1;

    var res = utils.replaceValues(genObj, dataRow, parameters, resultsFile, incrementalValue);
    expect(res).to.equal('abc 1 def');

  });

  it('should test for replaceValues for SUM_TOTAL', function () {

    var dataRow = { "VALUE1_ONE": 'four', "VALUE1_TWO": "two", "VALUE2_ONE": 'one', "VALUE2_TWO": "three" };
    var parameters = ["%SUM_TOTAL%", "VALUE2_ONE"];
    var resultsFile = "abc {%SUM_TOTAL%} def";
    var incrementalValue = 2;

    var res = utils.replaceValues(genObj, dataRow, parameters, resultsFile, incrementalValue);
    expect(res).to.equal('abc 2 def');

  });

  it('should test for replaceValues for position based', function () {

    var genObj = {
      "profileName": "test-profile",
      "output": {
        "folder": "output/folder/",
        "fileNamePrefix": "Pre-",
        "fileIdColumn": "ID_COL",
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

    var dataRow = { "VALUE1_ONE": "four", "VALUE1_TWO": "two", "VALUE2_ONE": 'one', "VALUE2_TWO": "three" };
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
        "folder": "output/folder/",
        "fileNamePrefix": "Pre-",
        "fileIdColumn": "ID_COL",
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

    var dataRow = { "VALUE1_ONE": "four", "VALUE1_TWO": "two", "VALUE2_ONE": 'one', "VALUE2_TWO": "three" };
    var parameters = ["VALUE1_ONE", "VALUE2_ONE"];
    var resultsFile = "abc {VALUE1_ONE} def";
    var incrementalValue = 1;

    simple.mock(utils, 'getMatchingPositionBasedValue').returnWith(undefined);

    var res = utils.replaceValues(genObj, dataRow, parameters, resultsFile, incrementalValue);
    expect(res).to.equal('abc four def');
  });

  it('should test for replaceValues for json file', function () {

    var genObj = {
      "profileName": "test-profile",
      "output": {
        "folder": "output/folder/",
        "fileNamePrefix": "Pre-",
        "fileIdColumn": "ID_COL",
        "fileExtension": ".json"
      }
    };

    var dataRow = { "VALUE1_ONE": "four", "VALUE1_TWO": "two", "VALUE2_ONE": 'one', "VALUE2_TWO": "three" };
    var parameters = ["VALUE1_ONE", "VALUE2_ONE"];
    var resultsFile = '{"abc": {VALUE1_ONE}, "bcd": "def"}';
    var incrementalValue = 1;

    var res = utils.replaceValues(genObj, dataRow, parameters, resultsFile, incrementalValue);
    expect(res).to.equal('{"abc": four, "bcd": "def"}');
  });

  it('should test for replaceValues for json file - not found in dataRow - json as string value', function () {

    var genObj = {
      "profileName": "test-profile",
      "output": {
        "folder": "output/folder/",
        "fileNamePrefix": "Pre-",
        "fileIdColumn": "ID_COL",
        "fileExtension": ".json"
      }
    };
    // "streetNumber": "{STREET_NUMBER}",
    var dataRow = { "VALUE1_ONE": "four", "VALUE1_TWO": "two", "VALUE2_ONE": 'one', "VALUE2_TWO": "three" };
    var parameters = ["VALUE3_ONE"];
    var resultsFile = '{"abc": "{VALUE3_ONE}", "bcd": "def"}';
    var incrementalValue = 1;

    var res = utils.replaceValues(genObj, dataRow, parameters, resultsFile, incrementalValue);
    expect(res).to.equal('{"abc": "", "bcd": "def"}');
  });

  //failing
  it.skip('should test for replaceValues for json file - not found in dataRow - json as number value', function () {

    var genObj = {
      "profileName": "test-profile",
      "output": {
        "folder": "output/folder/",
        "fileNamePrefix": "Pre-",
        "fileIdColumn": "ID_COL",
        "fileExtension": ".json"
      }
    };
    // "streetNumber": {STREET_NUMBER},
    var dataRow = { "VALUE1_ONE": "four", "VALUE1_TWO": "two", "VALUE2_ONE": 'one', "VALUE2_TWO": "three" };
    var parameters = ['VALUE3_ONE'];
    var resultsFile = '{"abc": {VALUE3_ONE}, "bcd": "def"}';
    var incrementalValue = 1;

    var res = utils.replaceValues(genObj, dataRow, parameters, resultsFile, incrementalValue);
    expect(res).to.equal('{"abc": null, "bcd": "def"}');
  });

  // failing
  it.skip('should test for replaceValues for json file - not found in dataRow - json as number value with jsonDefaultValue', function () {

    var genObj = {
      "profileName": "test-profile",
      "output": {
        "folder": "output/folder/",
        "fileNamePrefix": "Pre-",
        "fileIdColumn": "ID_COL",
        "fileExtension": ".json"
      },
      "jsonDefaultValue": "\"\""
    };

    var dataRow = { "VALUE1_ONE": "four", "VALUE1_TWO": "two", "VALUE2_ONE": 'one', "VALUE2_TWO": "three" };
    var parameters = ['VALUE3_ONE'];
    var resultsFile = '{"abc": {VALUE3_ONE}, "bcd": "def"}';
    var incrementalValue = 1;

    var res = utils.replaceValues(genObj, dataRow, parameters, resultsFile, incrementalValue);
    expect(res).to.equal('{"abc": "", "bcd": "def"}');
  });

  it('should test for replaceValues for json file - not found in dataRow - json as replacement value', function () {

    var genObj = {
      "profileName": "test-profile",
      "output": {
        "folder": "output/folder/",
        "fileNamePrefix": "Pre-",
        "fileIdColumn": "ID_COL",
        "fileExtension": ".json"
      }
    };
    // eg. {ADDRESS}
    var dataRow = { "VALUE1_ONE": "four", "VALUE1_TWO": "two", "VALUE2_ONE": 'one', "VALUE2_TWO": "three" };
    var parameters = ['VALUE3_ONE'];
    var resultsFile = '{ {VALUE3_ONE}, "bcd": "def"}';
    var incrementalValue = 1;

    var res = utils.replaceValues(genObj, dataRow, parameters, resultsFile, incrementalValue);
    expect(res).to.equal('{ {VALUE3_ONE}, "bcd": "def"}');
  });
});

describe('unit tests for transformValues function', function () {
  it('should test for transformValues - value transformed (match)', function() {
    let transformObj = {
      columnName: "A1",
      conditionalValue: "==",
      columnValue: "value 1",
      replacementValue: "new value"
    }
    let paramName = 'A1'
    let paramValue = 'value 1'

    let res = utils.transformValues(transformObj, paramName, paramValue)
    expect(res).to.equal('new value');
  })

  it('should test for transformValues - value transformed (no match)', function() {
    let transformObj = {
      columnName: "A1",
      conditionalValue: "==",
      columnValue: "value 1",
      replacementValue: "new value"
    }
    let paramName = 'A1'
    let paramValue = 'value 2'

    let res = utils.transformValues(transformObj, paramName, paramValue)
    expect(res).to.equal(undefined);
  })

  it('should test for transformValues - throw error (no columnName)', function() {
    let transformObj = {
      conditionalValue: "==",
      columnValue: "value 1",
      replacementValue: "new value"
    }
    let paramName = 'A1'
    let paramValue = 'value 2'

    let err = 'config for transform object has to have all the folowing values: columnName, conditionalValue, columnValue and replacementValue'
    expect(function () { utils.transformValues(transformObj, paramName, paramValue); }).to.throw(err)
  })

  it('should test for transformValues - throw error (no conditionalValue)', function() {
    let transformObj = {
      columnName: "A1",
      columnValue: "value 1",
      replacementValue: "new value"
    }
    let paramName = 'A1'
    let paramValue = 'value 2'

    let err = 'config for transform object has to have all the folowing values: columnName, conditionalValue, columnValue and replacementValue'
    expect(function () { utils.transformValues(transformObj, paramName, paramValue); }).to.throw(err)
  })

  it('should test for transformValues - throw error (no columnValue)', function() {
    let transformObj = {
      columnName: "A1",
      conditionalValue: "==",
      replacementValue: "new value"
    }
    let paramName = 'A1'
    let paramValue = 'value 2'

    let err = 'config for transform object has to have all the folowing values: columnName, conditionalValue, columnValue and replacementValue'
    expect(function () { utils.transformValues(transformObj, paramName, paramValue); }).to.throw(err)
  })

  it('should test for transformValues - throw error (no replacementValue)', function() {
    let transformObj = {
      columnName: "A1",
      conditionalValue: "==",
      columnValue: "value 1",
    }
    let paramName = 'A1'
    let paramValue = 'value 2'

    let err = 'config for transform object has to have all the folowing values: columnName, conditionalValue, columnValue and replacementValue'
    expect(function () { utils.transformValues(transformObj, paramName, paramValue); }).to.throw(err)
  })
})

describe('unit tests for checkTagsMatch function in generator', function () {
  it('should test for checkTagsMatch for true match', function () {
    var tagsToMatch = "ALL,DEFAULT,NO_D,NO_C,NO_P,NO_O,NO_I,OTHER,DNO_O";
    var tag = 'DEFAULT';
    var contents = utils.checkTagsMatch(tagsToMatch, tag);
    expect(contents).to.equal(true);
  });

  it('should test for checkTagsMatch for no match', function () {
    var tagsToMatch = "ALL,DEFAULT,NO_D,NO_C,NO_P,NO_O,NO_I,OTHER,DNO_O";
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
        "fileName": "search.xml"
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
          "fileName": "search_Item.xml",
          "replacementParamName": "{REPLACE_VALUE}"
        }
      ]
    }
  };

  var workbook = {
    "SheetNames": ["Sheet 1", "Sheet 2"],
    "Sheets": [{
      "Sheet 1": [{
        "A1": { "a": "value" }
      }, {
        "B2": { "b": "value" }
      }],
      "Sheet 2": [{
        "A1": { "a": "value" }
      }, {
        "B2": { "b": "value" }
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
        "fileName": "search_Item.xml",
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
      "fileName": "search_Item.xml",
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
          "fileName": "search_Item.xml",
          "replacementParamName": "{REPLACE_VALUE}"
        }
      ]
    };

    simple.mock(utils, 'readContentsOfWorksheet').returnWith(['{"VALUE1_ONE": "four"}{"VALUE1_TWO": "two"}{"VALUE2_THREE": "one"}{"VALUE1_TWO": "VALUE2_TWO": "three}', '{"VALUE1_ONE": "four"}{"VALUE1_TWO": "two"}{"VALUE2_THREE": "one"}{"VALUE1_TWO": "VALUE2_TWO": "three}']);
    simple.mock(utils, 'getFilteredSet').returnWith(filteredSetData);
    simple.mock(utils, 'getNamedTemplate').returnWith({
      "name": "default",
      "path": "data/template/",
      "fileName": "search_Item.xml",
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
          "fileName": "search.xml"
        }
      ],
      "filteredSection": {
        "sectionSheetName": "Sheet 2",
        "sectionSheetTagColumn": "VALUE1_ONE",
        "primarySheetTagColumn": "VALUE1_ONE",
        "templateFromFile": {
          "templateInputFolder": "output/profile/",
          "templateFileNameFormat": "P-{ACCOUNT_NUMBER}.xml",
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
        "templateInputFolder": "output/profile/",
        "templateFileNameFormat": "P-{ACCOUNT_NUMBER}.xml",
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

  it('should test for getMatchingFilteredSet does not have matching filteredSection property - sectionSheetTagColumn', function () {

    genObj = {
      "profileName": "test-profile",
      "sheetName": "Sheet 1",
      "templates": [
        {
          "name": "default",
          "path": "data/template/",
          "fileName": "search.xml"
        }
      ],
      "filteredSection": {
        "sectionSheetName": "Sheet 2",
        "sectionSheetTagColumn": "VALUE1_ONE",
        "primarySheetTagColumn": "VALUE1_ONE",
        "invalidTemplateFromFile": {
          "templateInputFolder": "output/profile/",
          "templateFileNameFormat": "P-{ACCOUNT_NUMBER}.xml",
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
      "invalidTemplateFromFile": {
        "templateInputFolder": "output/profile/",
        "templateFileNameFormat": "P-{ACCOUNT_NUMBER}.xml",
        "templateFileParamName": "{ACCOUNT_NUMBER}",
        "templateFileParamColumn": "ACCOUNT_NUMBER",
        "replacementParamName": "{REPLACE_VALUE}"
      }
    };

    generatedTemplateFile = '{"VALUE1_ONE": "four"}{"VALUE1_TWO": "two"}{"VALUE2_THREE": "one"}{"VALUE1_TWO": "VALUE2_TWO": "three}', '{"VALUE1_ONE": "four"}{"VALUE1_TWO": "two"}{"VALUE2_THREE": "one"}{"VALUE1_TWO": "VALUE2_TWO": "three}'

    simple.mock(utils, 'readContentsOfWorksheet').returnWith(['{"VALUE1_ONE": "four"}{"VALUE1_TWO": "two"}{"VALUE2_THREE": "one"}{"VALUE1_TWO": "VALUE2_TWO": "three}', '{"VALUE1_ONE": "four"}{"VALUE1_TWO": "two"}{"VALUE2_THREE": "one"}{"VALUE1_TWO": "VALUE2_TWO": "three}']);
    simple.mock(utils, 'getFilteredSet').returnWith(filteredSetData);
    simple.mock(utils, 'getNamedTemplate').returnWith({
      "name": "default",
      "path": "data/template/",
      "fileName": "template.xml",
      "replacementParamName": "{REPLACE_VALUE}"
    });

    let err = 'Cannot read properties of undefined (reading \'sectionSheetTagColumn\')'
    expect(function () { utils.getMatchingFilteredSet(genObj, workbook, filteredSetConfigObj); }).to.throw(err)
  });

});

describe('unit tests for getMatchingPositionBasedValue function in generator', function () {

  it('should test for getMatchingPositionBasedValue for position', function () {
    var positionObject = [
      {
        "paramName": "{MGR_NAME}",
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
    var param = '{MGR_NAME}';
    var contents = utils.getMatchingPositionBasedValue(positionObject, param);
    var expResult = {
      "paramName": "{MGR_NAME}",
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
        "paramName": "{MGR_NAME}",
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
    var dataRow = { "A_TYPE": 'ACC', "STATUS_CODE": "4", "VALUE2_TWO": "three" };
    var templateConditions = [{
      "columnName": "A_TYPE",
      "conditionalValue": "=",
      "columnValue": "DA"
    }];

    simple.mock(utils, 'checkTemplateConditionalValue').returnWith(true);
    var contents = utils.checkAllTemplateConditionalValues(dataRow, templateConditions, templateUsed);
    expect(contents).to.equal(false);
  });

  it('should test for checkAllTemplateConditionalValues without templatedUsed so check for singular condition', function () {
    var templateUsed = false;
    var dataRow = { "A_TYPE": 'ACC', "STATUS_CODE": "4", "VALUE2_TWO": "three" };
    var templateConditions = [{
      "columnName": "A_TYPE",
      "conditionalValue": "=",
      "columnValue": "DA"
    }];

    simple.mock(utils, 'checkTemplateConditionalValue').returnWith(true);
    var contents = utils.checkAllTemplateConditionalValues(dataRow, templateConditions, templateUsed);
    expect(contents).to.equal(true);
  });

  it('should test for checkAllTemplateConditionalValues without templatedUsed so check for singular condition', function () {
    var templateUsed = false;
    var dataRow = { "A_TYPE": 'ACC', "STATUS_CODE": "4", "VALUE2_TWO": "three" };
    var templateConditions = [{
      "columnName": "A_TYPE",
      "conditionalValue": "!=",
      "columnValue": "DA"
    }];

    simple.mock(utils, 'checkTemplateConditionalValue').returnWith(false);
    var contents = utils.checkAllTemplateConditionalValues(dataRow, templateConditions, templateUsed);
    expect(contents).to.equal(false);
  });

  it('should test for checkAllTemplateConditionalValues without templatedUsed so check for multiple condition', function () {
    var templateUsed = false;
    var dataRow = { "A_TYPE": 'ACC', "STATUS_CODE": "4", "VALUE2_TWO": "three" };
    var templateConditions = [
      {
        "columnName": "A_TYPE",
        "conditionalValue": "=",
        "columnValue": "DA"
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

  it('should test for checkAllTemplateConditionalValues without templatedUsed so check for multiple condition', function () {
    var templateUsed = false;
    var dataRow = { "A_TYPE": 'ACC', "STATUS_CODE": "4", "VALUE2_TWO": "three" };
    var templateConditions = [
      {
        "columnName": "A_TYPE",
        "conditionalValue": "!=",
        "columnValue": "DA"
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

  it('should test for checkAllTemplateConditionalValues without templatedUsed so check for multiple condition', function () {
    var templateUsed = false;
    var dataRow = { "A_TYPE": 'ACC', "STATUS_CODE": "4", "VALUE2_TWO": "three" };
    var templateConditions = [
      {
        "columnName": "A_TYPE",
        "conditionalValue": "!=",
        "columnValue": "DA"
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
      "columnName": "A_TYPE",
      "conditionalValue": "=",
      "columnValue": "DA"
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

  it('should test for checkTemplateConditionalValue - uniqueIdentifier', function () {
    var dataRowValue = undefined;
    var templateCondition = {
      "uniqueIdentifier" : {
        "prefix": "VAL",
        "suffix": "NAME"
      }
    };
    var indexValue = 0
    var contents = utils.checkTemplateConditionalValue(dataRowValue, templateCondition, indexValue);
    expect(contents).to.equal(false);
  });

  it('should test for checkTemplateConditionalValue (error - no columnValue)', function () {
    var dataRowValue = undefined;
    var templateCondition = {
      "columnName": "STATUS_CODE",
      "conditionalValue": "$",
    };

    var err = 'template condition does not have "columnValue" or "uniqueIdentifier" property'
    expect(function () { utils.checkTemplateConditionalValue(dataRowValue, templateCondition); }).to.throw(err)
  });

  it('should test for checkTemplateConditionalValue (error - no columnValue or uniqueIdentifier)', function () {
    var dataRowValue = undefined;
    var templateCondition = {};

    var err = 'template condition does not have "columnValue" or "uniqueIdentifier" property'
    expect(function () { utils.checkTemplateConditionalValue(dataRowValue, templateCondition); }).to.throw(err)
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
          "fileName": "search.xml"
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
            "fileName": "search_Item.xml",
            "replacementParamName": "{REPLACE_VALUE}"
          }
        ]
      }
    };
    var dataRow = { "VALUE1_ONE": "four", "VALUE1_TWO": "two", "VALUE2_ONE": 'one', "VALUE2_TWO": "three" };
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
          "fileName": "search.xml"
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
            "fileName": "search_Item.xml",
            "replacementParamName": "{REPLACE_VALUE}"
          }
        ]
      }
    };
    var dataRow = { "VALUE1_ONE": "four", "VALUE1_TWO": "two", "VALUE2_ONE": 'one', "VALUE2_TWO": "three" };
    var otherTemplate = {
      "path": "data/template/",
      "fileName": "search.xml"
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
          "fileName": "search.xml"
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
            "fileName": "search_Item.xml",
            "replacementParamName": "{REPLACE_VALUE}"
          }
        ]
      }
    };
    var dataRow = { "VALUE1_ONE": "four", "VALUE1_TWO": "two", "VALUE2_ONE": 'one', "VALUE2_TWO": "three" };
    var otherTemplate = {
      "path": "data/template/",
      "fileName": "search.xml"
    };
    simple.mock(utils, 'readFile').returnWith('abc');
    simple.mock(utils, 'getParameters').returnWith([]);
    simple.mock(utils, 'replaceValues').returnWith('x');
    var contents = utils.useOtherTemplate(genObj, otherTemplate, dataRow);
    expect(contents).to.equal('abc');
  });
});

describe('unit tests for generateSimulatorConfig function in generator', function () {
  it('should test default simulator config', function () {
    var simObj = {
      "simulatorConfigOutput": "output/00Sim/",
      "simulatorFilename": "00-sim-all",
      "simulatorConfigTemplatePath": "data/template/",
      "simulatorConfigTemplate": "SIM_All.xml",
      "simulatorConfigFilenameParam": "{FILE_NAME}"
    };
    var dataRow = { "VALUE1_ONE": "four", "VALUE1_TWO": "two", "VALUE2_ONE": 'one', "VALUE2_TWO": "three" };
    var simTemplate = 'xzzz';
    var simParameters = ["VALUE1_ONE", "VALUE2_ONE"];
    var simFile = "abc {VALUE1_ONE} def";
    simple.mock(utils, 'replaceValues').returnWith('aav'); //doesn't return array, just a string
    var contents = utils.generateSimulatorConfig(dataRow, simObj, simTemplate, simParameters, simFile);
    expect(contents).to.equal('aav');
  });

  it('should test default simulator config with single condition', function () {
    var simObj = {
      "simulatorConfigOutput": "output/00Sim/",
      "simulatorFilename": "00-sim-all",
      "simulatorConfigTemplatePath": "data/template/",
      "simulatorConfigTemplate": "SIM_All.xml",
      "simulatorConfigFilenameParam": "{FILE_NAME}",
      "condition":           {
        "columnName": "VALUE1_ONE",
        "conditionalValue": "!=",
        "columnValue": "%EMPTY%",
        "format": "%NO SPACES%"
      }
    };
    var dataRow = { "VALUE1_ONE": "four", "VALUE1_TWO": "two", "VALUE2_ONE": 'one', "VALUE2_TWO": "three" };
    var simTemplate = 'xzzz';
    var simParameters = ["VALUE1_ONE", "VALUE2_ONE"];
    var simFile = "abc {VALUE1_ONE} def";
    simple.mock(utils, 'replaceValues').returnWith('aaa'); //doesn't return array, just a string
    var contents = utils.generateSimulatorConfig(dataRow, simObj, simTemplate, simParameters, simFile);
    expect(contents).to.equal('aaa');
  });

  it('should test default simulator config with single condition and format', function () {
    var simObj = {
      "simulatorConfigOutput": "output/00Sim/",
      "simulatorFilename": "00-sim-all",
      "simulatorConfigTemplatePath": "data/template/",
      "simulatorConfigTemplate": "SIM_All.xml",
      "simulatorConfigFilenameParam": "{FILE_NAME}",
      "condition":           {
        "columnName": "VALUE1_ONE",
        "conditionalValue": "!=",
        "columnValue": "%EMPTY%",
        "format": "%USE_BACKSLASH_APOSTROPHE%"
      }
    };
    var dataRow = { "VALUE1_ONE": "four", "VALUE1_TWO": "two", "VALUE2_ONE": 'one', "VALUE2_TWO": "three" };
    var simTemplate = 'xzzz';
    var simParameters = ["VALUE1_ONE", "VALUE2_ONE"];
    var simFile = "abc {VALUE1_ONE} def";
    simple.mock(utils, 'replaceValues').returnWith('bbb'); //doesn't return array, just a string
    var contents = utils.generateSimulatorConfig(dataRow, simObj, simTemplate, simParameters, simFile);
    expect(contents).to.equal('bbb');
  });

  it('should test default simulator config with single condition unknown format', function () {
    var simObj = {
      "simulatorConfigOutput": "output/00Sim/",
      "simulatorFilename": "00-sim-all",
      "simulatorConfigTemplatePath": "data/template/",
      "simulatorConfigTemplate": "SIM_All.xml",
      "simulatorConfigFilenameParam": "{FILE_NAME}",
      "condition":           {
        "columnName": "VALUE1_ONE",
        "conditionalValue": "!=",
        "columnValue": "%EMPTY%",
        "format": "%USE_BACKSLASH%"
      }
    };
    var dataRow = { "VALUE1_ONE": "four", "VALUE1_TWO": "two", "VALUE2_ONE": 'one', "VALUE2_TWO": "three" };
    var simTemplate = 'xzzz';
    var simParameters = ["VALUE1_ONE", "VALUE2_ONE"];
    var simFile = "abc {VALUE1_ONE} def";
    simple.mock(utils, 'replaceValues').returnWith('bbb'); //doesn't return array, just a string
    var contents = utils.generateSimulatorConfig(dataRow, simObj, simTemplate, simParameters, simFile);
    expect(contents).to.equal('bbb');
  });

  it('should test default simulator config with single condition no format', function () {
    var simObj = {
      "simulatorConfigOutput": "output/00Sim/",
      "simulatorFilename": "00-sim-all",
      "simulatorConfigTemplatePath": "data/template/",
      "simulatorConfigTemplate": "SIM_All.xml",
      "simulatorConfigFilenameParam": "{FILE_NAME}",
      "condition":           {
        "columnName": "VALUE1_ONE",
        "conditionalValue": "!=",
        "columnValue": "%EMPTY%"
      }
    };
    var dataRow = { "VALUE1_ONE": "four", "VALUE1_TWO": "two", "VALUE2_ONE": 'one', "VALUE2_TWO": "three" };
    var simTemplate = 'xzzz';
    var simParameters = ["VALUE1_ONE", "VALUE2_ONE"];
    var simFile = "abc {VALUE1_ONE} def";
    simple.mock(utils, 'replaceValues').returnWith('bbb'); //doesn't return array, just a string
    var contents = utils.generateSimulatorConfig(dataRow, simObj, simTemplate, simParameters, simFile);
    expect(contents).to.equal('bbb');
  });

  it('should test default simulator config with single condition not met', function () {
    var simObj = {
      "simulatorConfigOutput": "output/00Sim/",
      "simulatorFilename": "00-sim-all",
      "simulatorConfigTemplatePath": "data/template/",
      "simulatorConfigTemplate": "SIM_All.xml",
      "simulatorConfigFilenameParam": "{FILE_NAME}",
      "condition":           {
        "columnName": "VALUE1_ONE",
        "conditionalValue": "==",
        "columnValue": "%EMPTY%",
        "format": "%USE_BACKSLASH_APOSTROPHE%"
      }
    };
    var dataRow = { "VALUE1_ONE": "four", "VALUE1_TWO": "two", "VALUE2_ONE": 'one', "VALUE2_TWO": "three" };
    var simTemplate = 'xzzz';
    var simParameters = ["VALUE1_ONE", "VALUE2_ONE"];
    var simFile = "abc {VALUE1_ONE} def";
    simple.mock(utils, 'replaceValues').returnWith('bbb'); //doesn't return array, just a string
    var contents = utils.generateSimulatorConfig(dataRow, simObj, simTemplate, simParameters, simFile);
    expect(contents).to.equal(undefined);
  });

  describe('unit tests for generateAdditionalSimulatorConfig function in generator', function () {
    it('should test for generateAdditionalSimulatorConfig with additional sim config', function () {

      var dataRow = { "A_TYPE": 'ACC', "STATUS_CODE": "4", "VALUE2_TWO": "three" };
      var additionalSimObj = [{
        "name": "additional simulator config name",
        "simulatorConfigTemplatePath": "data/template/",
        "simulatorConfigTemplate": "SIM_ADDITIONAL_CONFIG_FILE.xml",
        "simulatorConfigFilenameParam": "{FILE_NAME}",
        "condition": [
          {
            "columnName": "A_TYPE",
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

    it('should test for generateAdditionalSimulatorConfig with additional sim config (encode spaces)', function () {

      var dataRow = { "A_TYPE": 'A TYP', "STATUS_CODE": "4", "VALUE2_TWO": "three" };
      var additionalSimObj = [{
        "name": "additional simulator config name",
        "simulatorConfigTemplatePath": "data/template/",
        "simulatorConfigTemplate": "SIM_ADDITIONAL_CONFIG_FILE.xml",
        "simulatorConfigFilenameParam": "{FILE_NAME}",
        "condition": [
          {
            "columnName": "A_TYPE",
            "conditionalValue": "!=",
            "columnValue": "%EMPTY%",
            "format": "%ENCODE SPACES%"
          }
        ]
      }];

      simple.mock(utils, 'checkTemplateConditionalValue').returnWith(true);
      simple.mock(utils, 'readFile').returnWith('{A_TYPE} aaa');

      var contents = utils.generateAdditionalSimulatorConfig(dataRow, additionalSimObj);
      expect(contents).to.equal('A%20TYP aaa');
    });

    it('should test for generateAdditionalSimulatorConfig with additional sim config (encode spaces - replaceWith)', function () {

      var dataRow = { "A_TYPE": 'A TYPE', "STATUS_CODE": "4", "VALUE2_TWO": "three" };
      var additionalSimObj = [{
        "name": "additional simulator config name",
        "simulatorConfigTemplatePath": "data/template/",
        "simulatorConfigTemplate": "SIM_ADDITIONAL_CONFIG_FILE.xml",
        "simulatorConfigFilenameParam": "{FILE_NAME}",
        "condition": [
          {
            "columnName": "A_TYPE",
            "conditionalValue": "!=",
            "columnValue": "%EMPTY%",
            "format": "%ENCODE SPACES%",
            "encodeWith": "+"
          }
        ]
      }];

      simple.mock(utils, 'checkTemplateConditionalValue').returnWith(true);
      simple.mock(utils, 'readFile').returnWith('{A_TYPE} aaa');
      var contents = utils.generateAdditionalSimulatorConfig(dataRow, additionalSimObj);
      expect(contents).to.equal('A+TYPE aaa');
    });

    it('should test for generateAdditionalSimulatorConfig with additional sim config and condition with no format option', function () {

      var dataRow = { "A_TYPE": 'A TYPE', "STATUS_CODE": "4", "VALUE2_TWO": "three" };
      var additionalSimObj = [{
        "name": "additional simulator config name",
        "simulatorConfigTemplatePath": "data/template/",
        "simulatorConfigTemplate": "SIM_ADDITIONAL_CONFIG_FILE.xml",
        "simulatorConfigFilenameParam": "{FILE_NAME}",
        "condition": [
          {
            "columnName": "A_TYPE",
            "conditionalValue": "!=",
            "columnValue": "%EMPTY%"
          }
        ]
      }];

      simple.mock(utils, 'checkTemplateConditionalValue').returnWith(false);
      simple.mock(utils, 'readFile').returnWith('{A_TYPE} aaa');
      var contents = utils.generateAdditionalSimulatorConfig(dataRow, additionalSimObj);
      expect(contents).to.equal('');
    });

    it('should test for generateAdditionalSimulatorConfig with additional sim config and multiple conditions', function () {

      var dataRow = { "A_TYPE": 'ACC', "STATUS_CODE": "4", "VALUE2_TWO": "three" };
      var additionalSimObj = [{
        "name": "additional simulator config name",
        "simulatorConfigTemplatePath": "data/template/",
        "simulatorConfigTemplate": "SIM_ADDITIONAL_CONFIG_FILE.xml",
        "simulatorConfigFilenameParam": "{FILE_NAME}",
        "condition": [
          {
            "columnName": "A_TYPE",
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

      var contents = utils.generateAdditionalSimulatorConfig(dataRow, additionalSimObj);
      expect(contents).to.equal('abc defabc def');
    });

    it('should test for generateAdditionalSimulatorConfig with additional sim config with no condition', function () {

      var dataRow = { "A_TYPE": 'ACC', "STATUS_CODE": "4", "VALUE2_TWO": "three" };
      var additionalSimObj = [{
        "name": "additional simulator config name",
        "simulatorConfigTemplatePath": "data/template/",
        "simulatorConfigTemplate": "SIM_ADDITIONAL_CONFIG_FILE.xml",
        "simulatorConfigFilenameParam": "{FILE_NAME}"
      }];

      simple.mock(utils, 'checkTemplateConditionalValue').returnWith(true);
      simple.mock(utils, 'readFile').returnWith('{A_TYPE} def');

      var contents = utils.generateAdditionalSimulatorConfig(dataRow, additionalSimObj);
      expect(contents).to.equal('');
    });

    it('should test for generateAdditionalSimulatorConfig with columnName not matching', function () {

      var dataRow = { "A_TYPE": 'ACC', "STATUS_CODE": "4", "VALUE2_TWO": "three" };
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
      simple.mock(utils, 'readFile').returnWith('{A_TYPE} def');

      var contents = utils.generateAdditionalSimulatorConfig(dataRow, additionalSimObj);
      expect(contents).to.equal('');
    });

  });

  describe('unit tests for generateSimulatorJSONResponse', function () {
    it('should test simulator config with jsonPrimaryNode', function () {
      var simObj = {
        "simulatorConfigOutput": "output/00Sim/",
        "simulatorConfigTemplatePath": "data/template/",
        "jsonPrimaryNode": "allValues",
        "jsonMap": {
          "VALUE1_ONE": "v1",
          "VALUE2_ONE": "v2"
        }
      };
      var dataRow = { "VALUE1_ONE": "four", "VALUE1_TWO": "two", "VALUE2_ONE": 'one', "VALUE2_TWO": "three" };
      var generatedFilename = "00-sim-all.json";
      simple.mock(utils, 'replaceValues').returnWith('aav');
      var contents = utils.generateSimulatorJSONResponse(dataRow, simObj, generatedFilename);
      expect(JSON.stringify(contents)).to.equal('{"VALUE1_ONE":"v1","VALUE2_ONE":"v2"}');
    });

    it('should test simulator config with jsonPrimaryNode with filename', function () {
      var simObj = {
        "simulatorConfigOutput": "output/00Sim/",
        "simulatorConfigTemplatePath": "data/template/",
        "jsonPrimaryNode": "allValues",
        "jsonMap": {
          "fileName": "{FILE_NAME}",
          "matchString": "{VALUE2_ONE}"
        }
      };
      var dataRow = { "VALUE1_ONE": "four", "VALUE1_TWO": "two", "VALUE2_ONE": 'one', "VALUE2_TWO": "three" };
      var generatedFilename = "00-sim-all.json";
      simple.mock(utils, 'replaceValues').returnWith('aav');
      var contents = utils.generateSimulatorJSONResponse(dataRow, simObj, generatedFilename);
      expect(JSON.stringify(contents)).to.equal('{"fileName":"00-sim-all.json","matchString":"one"}');
    });
  })
})

describe('unit tests for getDefaultTemplate function in generator', function () {
  it('should test for getDefaultTemplate', function () {

    var generatorObj = {
      "profileName": "test-profile",
      "sheetName": "Sheet 1",
      "templates": [
        {
          "name": "default",
          "path": "data/template/",
          "fileName": "search.xml"
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
            "fileName": "search_Item.xml",
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
          "fileName": "search.xml"
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
    assert.throws(utils.getNamedTemplate, Error);
    // message can vary depending on how it's run
    // assert.throws(utils.getNamedTemplate, Error, "Cannot read properties of undefined");
    // assert.throws(utils.getNamedTemplate, Error, "Cannot read property \'templates\' of undefined");
  });

  it('should test for getNamedTemplate for undefined template', function () {
    var templateName = 'abc';
    var generatorObj = {
      "peter": [
        {
          "name": "abc",
          "path": "data/template/",
          "fileName": "search.xml"
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

    var fileName = './test/data/config/basic.json';
    utils.generateTemplateWithJSON(fileName);

    var simFiles = utils.getFiles('test/data/output/00Simulator/', simFiles);
    var configFiles = utils.getFiles('test/data/output/sample/', configFiles);

    expect(fs.existsSync('test/data/output/00Simulator')).to.equal(true);
    expect(simFiles.length).to.equal(1);
    expect(fs.existsSync('test/data/output/00Simulator/00-sim-basic.xml')).to.equal(true);
    expect(configFiles.length).to.equal(2);
    expect(fs.existsSync('test/data/output/sample/BASIC-001.xml')).to.equal(true);
    expect(fs.existsSync('test/data/output/sample/BASIC-002.xml')).to.equal(true);

    var simFile = utils.readFile('output/00Simulator/00-sim-basic.xml');
    var simParams = utils.getParameters(simFile);
    expect(simParams.length).to.equal(0);
    expect(simFile).to.contain('<applicable-to>sim-endpoint-config-name</applicable-to>');

    var genFile = utils.readFile('output/sample/BASIC-001.xml');
    var genParams = utils.getParameters(genFile);
    expect(genParams.length).to.equal(0);
    expect(genFile).to.contain('<UNIQUE_ID>001</UNIQUE_ID>');
    expect(genFile).to.contain('<VALUE1>Value1</VALUE1>');
    expect(genFile).to.contain('<VALUE2>Value1</VALUE2>');
  });

  it('should test for generateTemplateWithJSON with no simulator config', function () {

    var fileName = './test/data/config/basic-no-simulator.json';
    utils.generateTemplateWithJSON(fileName);

    var configFiles = utils.getFiles('test/data/output/sample/', configFiles);

    expect(fs.existsSync('test/data/output/00Simulator')).to.equal(false);
    expect(configFiles.length).to.equal(3);
    expect(fs.existsSync('test/data/output/sample/BASIC-001.xml')).to.equal(true);
    expect(fs.existsSync('test/data/output/sample/BASIC-002.xml')).to.equal(true);
    expect(fs.existsSync('test/data/output/sample/BASIC-003.xml')).to.equal(true);

    var genFile = utils.readFile('output/sample/BASIC-001.xml');
    var genParams = utils.getParameters(genFile);
    expect(genParams.length).to.equal(0);
    expect(genFile).to.contain('<UNIQUE_ID>001</UNIQUE_ID>');
    expect(genFile).to.contain('<VALUE1>Value1</VALUE1>');
    expect(genFile).to.contain('<VALUE2>Value1</VALUE2>');

  });

  it('should test for generateTemplateWithJSON with no start and end rows', function () {

    var fileName = './test/data/config/basic-no-start-end-rows.json';
    utils.generateTemplateWithJSON(fileName);

    var configFiles = utils.getFiles('test/data/output/sample/', configFiles);

    expect(fs.existsSync('test/data/output/00Simulator')).to.equal(false);
    expect(configFiles.length).to.equal(3);
    expect(fs.existsSync('test/data/output/sample/BASIC-001.xml')).to.equal(true);
    expect(fs.existsSync('test/data/output/sample/BASIC-002.xml')).to.equal(true);
    expect(fs.existsSync('test/data/output/sample/BASIC-003.xml')).to.equal(true);

    var genFile = utils.readFile('output/sample/BASIC-001.xml');
    var genParams = utils.getParameters(genFile);
    expect(genParams.length).to.equal(0);
    expect(genFile).to.contain('<UNIQUE_ID>001</UNIQUE_ID>');
    expect(genFile).to.contain('<VALUE1>Value1</VALUE1>');
    expect(genFile).to.contain('<VALUE2>Value1</VALUE2>');

  });

  it('should test for generateTemplateWithJSON for basic config and simulator config with conditions', function () {

    var fileName = './test/data/config/basic-sim-config-with-condition.json';
    utils.generateTemplateWithJSON(fileName);

    var simFiles = utils.getFiles('test/data/output/00Simulator/', simFiles);
    var configFiles = utils.getFiles('test/data/output/sample/', configFiles);

    expect(fs.existsSync('test/data/output/00Simulator')).to.equal(true);
    expect(simFiles.length).to.equal(1);
    expect(fs.existsSync('test/data/output/00Simulator/00-sim-basic.xml')).to.equal(true);
    expect(configFiles.length).to.equal(2);
    expect(fs.existsSync('test/data/output/sample/BASIC-001.xml')).to.equal(true);
    expect(fs.existsSync('test/data/output/sample/BASIC-002.xml')).to.equal(true);

    var simFile = utils.readFile('output/00Simulator/00-sim-basic.xml');
    var simParams = utils.getParameters(simFile);
    expect(simParams.length).to.equal(0);
    expect(simFile).to.contain('<applicable-to>sim-endpoint-config-name</applicable-to>');
    expect(simFile).to.contain('<request-expression>request contains \'ColName>OtherValue\'</request-expression>');

    var genFile = utils.readFile('output/sample/BASIC-001.xml');
    var genParams = utils.getParameters(genFile);
    expect(genParams.length).to.equal(0);
    expect(genFile).to.contain('<UNIQUE_ID>001</UNIQUE_ID>');
    expect(genFile).to.contain('<VALUE1>Value1</VALUE1>');
    expect(genFile).to.contain('<VALUE2>Value1</VALUE2>');
  });

  it('should test for generateTemplateWithJSON with multiple templates', function () {

    var fileName = './test/data/config/multi-template-with-conditions.json';
    utils.generateTemplateWithJSON(fileName);

    var configFiles = utils.getFiles('test/data/output/sample/', configFiles);

    expect(fs.existsSync('test/data/output/00Simulator')).to.equal(false);
    expect(configFiles.length).to.equal(2);
    expect(fs.existsSync('test/data/output/sample/BASIC-001.xml')).to.equal(true);
    expect(fs.existsSync('test/data/output/sample/BASIC-002.xml')).to.equal(false);
    expect(fs.existsSync('test/data/output/sample/BASIC-003.xml')).to.equal(true);

    var genFile = utils.readFile('output/sample/BASIC-001.xml');
    var genParams = utils.getParameters(genFile);
    expect(genParams.length).to.equal(0);
    expect(genFile).to.contain('<UNIQUE_ID>001</UNIQUE_ID>');
    expect(genFile).to.contain('<VALUE1>Value1</VALUE1>');
    expect(genFile).to.contain('<VALUE2>Value1</VALUE2>');

  });

  it('should test for generateTemplateWithJSON with filtered templates', function () {

    var fileName = './test/data/config/filtered-template.json';
    utils.generateTemplateWithJSON(fileName);

    var configFiles = utils.getFiles('test/data/output/sample/', configFiles);

    expect(fs.existsSync('test/data/output/00Simulator')).to.equal(true);
    expect(configFiles.length).to.equal(2);
    expect(fs.existsSync('test/data/output/sample/BASIC-001.xml')).to.equal(true);
    expect(fs.existsSync('test/data/output/sample/BASIC-002.xml')).to.equal(true);
    expect(fs.existsSync('test/data/output/sample/BASIC-003.xml')).to.equal(false);

    var genFile = utils.readFile('output/sample/BASIC-001.xml');
    var genParams = utils.getParameters(genFile);
    expect(genParams.length).to.equal(0);
    expect(genFile).to.contain('<UNIQUE_ID>001</UNIQUE_ID>');
    expect(genFile).to.contain('<VALUE1>Value1</VALUE1>');
    expect(genFile).to.contain('<VALUE2>Value1</VALUE2>');
    expect(genFile).to.contain('<FILTER-VALUE1>Matched1</FILTER-VALUE1>');
    expect(genFile).to.contain('<FILTER-VALUE2>&apos;001</FILTER-VALUE2>');

  });

  it('should test for generateTemplateWithJSON with filtered templates (json)', function () {

    var fileName = './test/data/config/json-filtered-template.json';
    utils.generateTemplateWithJSON(fileName);

    var configFiles = utils.getFiles('test/data/output/sample/', configFiles);

    expect(fs.existsSync('test/data/output/00Simulator')).to.equal(true);
    expect(configFiles.length).to.equal(2);
    expect(fs.existsSync('test/data/output/sample/BASIC-001.json')).to.equal(true);
    expect(fs.existsSync('test/data/output/sample/BASIC-002.json')).to.equal(true);
    expect(fs.existsSync('test/data/output/sample/BASIC-003.json')).to.equal(false);

    var genFile = utils.readFile('output/sample/BASIC-001.json');
    var genParams = utils.getParameters(genFile);
    expect(genParams.length).to.equal(0);
    expect(genFile).to.contain('"id": "001"');
    expect(genFile).to.contain('"value1": "Value1"');
    expect(genFile).to.contain('"value2": "Value1"');
    expect(genFile).to.contain('"existingValue": "existing value goes here"');
    expect(genFile).to.contain('"filterValue1": "\'002"');
    expect(genFile).to.contain('"filterValue2": "Matched1"');
  });

  it('should test for generateTemplateWithJSON with filtered templates with separator', function () {

    var fileName = './test/data/config/json-filtered-template-with-separator.json';
    utils.generateTemplateWithJSON(fileName);

    var configFiles = utils.getFiles('test/data/output/sample/', configFiles);

    expect(fs.existsSync('test/data/output/00Simulator')).to.equal(true);
    expect(configFiles.length).to.equal(2);
    expect(fs.existsSync('test/data/output/sample/BASIC-001.json')).to.equal(true);
    expect(fs.existsSync('test/data/output/sample/BASIC-002.json')).to.equal(true);
    expect(fs.existsSync('test/data/output/sample/BASIC-003.json')).to.equal(false);

    var genFile = utils.readFile('output/sample/BASIC-001.json');
    var genParams = utils.getParameters(genFile);
    expect(genParams.length).to.equal(0);
    expect(genFile).to.contain('"id": "001"');
    expect(genFile).to.contain('"value1": "Value1"');
    expect(genFile).to.contain('"value2": "Value1"');
    expect(genFile).to.contain('"existingValue": "existing value goes here"');
    expect(genFile).to.contain('"\'001 Matched1" ||   "\'002 Matched1"');
  });

  it('should test for generateTemplateWithJSON with filtered templates (applyTemplate)', function () {

    // multi level filter template
    var fileName = './test/data/config/json-filtered-template-with-apply-template.json';
    utils.generateTemplateWithJSON(fileName);

    var configFiles = utils.getFiles('test/data/output/sample/', configFiles);

    expect(fs.existsSync('test/data/output/00Simulator')).to.equal(true);
    expect(configFiles.length).to.equal(2);
    expect(fs.existsSync('test/data/output/sample/BASIC-001.json')).to.equal(true);
    expect(fs.existsSync('test/data/output/sample/BASIC-002.json')).to.equal(true);
    expect(fs.existsSync('test/data/output/sample/BASIC-003.json')).to.equal(false);

    var genFile = utils.readFile('output/sample/BASIC-001.json');
    var genParams = utils.getParameters(genFile);
    expect(genParams.length).to.equal(0);
    expect(genFile).to.contain('"id": "001"');
    expect(genFile).to.contain('"value1": "Value1"');
    expect(genFile).to.contain('"value2": "Value1"');
    expect(genFile).to.contain('"existingValue": "existing value goes here"');
    expect(genFile).to.contain('"filterValue2": "Matched1"');
  });

  it('should test for generateTemplateWithJSON with filtered templates with condition', function () {

    var fileName = './test/data/config/json-filtered-template-with-condition.json';
    utils.generateTemplateWithJSON(fileName);

    var configFiles = utils.getFiles('test/data/output/sample/', configFiles);

    expect(fs.existsSync('test/data/output/00Simulator')).to.equal(true);
    expect(configFiles.length).to.equal(2);
    expect(fs.existsSync('test/data/output/sample/BASIC-001.json')).to.equal(true);
    expect(fs.existsSync('test/data/output/sample/BASIC-002.json')).to.equal(true);
    expect(fs.existsSync('test/data/output/sample/BASIC-003.json')).to.equal(false);

    var genFile = utils.readFile('output/sample/BASIC-001.json');
    var genParams = utils.getParameters(genFile);
    expect(genParams.length).to.equal(0);
    expect(genFile).to.contain('"id": "001"');
    expect(genFile).to.contain('"value1": "Value1"');
    expect(genFile).to.contain('"value2": "Value1"');
    expect(genFile).to.contain('"existingValue": "existing value goes here"');
    expect(genFile).to.contain('"filterValue1": "\'002"');
    expect(genFile).to.contain('"filterValue2": "Matched1"');
  });

  it('should test for generateTemplateWithJSON with mapped templates', function () {

    var fileName = './test/data/config/mapped-template.json';
    utils.generateTemplateWithJSON(fileName);

    var configFiles = utils.getFiles('test/data/output/sample/', configFiles);

    expect(fs.existsSync('test/data/output/00Simulator')).to.equal(true);
    expect(configFiles.length).to.equal(3);
    expect(fs.existsSync('test/data/output/sample/BASIC-001.xml')).to.equal(true);
    expect(fs.existsSync('test/data/output/sample/BASIC-002.xml')).to.equal(true);
    expect(fs.existsSync('test/data/output/sample/BASIC-003.xml')).to.equal(true);

    var genFile = utils.readFile('output/sample/BASIC-001.xml');
    var genParams = utils.getParameters(genFile);
    expect(genParams.length).to.equal(0);
    expect(genFile).to.contain('<UNIQUE_ID>001</UNIQUE_ID>');
    expect(genFile).to.contain('<VALUE1>Value1</VALUE1>');
    expect(genFile).to.contain('<VALUE2>Value1</VALUE2>');
    expect(genFile).to.contain('<MAP>\n        <MAP-VALUE1>Value1</MAP-VALUE1>\n        <MAP-VALUE2>Value1</MAP-VALUE2>\n        <MAP-VALUE3>Value1</MAP-VALUE3>\n    </MAP>\n\n</SampleRs>');

    var genFile2 = utils.readFile('output/sample/BASIC-002.xml');
    var genParams2 = utils.getParameters(genFile2);
    expect(genParams2.length).to.equal(0);
    expect(genFile2).to.contain('<UNIQUE_ID>002</UNIQUE_ID>');
    expect(genFile2).to.contain('<MAP>\n        <MAP-VALUE1>Value1</MAP-VALUE1>\n        <MAP-VALUE2>Value1</MAP-VALUE2>\n        <MAP-VALUE3></MAP-VALUE3>\n    </MAP>\n    <MAP>\n        <MAP-VALUE1>Value</MAP-VALUE1>\n        <MAP-VALUE2>Value</MAP-VALUE2>\n        <MAP-VALUE3>Value</MAP-VALUE3>\n    </MAP>\n\n</SampleRs>');

  });

  it('should test for generateTemplateWithJSON with mapped templates (json)', function () {
    var fileName = './test/data/config/json-mapped-template.json';
    utils.generateTemplateWithJSON(fileName);

    var configFiles = utils.getFiles('test/data/output/sample/', configFiles);

    expect(fs.existsSync('test/data/output/00Simulator')).to.equal(false);

    var genFile = utils.readFile('output/sample/BASIC-001.json');
    var genParams = utils.getParameters(genFile);
    expect(genParams.length).to.equal(0);
    expect(genFile).to.contain('"uniqueId": "001"');
    expect(genFile).to.contain('"value1": "Value1"');
    expect(genFile).to.contain('"value2": "Value1"');
    expect(genFile).to.contain(' "map": [\n    {\n      "mapValue1": "Value1",\n      "mapValue2": "Value1",\n      "mapValue3": "Value1"\n    }\n  ]\n}');

    var genFile2 = utils.readFile('output/sample/BASIC-002.json');
    var genParams2 = utils.getParameters(genFile2);
    expect(genParams2.length).to.equal(0);
    expect(genFile2).to.contain('"uniqueId": "002"');
    expect(genFile2).to.contain('"value1": "Value1"');
    expect(genFile2).to.contain('"value2": "Value1"');
    expect(genFile2).to.contain('"map": [\n    {\n      "mapValue1": "Value",\n      "mapValue2": "Value",\n      "mapValue3": "Value"\n    }\n  ]\n}');

    var genFile3 = utils.readFile('output/sample/BASIC-003.json');
    var genParams3 = utils.getParameters(genFile2);
    expect(genParams3.length).to.equal(0);
    expect(genFile3).to.contain('"uniqueId": "003"');
    expect(genFile3).to.contain('"value1": "Value1"');
    expect(genFile3).to.contain('"value2": "Value1"');
    expect(genFile3).to.contain('"map": [\n    {\n      "mapValue1": "Value1",\n      "mapValue2": "Value1",\n      "mapValue3": null\n    }\n  ]\n}');
  });

  it('should test for generateTemplateWithJSON with mapped templates with transform', function () {

    var fileName = './test/data/config/json-mapped-template-with-transform.json';
    utils.generateTemplateWithJSON(fileName);

    var configFiles = utils.getFiles('test/data/output/sample/', configFiles);

    expect(fs.existsSync('test/data/output/00Simulator')).to.equal(false);

    var genFile = utils.readFile('output/sample/BASIC-001.json');
    var genParams = utils.getParameters(genFile);
    expect(genParams.length).to.equal(0);
    expect(genFile).to.contain('"uniqueId": "001"');
    expect(genFile).to.contain('"value1": "Value1"');
    expect(genFile).to.contain('"value2": "Value1"');
    expect(genFile).to.contain('"map": [\n    {\n      "mapValue1": "value 1",\n      "mapValue2": "value2",\n      "mapValue3": "Value1"\n    }\n  ]\n}');

    var genFile2 = utils.readFile('output/sample/BASIC-002.json');
    var genParams2 = utils.getParameters(genFile2);
    expect(genParams2.length).to.equal(0);
    expect(genFile2).to.contain('"uniqueId": "002"');
    expect(genFile2).to.contain('"value1": "Value1"');
    expect(genFile2).to.contain('"value2": "Value1"');
    expect(genFile2).to.contain('"map": [\n    {\n      "mapValue1": "Value",\n      "mapValue2": "Value",\n      "mapValue3": "Value"\n    }\n  ]\n}');

    var genFile3 = utils.readFile('output/sample/BASIC-003.json');
    var genParams3 = utils.getParameters(genFile2);
    expect(genParams3.length).to.equal(0);
    expect(genFile3).to.contain('"uniqueId": "003"');
    expect(genFile3).to.contain('"value1": "Value1"');
    expect(genFile3).to.contain('"value2": "Value1"');
    expect(genFile3).to.contain('"map": [\n    {\n      "mapValue1": "value 1",\n      "mapValue2": "value2",\n      "mapValue3": null\n    }\n  ]\n}');
  });

  it('should test for generateTemplateWithJSON with mapped templates (split values)', function () {

    var fileName = './test/data/config/json-mapped-template-with-split-values.json';
    utils.generateTemplateWithJSON(fileName);

    var configFiles = utils.getFiles('test/data/output/sample/', configFiles);

    expect(fs.existsSync('test/data/output/00Simulator')).to.equal(false);

    var genFile = utils.readFile('output/sample/BASIC-001.json');
    var genParams = utils.getParameters(genFile);
    expect(genParams.length).to.equal(0);
    expect(genFile).to.contain('"uniqueId": "001"');
    expect(genFile).to.contain('"value1": "Value1"');
    expect(genFile).to.contain('"value2": "Value1"');
    expect(genFile).to.contain('"map": [\n    {\n      "colValue1": "existing value",\n      "altValue": "one"\n    },\n    {\n      "colValue1": "existing value",\n      "altValue": "two"\n    },\n    {\n      "colValue1": "existing value",\n      "altValue": "three"\n    }\n  ]');

    var genFile2 = utils.readFile('output/sample/BASIC-002.json');
    var genParams2 = utils.getParameters(genFile2);
    expect(genParams2.length).to.equal(0);
    expect(genFile2).to.contain('"uniqueId": "002"');
    expect(genFile2).to.contain('"value1": "Value1"');
    expect(genFile2).to.contain('"value2": "Value1"');
    expect(genFile2).to.contain('"map": [\n    {\n      "colValue1": "existing value",\n      "altValue": "four"\n    },\n    {\n      "colValue1": "existing value",\n      "altValue": "five"\n    }\n  ]');

    var genFile3 = utils.readFile('output/sample/BASIC-003.json');
    var genParams3 = utils.getParameters(genFile2);
    expect(genParams3.length).to.equal(0);
    expect(genFile3).to.contain('"uniqueId": "003"');
    expect(genFile3).to.contain('"value1": "Value1"');
    expect(genFile3).to.contain('"value2": "Value1"');
    expect(genFile3).to.contain('"map": [\n    {\n      "colValue1": "existing value",\n      "altValue": "six"\n    }\n  ]');
  });

  it('should test for generateTemplateWithJSON with mapped templates (mappedJSONSection)', function () {

    // childMap
    var fileName = './test/data/config/json-mapped-json-section.json';
    utils.generateTemplateWithJSON(fileName);

    var configFiles = utils.getFiles('test/data/output/sample/', configFiles);

    expect(fs.existsSync('test/data/output/00Simulator')).to.equal(false);

    var genFile = utils.readFile('output/sample/BASIC-001.json');
    var genParams = utils.getParameters(genFile);
    expect(genParams.length).to.equal(0);
    expect(genFile).to.contain('"uniqueId": "001"');
    expect(genFile).to.contain('"value1": "Value1"');
    expect(genFile).to.contain('"value2": "Value1"');
    expect(genFile).to.contain('"map": [\n    {\n      "mapValue": "Value1"\n    }\n  ]');

    var genFile2 = utils.readFile('output/sample/BASIC-002.json');
    var genParams2 = utils.getParameters(genFile2);
    expect(genParams2.length).to.equal(0);
    expect(genFile2).to.contain('"uniqueId": "002"');
    expect(genFile2).to.contain('"value1": "Value1"');
    expect(genFile2).to.contain('"value2": "Value1"');
    expect(genFile2).to.contain('"map": [\n    {\n      "mapValue": "Value"\n    }\n  ]');

    var genFile3 = utils.readFile('output/sample/BASIC-003.json');
    var genParams3 = utils.getParameters(genFile2);
    expect(genParams3.length).to.equal(0);
    expect(genFile3).to.contain('"uniqueId": "003"');
    expect(genFile3).to.contain('"value1": "Value1"');
    expect(genFile3).to.contain('"value2": "Value1"');
    expect(genFile3).to.contain('"map": [\n    {\n      "mapValue": null\n    }\n  ]');
  });

  it('should test for generateTemplateWithJSON with mapped templates with conditions (conditions not met)', function () {

    var fileName = './test/data/config/json-mapped-template-with-conditions.json';
    utils.generateTemplateWithJSON(fileName);

    var configFiles = utils.getFiles('test/data/output/sample/', configFiles);

    expect(fs.existsSync('test/data/output/00Simulator')).to.equal(false);

    var genFile = utils.readFile('output/sample/BASIC-001.json');
    var genParams = utils.getParameters(genFile);
    expect(genParams.length).to.equal(1);
    expect(genFile).to.contain('"uniqueId": "001"');
    expect(genFile).to.contain('"value1": "Value1"');
    expect(genFile).to.contain('"value2": "Value1"');
    // expect nothing to be replaced
    expect(genFile).to.contain('{REPLACEMENT_PARAMETER}\n}');
  });

  it('should test for generateTemplateWithJSON with other template', function () {

    var fileName = './test/data/config/basic-other-template.json';
    utils.generateTemplateWithJSON(fileName);

    var configFiles = utils.getFiles('test/data/output/sample/', configFiles);

    expect(fs.existsSync('test/data/output/00Simulator')).to.equal(false);
    expect(configFiles.length).to.equal(3);
    expect(fs.existsSync('test/data/output/sample/BASIC-001.xml')).to.equal(true);
    expect(fs.existsSync('test/data/output/sample/BASIC-002.xml')).to.equal(true);
    expect(fs.existsSync('test/data/output/sample/BASIC-003.xml')).to.equal(true);

    var genFile = utils.readFile('output/sample/BASIC-001.xml');
    var genParams = utils.getParameters(genFile);
    expect(genParams.length).to.equal(0);
    expect(genFile).to.contain('<UNIQUE_ID>001</UNIQUE_ID>');
    expect(genFile).to.contain('<ERROR_VALUE1>Value1</ERROR_VALUE1>');

    var genFile2 = utils.readFile('output/sample/BASIC-002.xml');
    var genParams2 = utils.getParameters(genFile2);
    expect(genParams2.length).to.equal(0);
    expect(genFile2).to.contain('<UNIQUE_ID>002</UNIQUE_ID>');
    expect(genFile2).to.contain('<VALUE1>Value1</VALUE1>');
    expect(genFile2).to.contain('<VALUE2>Value1</VALUE2>');

  });

  it('should test for generateTemplateWithJSON with simulator template with additional config', function () {

    var fileName = './test/data/config/basic-additional-simulator.json';
    utils.generateTemplateWithJSON(fileName);

    var configFiles = utils.getFiles('test/data/output/sample/', configFiles);

    expect(fs.existsSync('test/data/output/00Simulator')).to.equal(true);
    expect(configFiles.length).to.equal(2);
    expect(fs.existsSync('test/data/output/sample/BASIC-001.xml')).to.equal(true);
    expect(fs.existsSync('test/data/output/sample/BASIC-002.xml')).to.equal(true);
    expect(fs.existsSync('test/data/output/sample/BASIC-003.xml')).to.equal(false);

    var genFile2 = utils.readFile('output/sample/BASIC-002.xml');
    var genParams2 = utils.getParameters(genFile2);
    expect(genParams2.length).to.equal(0);
    expect(genFile2).to.contain('<UNIQUE_ID>002</UNIQUE_ID>');
    expect(genFile2).to.contain('<VALUE1>Value1</VALUE1>');
    expect(genFile2).to.contain('<VALUE2>Value1</VALUE2>');

  });

  it('should test for generateTemplateWithJSON with use existing filename set', function () {

    var fileName = './test/data/config/basic-use-existing-file.json';
    utils.generateTemplateWithJSON(fileName);

    var configFiles = utils.getFiles('test/data/output/sample/', configFiles);

    expect(fs.existsSync('test/data/output/00Simulator')).to.equal(true);
    expect(configFiles.length).to.equal(3);
    expect(fs.existsSync('test/data/output/sample/BASIC-001.xml')).to.equal(true);
    expect(fs.existsSync('test/data/output/sample/BASIC-002.xml')).to.equal(true);
    expect(fs.existsSync('test/data/output/sample/BASIC-003.xml')).to.equal(true);
    expect(fs.existsSync('test/data/output/sample/BASIC-004.xml')).to.equal(false);

    var genFile2 = utils.readFile('output/sample/BASIC-002.xml');
    var genParams2 = utils.getParameters(genFile2);
    expect(genParams2.length).to.equal(0);
    expect(genFile2).to.contain('<UNIQUE_ID>002</UNIQUE_ID>');
    expect(genFile2).to.contain('<VALUE1>Value1</VALUE1>');
    expect(genFile2).to.contain('<VALUE2>Value1</VALUE2>');

  });

  it('should test for generateTemplateWithJSON with parameter template', function () {

    var fileName = './test/data/config/parameter-template.json';
    utils.generateTemplateWithJSON(fileName);

    var configFiles = utils.getFiles('test/data/output/sample/', configFiles);

    expect(fs.existsSync('test/data/output/00Simulator')).to.equal(false);
    expect(configFiles.length).to.equal(3);
    expect(fs.existsSync('test/data/output/sample/BASIC-001.xml')).to.equal(true);
    expect(fs.existsSync('test/data/output/sample/BASIC-002.xml')).to.equal(true);
    expect(fs.existsSync('test/data/output/sample/BASIC-003.xml')).to.equal(true);

    var genFile2 = utils.readFile('output/sample/BASIC-002.xml');
    var genParams2 = utils.getParameters(genFile2);
    expect(genParams2.length).to.equal(0);
    expect(genFile2).to.contain('<UNIQUE_ID>002</UNIQUE_ID>');
    expect(genFile2).to.contain('<VALUE1>Value1</VALUE1>');
    expect(genFile2).to.contain('<VALUE2>Value1</VALUE2>');
    expect(genFile2).to.contain('        <PARAM-TEMPLATE-VALUE1>001</PARAM-TEMPLATE-VALUE1>\n    <PARAM-TEMPLATE-VALUE2>ABC</PARAM-TEMPLATE-VALUE2>\n    <PARAM-TEMPLATE-VALUE3>002</PARAM-TEMPLATE-VALUE3>\n    <PARAM-TEMPLATE-VALUE4>DEF</PARAM-TEMPLATE-VALUE4>\n    <PARAM-TEMPLATE-VALUE5>003</PARAM-TEMPLATE-VALUE5>\n    <PARAM-TEMPLATE-VALUE6>GHI</PARAM-TEMPLATE-VALUE6>\n</SampleRs>')

  });

  it('should test for generateTemplateWithJSON with position based template', function () {

    var fileName = './test/data/config/position-based-template.json';
    utils.generateTemplateWithJSON(fileName);

    var configFiles = utils.getFiles('test/data/output/sample/', configFiles);

    expect(fs.existsSync('test/data/output/00Simulator')).to.equal(true);
    expect(configFiles.length).to.equal(3);
    expect(fs.existsSync('test/data/output/sample/BASIC-001.txt')).to.equal(true);
    expect(fs.existsSync('test/data/output/sample/BASIC-002.txt')).to.equal(true);
    expect(fs.existsSync('test/data/output/sample/BASIC-003.txt')).to.equal(true);

    var genFile1 = utils.readFile('output/sample/BASIC-001.txt');
    var genParams1 = utils.getParameters(genFile1);
    expect(genParams1.length).to.equal(0);
    expect(genFile1).to.equal('SAMPLE   00001Value1    00SOME TEXT HERE000111');

    var genFile2 = utils.readFile('output/sample/BASIC-002.txt');
    var genParams2 = utils.getParameters(genFile2);
    expect(genParams2.length).to.equal(0);
    expect(genFile2).to.equal('SAMPLE   00002Value2    00SOME TEXT HERE000111');

    var genFile3 = utils.readFile('output/sample/BASIC-003.txt');
    var genParams3 = utils.getParameters(genFile3);
    expect(genParams3.length).to.equal(0);
    expect(genFile3).to.equal('SAMPLE   00003Value3    00SOME TEXT HERE000111');

  });

  it('should test for generateTemplateWithJSON with json template', function () {

    var fileName = './test/data/config/json-basic.json';
    utils.generateTemplateWithJSON(fileName);

    var configFiles = utils.getFiles('test/data/output/sample/', configFiles);

    expect(fs.existsSync('test/data/output/00Simulator')).to.equal(true);
    expect(configFiles.length).to.equal(2);
    expect(fs.existsSync('test/data/output/sample/json-basic-001.json')).to.equal(true);
    expect(fs.existsSync('test/data/output/sample/json-basic-002.json')).to.equal(true);

    var genFile1 = utils.readFile('output/sample/json-basic-001.json');
    var genParams1 = utils.getParameters(genFile1);
    expect(genParams1.length).to.equal(0);
    expect(genFile1).to.equal('{\n  "id": "001",\n  "value1": "Value1",\n  "value2": "Value1",\n  "existingValue": "existing value goes here"\n}');

    var genFile2 = utils.readFile('output/sample/json-basic-002.json');
    var genParams2 = utils.getParameters(genFile2);
    expect(genParams2.length).to.equal(0);
    expect(genFile2).to.equal('{\n  "id": "002",\n  "value1": "Value1",\n  "value2": "Value1",\n  "existingValue": "existing value goes here"\n}');

  });

  it('should test for generateTemplateWithJSON with json template with optional section', function () {

    var fileName = './test/data/config/json-basic-conditional-section.json';
    utils.generateTemplateWithJSON(fileName);

    var configFiles = utils.getFiles('test/data/output/sample/', configFiles);

    expect(fs.existsSync('test/data/output/00Simulator')).to.equal(true);
    expect(configFiles.length).to.equal(2);
    expect(fs.existsSync('test/data/output/sample/json-basic-condition-001.json')).to.equal(true);
    expect(fs.existsSync('test/data/output/sample/json-basic-condition-002.json')).to.equal(true);

    var genFile1 = utils.readFile('output/sample/json-basic-condition-001.json');
    var genParams1 = utils.getParameters(genFile1);
    expect(genParams1.length).to.equal(0);
    expect(genFile1).to.equal('{\n  "id": "001",\n  "value1": "Value1",\n  "value2": "Value1",\n  "existingValue": "existing value goes here",\n  "optional-value": "SINGLE_CONDITION_VALUE"\n}');

    var genFile2 = utils.readFile('output/sample/json-basic-condition-002.json');
    var genParams2 = utils.getParameters(genFile2);
    expect(genParams2.length).to.equal(0);
    expect(genFile2).to.equal('{\n  "id": "002",\n  "value1": "Value1",\n  "value2": "Value1",\n  "existingValue": "existing value goes here"\n}');
  });

  it('should test for generateTemplateWithJSON with json template (fixedMappingValues)', function () {
    // apply mappings ignoring any conditions
    // eg. {column1}  must always be replaces with "col1"
    var fileName = './test/data/config/json-basic-fixed-mapping-values.json';
    utils.generateTemplateWithJSON(fileName);

    var configFiles = utils.getFiles('test/data/output/sample/', configFiles);

    expect(fs.existsSync('test/data/output/00Simulator')).to.equal(true);
    expect(configFiles.length).to.equal(2);
    expect(fs.existsSync('test/data/output/sample/json-basic-001.json')).to.equal(true);
    expect(fs.existsSync('test/data/output/sample/json-basic-002.json')).to.equal(true);

    var genFile1 = utils.readFile('output/sample/json-basic-001.json');
    var genParams1 = utils.getParameters(genFile1);
    expect(genParams1.length).to.equal(0);
    expect(genFile1).to.equal('{\n  "id": "001",\n  "value1": "sheet1_value1",\n  "value2": "Value1",\n  "existingValue": "existing value goes here"\n}');

    var genFile2 = utils.readFile('output/sample/json-basic-002.json');
    var genParams2 = utils.getParameters(genFile2);
    expect(genParams2.length).to.equal(0);
    expect(genFile2).to.equal('{\n  "id": "002",\n  "value1": "sheet1_value1",\n  "value2": "Value1",\n  "existingValue": "existing value goes here"\n}');

  });

  it('should test for generateTemplateWithJSON for custom delimeter config', function () {

    var fileName = './test/data/config/basic-custom-delimeters.json';
    utils.generateTemplateWithJSON(fileName);

    var simFiles = utils.getFiles('test/data/output/00Simulator/', simFiles);
    var configFiles = utils.getFiles('test/data/output/sample/', configFiles);

    expect(fs.existsSync('test/data/output/00Simulator')).to.equal(true);
    expect(simFiles.length).to.equal(1);
    expect(fs.existsSync('test/data/output/00Simulator/00-sim-basic.xml')).to.equal(true);
    expect(configFiles.length).to.equal(2);
    expect(fs.existsSync('test/data/output/sample/BASIC-001.xml')).to.equal(true);
    expect(fs.existsSync('test/data/output/sample/BASIC-002.xml')).to.equal(true);

    var simFile = utils.readFile('output/00Simulator/00-sim-basic.xml');
    var simParams = utils.getParameters(simFile);
    expect(simParams.length).to.equal(0);

    var genFile = utils.readFile('output/sample/BASIC-001.xml');
    var genParams = utils.getParameters(genFile);
    expect(genParams.length).to.equal(0);
    expect(genFile).to.contain('<UNIQUE_ID>001</UNIQUE_ID>');
    expect(genFile).to.contain('<VALUE1>Value1</VALUE1>');
    expect(genFile).to.contain('<VALUE2>Value1</VALUE2>');
  });

  it('should test for generateTemplateWithJSON for custom delimeter config (error thrown)', function () {
    var fileName = './test/data/config/basic-custom-delimeters-error.json';
    var err = 'generator config > [ customDelimiter ] missing "startsWith" and "endsWith"'
    expect(function () { utils.generateTemplateWithJSON(fileName); }).to.throw(err)
  });

  it('should test for generateTemplateWithJSON for useGenRowFlag config', function () {

    var fileName = './test/data/config/basic-use-gen-row-flag.json';
    utils.generateTemplateWithJSON(fileName);

    var simFiles = utils.getFiles('test/data/output/00Simulator/', simFiles);
    var configFiles = utils.getFiles('test/data/output/sample/', configFiles);

    expect(fs.existsSync('test/data/output/00Simulator')).to.equal(true);
    expect(simFiles.length).to.equal(1);
    expect(fs.existsSync('test/data/output/00Simulator/00-sim-basic.xml')).to.equal(true);
    expect(configFiles.length).to.equal(1);
    expect(fs.existsSync('test/data/output/sample/BASIC-001.xml')).to.equal(false);
    expect(fs.existsSync('test/data/output/sample/BASIC-002.xml')).to.equal(true);

    var simFile = utils.readFile('output/00Simulator/00-sim-basic.xml');
    var simParams = utils.getParameters(simFile);
    expect(simParams.length).to.equal(0);

    var genFile = utils.readFile('output/sample/BASIC-002.xml');
    var genParams = utils.getParameters(genFile);
    expect(genParams.length).to.equal(0);
    expect(genFile).to.contain('<UNIQUE_ID>002</UNIQUE_ID>');
    expect(genFile).to.contain('<VALUE1>Value1</VALUE1>');
    expect(genFile).to.contain('<VALUE2>Value1</VALUE2>');
  });

  it('should test for generateTemplateWithJSON for useGenRowFlag config', function () {

    var fileName = './test/data/config/basic-use-gen-row-flag-false.json';
    utils.generateTemplateWithJSON(fileName);

    var simFiles = utils.getFiles('test/data/output/00Simulator/', simFiles);
    var configFiles = utils.getFiles('test/data/output/sample/', configFiles);

    expect(fs.existsSync('test/data/output/00Simulator')).to.equal(true);
    expect(simFiles.length).to.equal(1);
    expect(fs.existsSync('test/data/output/00Simulator/00-sim-basic.xml')).to.equal(true);
    expect(configFiles.length).to.equal(2);
    expect(fs.existsSync('test/data/output/sample/BASIC-001.xml')).to.equal(true);
    expect(fs.existsSync('test/data/output/sample/BASIC-002.xml')).to.equal(true);

    var simFile = utils.readFile('output/00Simulator/00-sim-basic.xml');
    var simParams = utils.getParameters(simFile);
    expect(simParams.length).to.equal(0);

    var genFile = utils.readFile('output/sample/BASIC-002.xml');
    var genParams = utils.getParameters(genFile);
    expect(genParams.length).to.equal(0);
    expect(genFile).to.contain('<UNIQUE_ID>002</UNIQUE_ID>');
    expect(genFile).to.contain('<VALUE1>Value1</VALUE1>');
    expect(genFile).to.contain('<VALUE2>Value1</VALUE2>');
  });

  it('should test for generateTemplateWithJSON for basic config apply transform to values (all values)', function () {

    var fileName = './test/data/config/basic-use-transform-values.json';
    utils.generateTemplateWithJSON(fileName);

    var simFiles = utils.getFiles('test/data/output/00Simulator/', simFiles);
    var configFiles = utils.getFiles('test/data/output/sample/', configFiles);

    expect(fs.existsSync('test/data/output/00Simulator')).to.equal(true);
    expect(simFiles.length).to.equal(1);
    expect(fs.existsSync('test/data/output/00Simulator/00-sim-basic.xml')).to.equal(true);
    expect(configFiles.length).to.equal(2);
    expect(fs.existsSync('test/data/output/sample/BASIC-001.xml')).to.equal(true);
    expect(fs.existsSync('test/data/output/sample/BASIC-002.xml')).to.equal(true);

    var simFile = utils.readFile('output/00Simulator/00-sim-basic.xml');
    var simParams = utils.getParameters(simFile);
    expect(simParams.length).to.equal(0);

    var genFile = utils.readFile('output/sample/BASIC-001.xml');
    var genParams = utils.getParameters(genFile);
    expect(genParams.length).to.equal(0);
    expect(genFile).to.contain('<UNIQUE_ID>001</UNIQUE_ID>');
    expect(genFile).to.contain('<VALUE1>value 1</VALUE1>');
    expect(genFile).to.contain('<VALUE2>value2</VALUE2>');
  });

  it('should test for generateTemplateWithJSON for basic config apply transform to value (single value transform)', function () {

    var fileName = './test/data/config/basic-use-transform-value-single-match.json';
    utils.generateTemplateWithJSON(fileName);

    var simFiles = utils.getFiles('test/data/output/00Simulator/', simFiles);
    var configFiles = utils.getFiles('test/data/output/sample/', configFiles);

    expect(fs.existsSync('test/data/output/00Simulator')).to.equal(true);
    expect(simFiles.length).to.equal(1);
    expect(fs.existsSync('test/data/output/00Simulator/00-sim-basic.xml')).to.equal(true);
    expect(configFiles.length).to.equal(2);
    expect(fs.existsSync('test/data/output/sample/BASIC-001.xml')).to.equal(true);
    expect(fs.existsSync('test/data/output/sample/BASIC-002.xml')).to.equal(true);

    var simFile = utils.readFile('output/00Simulator/00-sim-basic.xml');
    var simParams = utils.getParameters(simFile);
    expect(simParams.length).to.equal(0);

    var genFile = utils.readFile('output/sample/BASIC-001.xml');
    var genParams = utils.getParameters(genFile);
    expect(genParams.length).to.equal(0);
    expect(genFile).to.contain('<UNIQUE_ID>001</UNIQUE_ID>');
    expect(genFile).to.contain('<VALUE1>value 1</VALUE1>');
    expect(genFile).to.contain('<VALUE2>Value1</VALUE2>');
  });
});