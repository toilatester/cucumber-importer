const {FileUtils} = require('../../../utils/file-utils');

class TestInfoFieldsMapper {
  #customFieldsMapperConfigPath;
  constructor(customFieldMapperPath) {
    this.#customFieldsMapperConfigPath = FileUtils.getFileAbsolutePath(
      customFieldMapperPath,
    );
  }
}

exports.TestInfoFieldsMapper = TestInfoFieldsMapper;
