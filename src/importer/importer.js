const {XrayCucumberImporter} = require('../xray/cucumber-importer');

const IMPORTER_TYPE = {
  XRAY_CLOUD: XrayCucumberImporter,
  XRAY_DC: XrayCucumberImporter,
};

exports.IMPORTER_TYPE = IMPORTER_TYPE;
