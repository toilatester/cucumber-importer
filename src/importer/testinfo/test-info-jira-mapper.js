const {parse} = require('yaml');
const {TEST_MANAGEMENT_TYPE} = require('../../test-management');
const {FileUtils} = require('../../utils/file-utils');
const fs = require('fs');
const log4js = require('log4js');
const logger = log4js.getLogger('test-info-jira-mapper');
logger.level = 'info';

class TestInfoFieldsMapper {
  #customFieldsMapperConfigPath;
  #testInfoConfig;
  #jiraClient;

  constructor(customFieldMapperPath) {
    this.#jiraClient = new TEST_MANAGEMENT_TYPE.JIRA_CLOUD({
      host: process.env.JIRA_HOST,
      username: process.env.JIRA_USERNAME,
      token: process.env.JIRA_TOKEN,
    });
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
      if (field.optionType === ' single') {
        if (field.optionDynamic) {
          const customFieldValue = this.#getOptionValueByDynamicData(
            tags,
            field,
          );
          const fieldOptionId = await this.#getCustomFieldOptionId(
            field.fieldKey,
            customFieldValue,
          );
          testInfoObject.fields[`${field.fieldKey}`] = {
            id: fieldOptionId,
            value: customFieldValue,
          };
        } else {
          const fieldOptionId = await this.#getCustomFieldOptionId(
            field.fieldKey,
            field.optionValue,
          );
          testInfoObject.fields[`${field.fieldKey}`] = {
            id: fieldOptionId,
            value: field.optionValue,
          };
        }
      } else if (field.optionType === ' multiple') {
        const fields = [];
        if (field.optionDynamic) {
          for (const tagValueForExtracting of field.tagValueForExtractingOptionValue) {
            const customFieldValue = this.#getOptionValueByTags(
              tags,
              tagValueForExtracting,
            );
            const fieldOptionId = await this.#getCustomFieldOptionId(
              field.fieldKey,
              customFieldValue,
            );
            fields.push({
              id: fieldOptionId,
              value: customFieldValue,
            });
          }
          testInfoObject.fields[`${field.fieldKey}`] = fields;
        } else {
          const fieldOptionId = await this.#getCustomFieldOptionId(
            field.fieldKey,
            field.optionValue,
          );
          testInfoObject.fields[`${field.fieldKey}`] = [
            {
              id: fieldOptionId,
              value: field.optionValue,
            },
          ];
        }
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

  async #getCustomFieldOptionId(fieldId, optionValue) {
    const fieldContextResponse = await this.#jiraClient.getFieldContextValue(
      fieldId,
    );
    const fieldOptionsResponse =
      await this.#jiraClient.getFieldContextOptionValues(
        fieldId,
        fieldContextResponse.values[0]['id'],
      );
    const filterOptionIds = fieldOptionsResponse.values.filter((fieldOption) =>
      fieldOption.value.includes(optionValue),
    );
    if (filterOptionIds.length === 0) {
      throw new Error(
        `Cannot find option value id for option ${optionValue} in ${JSON.stringify(
          fieldOptionsResponse.values,
        )}`,
      );
    }
    return filterOptionIds[0]['id'];
  }
}

exports.TestInfoFieldsMapper = TestInfoFieldsMapper;
