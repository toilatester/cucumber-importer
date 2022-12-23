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

  async createTestInfoTemporaryFile(tags) {
    const testInfoObject = await this.#createTestInfoObject(tags);
    const tmpobj = FileUtils.createTemporaryFile({
      postfix: '.json',
    });
    fs.writeFileSync(tmpobj.name, JSON.stringify(testInfoObject));
    logger.info('testInfo file path: ', tmpobj.name);
    logger.info('testInfo data', JSON.stringify(testInfoObject));
    return tmpobj;
  }

  async #createTestInfoObject(tags) {
    const testInfoObject = {
      fields: {},
    };
    if (Object.keys(this.getTestInfoFieldsConfig()).length === 0) {
      return testInfoObject;
    }
    for (const field of this.getTestInfoFieldsConfig()) {
      switch (field.optionType) {
        case 'single':
          this.#buildCustomFieldWithSingleChoiceType(
            field,
            tags,
            testInfoObject,
          );
          break;
        case 'multiple':
          this.#buildCustomFieldWithMultipleChoiceType(
            field,
            tags,
            testInfoObject,
          );
          break;
        default:
          throw new Error(`Custom field ${field.optionType} does not support`);
      }
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

  #buildCustomFieldWithSingleChoiceType(field, tags, testInfoObject) {
    if (field.optionDynamic) {
      const customFieldValue = this.#getOptionValueByDynamicData(tags, field);
      testInfoObject.fields[`${field.fieldKey}`] = {
        value: customFieldValue,
      };
    } else {
      testInfoObject.fields[`${field.fieldKey}`] = {
        value: field.optionValue,
      };
    }
  }

  #buildCustomFieldWithMultipleChoiceType(field, tags, testInfoObject) {
    const fields = [];
    if (field.optionDynamic) {
      for (const tagValueForExtracting of field.tagValueForExtractingOptionValue) {
        const customFieldValue = this.#getOptionValueByTags(
          tags,
          tagValueForExtracting,
        );
        fields.push({
          value: customFieldValue,
        });
      }
    } else {
      for (const fieldValue of field.optionValue) {
        fields.push({
          value: fieldValue,
        });
      }
    }
    testInfoObject.fields[`${field.fieldKey}`] = fields;
  }
}

exports.TestInfoFieldsMapper = TestInfoFieldsMapper;
