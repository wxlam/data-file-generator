# Data File Generator
To generate multiple copies of a file using a data contained in a spreadsheet with on a template(s)

## Getting Started
npm install data-file-generator

### Set up
To start, data needs to be added into an excel spreadsheet, then the template file(s) will need to be created and marked up, then the config files need to be created.

file structure:
```
.
+-- data-files
|   +-- config
|       +-- default.json
|       +-- test-sample.json
|   +-- data
|       +-- template
|           +-- basic-template.xml
|       +-- sample.xlsx
+-- datafile.opt
```

`config` folder contains all config json files that determine how the templates and spreadsheet data will be used

`data` folder contains all the templates and test data spreadsheet to be used in the file generation

`data/template` contains the marked up templates to be used in the file generation

`output` (folder will be created) contains all the files generated from the template with the data provided in the spreadsheets

`datafile.opt` file contains location of where data files exists (including config, templates, output)

### Preparation

1. Mark up template file
    - Identify all values in your template file that you expect data to be replaced
    - Replace each instance in the template with keyword and braces eg. `{KEYWORD}`
    ``` xml
    <SampleRs>
        <UNIQUE_ID>{UNIQUE_ID_COLUMN}</UNIQUE_ID>
        <VALUE1>{SHEET1_COLUMN_VALUE1}</VALUE1>
        <VALUE2>{SHEET1_COLUMN_VALUE2}</VALUE2>
        <EXISTING_VALUE>some value that can be ignored</EXISTING_VALUE>
    </SampleRs>
    ```
    - Save template file into `./data/template` folder
2. Setup your spreadsheet, where the first row in your spreadsheet will contain the keyword as a heading
    - Save spreadsheet into `./data` folder

| UNIQUE_ID_COLUMN | SHEET1_COLUMN_VALUE1 | SHEET1_COLUMN_VALUE2 |
|-----------|:-----------:|-----------:| 
| ID_000 | AAA | DDD 123 |
| ID_001 | BBB | EEE 456 |

3. Create the config.json

the `default.json` is used to add in global values that will be shared by other config files, such as the name of the spreadsheet to use (in this case: `"inputSheet": "data/sample.xlsx"`) and also specifies where and what default values for the output folder exist

config files will be merged with the `default.json`, so any values added to the `default.json` will be automatically appled to other config files.

`config/default.json`
``` json
{
  "profileName": "default",
  "inputSheet": "data/sample.xlsx",
  "output": {
    "folder": "output/",
    "fileExtension": ".json"
  },
  "useExistingFilenameColumn" : "USE_FILE_NAME",
  "startRow" : 0
}
```

other config json files added to `config` folder will apply additional information about what is to be generated, for example the template to be used, filename prefix, unique Id to be applied and file extension

`config/test-sample.json`
``` json
{
  "profileName": "test-sample",
  "sheetName": "Sheet1",
  "startRow": 2,
  "endRow": 500,
  "output": {
    "folder": "output/folder/",
    "fileNamePrefix": "PROFILE-PREFIX",
    "fileIdColumn": "UNIQUE_ID_COLUMN",
    "fileExtension": ".xml"
  },
  "templates": [
    {
      "name": "default",
      "path": "data/template/",
      "fileName": "basic-template.xml"
    }
  ]
}
```

**NOTE**: the `profileName` for each template needs to be unique, as it is this name that will used to determine which template(s) will be used generate test files from

### Usage

To generate files run:
`data-file-gen <profile-name>`
or 
`node index.js <profile-name>`

where `<profile-name>` can be a comma delimited list of profiles, eg. `test-sample` or `test-sample1,test-sample2,test-sample3`

output files will appear in the `output` folder

#### Useful samples

`./config/sample/sample.json` contains the different combinations and values that can be used for the config json files

`./test/` directory contains examples of config files, templates, worsksheets
