const {parse} = require('yaml');
const {FileUtils} = require('../../../utils/file-utils');
const fs = require('fs');

class TestInfoFieldsMapper {
  #customFieldsMapperConfigPath;
  #testInfoConfig;

  constructor(customFieldMapperPath) {
    this.#customFieldsMapperConfigPath = FileUtils.getFileAbsolutePath(
      customFieldMapperPath,
    );
    this.#testInfoConfig = parse(
      fs.readFileSync(this.#customFieldsMapperConfigPath, 'utf8'),
    );
  }

  getTestInfoConfig() {
    return JSON.parse(JSON.stringify(this.#testInfoConfig));
  }

  getTestInfoStructureConfig() {
    return JSON.parse(JSON.stringify(this.#testInfoConfig.folders));
  }

  getTestInfoFieldsConfig() {
    return JSON.parse(JSON.stringify(this.#testInfoConfig.fields));
  }
}

exports.TestInfoFieldsMapper = TestInfoFieldsMapper;
