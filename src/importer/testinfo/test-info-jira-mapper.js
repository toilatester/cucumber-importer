const {parse} = require('yaml');
const {FileUtils} = require('../../utils/file-utils');
const fs = require('fs');
const log4js = require('log4js');
const logger = log4js.getLogger('test-info-jira-mapper');
logger.level = 'info';

class TestInfoFieldsMapper {
  #customFieldsMapperConfigPath;
  #testInfoConfig;

  constructor(customFieldMapperPath) {
    this.#customFieldsMapperConfigPath = customFieldMapperPath
      ? FileUtils.getFileAbsolutePath(customFieldMapperPath)
      : false;
    this.#parseYamlConfig();
  }

  getTestInfoConfig() {
    return JSON.parse(JSON.stringify(this.#testInfoConfig));
  }

  getTestInfoStructureConfig() {
    if (this.#testInfoConfig.folders) {
      return JSON.parse(JSON.stringify(this.#testInfoConfig.folders));
    }
    return {};
  }

  getTestInfoFieldsConfig() {
    if (this.#testInfoConfig.fields) {
      return JSON.parse(JSON.stringify(this.#testInfoConfig.fields));
    }
    return {};
  }

  createTestInfoTemporaryFile(tags) {
    const testInfoObject = this.#createTestInfoObject(tags);
    const tmpobj = FileUtils.createTemporaryFile({
      postfix: '.json',
    });
    fs.writeFileSync(tmpobj.name, JSON.stringify(testInfoObject));
    logger.info('testInfo file path: ', tmpobj.name);
    logger.info('testInfo data', JSON.stringify(testInfoObject));
    return tmpobj;
  }

  #createTestInfoObject(tags) {
    const testInfoObject = {
      fields: {},
    };
    if (Object.keys(this.getTestInfoFieldsConfig()).length === 0) {
      return testInfoObject;
    }
    for (const field of this.getTestInfoFieldsConfig()) {
      testInfoObject.fields[`${field.fieldKey}`] = [
        {
          id: field.optionId,
          value: this.#getOptionValueByDynamicData(tags, field),
        },
      ];
    }
    return testInfoObject;
  }

  #getOptionValueByDynamicData(tags, field) {
    const extractValueFromTag = () =>
      this.#getOptionValueByTags(tags, field.tagValueForExtractingOptionValue);
    return field.optionDynamic ? extractValueFromTag() : field.optionValue;
  }

  #getOptionValueByTags(tags, tagValueForExtractingOptionValue) {
    const tag = tags.filter((tag) => {
      const tagKey = tag.split(':')[0];
      return tagKey === tagValueForExtractingOptionValue;
    });
    if (tag.length == 0) {
      throw new Error(
        `Feature file does not contains value for
        tagValueForExtractingOptionValue ${tagValueForExtractingOptionValue} in [${tags}]`,
      );
    }
    if (tag.length > 1) {
      throw new Error(
        `Feature file contains multiple value for
        tagValueForExtractingOptionValue ${tag}`,
      );
    }
    return tag[0].split(':')[1];
  }

  #parseYamlConfig() {
    if (this.#customFieldsMapperConfigPath) {
      this.#testInfoConfig = parse(
        fs.readFileSync(this.#customFieldsMapperConfigPath, 'utf8'),
      );
    } else {
      this.#testInfoConfig = {};
    }
  }
}

exports.TestInfoFieldsMapper = TestInfoFieldsMapper;
