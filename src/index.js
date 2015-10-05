
var _ = require("highland")
var fs = require("fs")
var fsExtra = require("fs-extra")
var globby = require("globby")
var path = require("path")
var del  =  require("del")


var moveFile = _.wrapCallback(
  (oldPath, done) => {
    fileName = path.basename(oldPath)
    newPath = `C:/Users/Neil/torrents/${fileName}`
    console.log(`
Moving file: ${fileName}
  from : ${oldPath}
  to :   ${newPath}
`)
    fs.rename(oldPath, newPath, done)
  }
)

var getFilesizeInMegaBytes = (filename) => {
  var stats = fs.statSync(filename)
  var fileSizeInBytes = stats["size"]
  return fileSizeInBytes / 1000000.0
}

var cleaner = _(globby("C:/Users/Neil/torrents/*/"))
  .flatten()
  .filter((filePath) => {
    return !filePath.endsWith("Temp/")
  })
  .map(_.wrapCallback(
    (filePath, done) =>{
      del([filePath], (paths) => {
        done(null, paths)
      })
    }
  ))

var errors = []

_(globby("C:/Users/Neil/torrents/*/*", '!C:/Users/Neil/torrents/Temp**'))
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
    if(err){
      errors.push(err)
    }
  })
  .toArray((results) =>{
    if(errors.length > 0 ) {
      throw new Error("Arg something went wrong :(")
    }

    cleaner.toArray((results) => {
      results.forEach((item) =>{
        console.log(`deleted file ${item}`);
      })
    })
  })
