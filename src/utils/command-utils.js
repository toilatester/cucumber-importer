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

const questions = [];

module.exports = {
  initJiraClient,
  validateQueryJiraRequiredData,
  getQueryJiraRequiredData,
  validateXRayRequiredData,
  getXrayRequiredData,
  questions,
};
