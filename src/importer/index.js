const {XrayCucumberImporter} = require('./xray');

const IMPORTER_TYPE = {
  XRAY_CLOUD: XrayCucumberImporter,
  XRAY_DC: XrayCucumberImporter,
};

exports.IMPORTER_TYPE = IMPORTER_TYPE;
