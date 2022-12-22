const {IMPORTER_TYPE} = require('./src/importer');
const log4js = require('log4js');
const logger = log4js.getLogger('main');
const {TEST_INFO_MAPPER_TYPE} = require('./src/importer/testinfo');
logger.level = 'info';
require('dotenv').config();
new IMPORTER_TYPE.XRAY_CLOUD(
  '/Users/minhhoang/Workspace/automation/cucumber-importer/changed-files.txt',
  {
    host: 'xray.cloud.getxray.app',
    clientId: process.env.XRAY_CLIENT_ID,
    clientSecret: process.env.XRAY_CLIENT_SECRET,
    projectId: process.env.XRAY_PROJECT_ID,
  },
  './testmanagement.config.yaml',
).importCucumberToTestManagement(TEST_INFO_MAPPER_TYPE.JIRA);
