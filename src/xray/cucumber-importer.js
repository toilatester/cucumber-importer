const log4js = require("log4js");
const logger = log4js.getLogger();
const {Importer} = require("../importer/cucumber-importer");
logger.level = "info";

class XrayCucumberImporter extends Importer {
  importCucumberToTestManagement() {
    console.log("Import method from XrayCucumberImporter", this);
  }
}

exports.XrayCucumberImporter = XrayCucumberImporter;
