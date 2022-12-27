const {TEST_MANAGEMENT_TYPE} = require('../test-management');
const log4js = require('log4js');
const logger = log4js.getLogger('main');
logger.level = 'info';
require('dotenv').config();

function initJiraClient(options) {
  validateQueryJiraRequiredData(options);
  const {jiraHost, jiraUsername, jiraPassword} =
    getQueryJiraRequiredData(options);
  return new TEST_MANAGEMENT_TYPE.JIRA_CLOUD({
    host: jiraHost,
    username: jiraUsername,
    token: jiraPassword,
  });
}

function validateQueryJiraRequiredData(options) {
  let {jiraHost, jiraUsername, jiraPassword} = options;
  jiraHost = jiraHost || process.env.JIRA_HOST;
  jiraUsername = jiraUsername || process.env.JIRA_USERNAME;
  jiraPassword = jiraPassword || process.env.JIRA_TOKEN;
  const missingRequiredData = !jiraHost || !jiraUsername || !jiraPassword;
  if (missingRequiredData) {
    throw new Error(
      'Please input value for Jira host with [-jh], Jira username with [-ju] and jiraToken with [-jp]. \n' +
        'Or using .env file for setting the environemnt variables with values ' +
        '[JIRA_HOST, JIRA_USERNAME, JIRA_TOKEN].',
    );
  }
}

function getQueryJiraRequiredData(options) {
  let {jiraHost, jiraUsername, jiraPassword} = options;
  jiraHost = jiraHost || process.env.JIRA_HOST;
  jiraUsername = jiraUsername || process.env.JIRA_USERNAME;
  jiraPassword = jiraPassword || process.env.JIRA_TOKEN;
  process.env.JIRA_HOST = jiraHost;
  process.env.JIRA_USERNAME = jiraUsername;
  process.env.JIRA_TOKEN = jiraPassword;
  return {jiraHost, jiraUsername, jiraPassword};
}

function validateXRayRequiredData(options) {
  let {xrayHost, xrayUsername, xrayToken, xrayProjectId} = options;
  xrayHost = xrayHost || process.env.XRAY_HOST;
  xrayUsername = xrayUsername || process.env.XRAY_CLIENT_ID;
  xrayToken = xrayToken || process.env.XRAY_CLIENT_SECRET;
  xrayProjectId = xrayProjectId || process.env.XRAY_PROJECT_ID;
  const missingRequiredData =
    !xrayHost || !xrayUsername || !xrayToken || !xrayProjectId;
  if (missingRequiredData) {
    throw new Error(
      'Please input value for Xray host with [-xh], Xray username|clientId with [-xu], Xray token with [-xt] and' +
        'Xray project id with [-xp]. \n' +
        'Or using .env file for setting the environemnt variables with values ' +
        '[XRAY_HOST, XRAY_CLIENT_ID, XRAY_CLIENT_SECRET, XRAY_PROJECT_ID].',
    );
  }
}

function getXrayRequiredData(options) {
  let {
    importListFilePath,
    testManagementConfigFilePath,
    xrayHost,
    xrayUsername,
    xrayToken,
    xrayProjectId,
  } = options;
  xrayHost = xrayHost || process.env.XRAY_HOST;
  xrayUsername = xrayUsername || process.env.XRAY_CLIENT_ID;
  xrayToken = xrayToken || process.env.XRAY_CLIENT_SECRET;
  xrayProjectId = xrayProjectId || process.env.XRAY_PROJECT_ID;
  process.env.XRAY_CLIENT_ID = xrayUsername;
  process.env.XRAY_CLIENT_SECRET = xrayToken;
  process.env.XRAY_PROJECT_ID = xrayProjectId;
  process.env.XRAY_HOST = xrayHost;
  return {
    xrayHost,
    xrayUsername,
    xrayToken,
    xrayProjectId,
    importListFilePath,
    testManagementConfigFilePath,
  };
}

async function askUserInput(prompt, question) {
  return await prompt(question);
}

async function getCustomFieldsOptionsForCreatingConfigFile(prompt) {
  let jiraClientOptions = await askDataForCustomFieldsImporter(prompt);
  await initJiraClient(jiraClientOptions).getAllJiraFieldOptions();
  let answers = await askInputJiraOptionsAgain(prompt);
  while (answers.askAgain) {
    const reusePreviousInput = await askUserInput(prompt, [
      {
        type: 'confirm',
        name: 'reusePreviousInputJiraOptions',
        message:
          'Do you want to reuse previous input of Jira options(just hit enter for YES)?',
        default: true,
      },
    ]);
    if (!reusePreviousInput.reusePreviousInputJiraOptions) {
      jiraClientOptions = await askDataForCustomFieldsImporter(prompt);
    }
    await initJiraClient(jiraClientOptions).getAllJiraFieldOptions();
    answers = await askInputJiraOptionsAgain(prompt);
  }
}

async function askDataForCustomFieldsImporter(prompt) {
  const jiraOptions = {};
  const answers = await askUserInput(prompt, [
    {
      type: 'input',
      name: 'jiraHost',
      message: 'Please input your Jira host?',
      validate: (data) => {
        jiraOptions['jiraHost'] = data;
        return data.length > 0;
      },
    },
    {
      type: 'input',
      name: 'jiraUsername',
      message: 'Please input your Jira username?',
      validate: (data) => {
        jiraOptions['jiraUsername'] = data;
        return data.length > 0;
      },
    },
    {
      type: 'input',
      name: 'jiraPassword',
      message: 'Please input your Jira password or token?',
      validate: async (data) => {
        jiraOptions['jiraPassword'] = data;
        return data.length > 0;
      },
    },
  ]);
  return answers;
}

async function askInputJiraOptionsAgain(prompt) {
  return await askUserInput(prompt, [
    {
      type: 'confirm',
      name: 'askAgain',
      message:
        'Do you want to get Jira custom field key and custom field options again (just hit enter for NO)?',
      default: false,
    },
  ]);
}

module.exports = {
  initJiraClient,
  validateQueryJiraRequiredData,
  getQueryJiraRequiredData,
  validateXRayRequiredData,
  getXrayRequiredData,
  askUserInput,
  getCustomFieldsOptionsForCreatingConfigFile,
};
