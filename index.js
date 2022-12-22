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

// const {TEST_MANAGEMENT_TYPE} = require('./src/test-management');

// const jira = new TEST_MANAGEMENT_TYPE.JIRA_CLOUD({
//   host: 'toilatester.atlassian.net',
//   username: 'minhquanvn2171990@gmail.com',
//   token: 'pXEoYovB5Sxt6FJVwgIE17FD',
// });

// jira.getFieldContextValue('customfield_10038').then(contextId => {
//   console.log(contextId.values[0]['id']);
//   jira.getFieldContextOptionValues('customfield_10038', contextId.values[0]['id']).then(options => {
//     console.log(options);
//     options.values.filter(optionValue => {
//       optionValue.value.includes('Messenger')
//     })
//   })
// })

// jira.getFieldContextOptionValues('customfield_10038', '10139').then(options => console.log(options))

// jira.getJiraClientInstance().getAllBoards().then(boards => {
//   console.log(boards);
//   jira.getJiraClientInstance().getProjects(2).then(projects => {
//     console.log(projects);
//   })
// })
