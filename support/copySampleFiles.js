let fs = require('fs')
let fsExtra = require('fs-extra')
let generator = require('../support/generator.js')

let sampleFileSetup = {
    checkIfConfigFile: function checkIfConfigFile() {
        // default data files directory is './data-files'
        //  else read value from data-file-gen.rc
        let dataFileDir = '/data-files'
        if (fsExtra.existsSync(process.cwd() + '/datafile.opt')) {
            console.log('reading from: datafile.opt')
            let dataFileGenOptions = process.cwd() + '/datafile.opt'
            let dataGenOptions = generator.readFile(dataFileGenOptions)
            if (dataGenOptions != '') {
                dataFileDir = dataGenOptions
            }
        } else {
            // create datafile.opt to save default location of data-files to
            generator.writeFile(process.cwd(),'/datafile.opt', 'data-files')
        }
        return dataFileDir
    },
    copyFiles: function copyFiles(dirName) {
        // console.log('setup with sample structure')
        let rootDir = process.cwd() + '/' + dirName
        let fileRootDir = __dirname

        fsExtra.copySync(fileRootDir + '/../config', rootDir + '/config', (src, dest) => {
            // only copy across files that aren't within the 'config/sample' folser
            return src.indexOf('/sample') < 0 ? true : false
        })
        fsExtra.copySync(fileRootDir + '/../data', rootDir + '/data')
    }
}

module.exports = sampleFileSetup