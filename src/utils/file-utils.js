const fs = require('fs');
const tmp = require('tmp');
const path = require('path');
const log4js = require('log4js');
const logger = log4js.getLogger('file-utils');
logger.level = 'info';

tmp.setGracefulCleanup();

class FileUtils {
  static readFileContent(filePath) {
    return fs.readFileSync(filePath, 'utf8');
  }

  static isFileExist(path) {
    return fs.existsSync(path);
  }

  static getFileAbsolutePath(fileDir) {
    return path.resolve(fileDir);
  }

  static getFileDirectoryAbsolutePath(fileDir) {
    return path.dirname(path.resolve(fileDir));
  }

  static createTemporaryFile(tmpNameOptions = {}) {
    const tmpobj = tmp.fileSync(tmpNameOptions);
    logger.info('Create Temporary file', tmpobj.name);
    return tmpobj;
  }

  static writeDataToFile(filePath, data) {
    logger.info('file path: ', filePath);
    fs.writeFileSync(filePath, data);
  }

  static readDataFromFile(filePath, encoding) {
    return fs.readFileSync(filePath, encoding);
  }
}

exports.FileUtils = FileUtils;
