const fs = require('fs-extra')
const path = require('path')

let currDir = __dirname
let src
let dest

process.argv.forEach((val, index) => {
    console.log(`${index}: ${val}`);
  });

if(process.argv.length == 4) {
    src = process.argv[2]
    dest = process.argv[3]
} else {
    throw new Error('expect 2 args - [source] [dest]')
}

let srcPath = path.resolve(currDir, src)
let destPath = path.resolve(currDir, dest)
console.log(srcPath)
console.log(destPath)

let files = fs.readdirSync(srcPath)
files.forEach(file => { 
    let srcFile = path.join(srcPath, file)
    let destFile = path.join(destPath, file)
    console.log(`copying file: <${srcFile}>`); 
    fs.copyFileSync(srcFile, destFile)
  });

