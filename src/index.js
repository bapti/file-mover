
var _ = require("highland")
var fs = require("fs")
var fsExtra = require("fs-extra")
var globby = require("globby")
var path = require("path")
var del = require("del")
var rm = require("rimraf")

var folder = "D:/torrents/"

process.on('uncaughtException', function(err) {
  console.log(err);
});

var moveFile = _.wrapCallback(
  (oldPath, done) => {
    fileName = path.basename(oldPath)
    newPath = `${folder}${fileName}`
    console.log(`
      Moving file: ${fileName}
        from : ${oldPath}
        to :   ${newPath}
      `)
    fs.rename(oldPath, newPath, done)
  }
)

var deleteFile = _.wrapCallback(rm)

var getFilesizeInMegaBytes = (filename) => {
  var stats = fs.statSync(filename)
  var fileSizeInBytes = stats["size"]
  return fileSizeInBytes / 1000000.0
}

var cleaner = _(globby(`${folder}*/`))
  .flatten()
  .filter((filePath) => {
    return !filePath.endsWith("Temp/")
  })
  .map(deleteFile)
  .sequence()
  .errors((err) => {
    console.log(err);
  })

var errors = []

_(globby(`${folder}/*/*`, `!${folder}/Temp**`))
  .flatten()
  .filter((filePath) => {
    return filePath.endsWith(".avi")
     || filePath.endsWith(".mp4")
  })
  .filter((filePath) =>{
    return getFilesizeInMegaBytes(filePath) > 30
  })
  .map(moveFile)
  .parallel(10)
  .errors((err) => {
    console.log(err);
    errors.push(err)
  })
  .toArray((results) =>{
    if(errors.length > 0 ) {
      throw new Error("Arg something went wrong :(")
    }

    cleaner.toArray((results) => {})
  })
