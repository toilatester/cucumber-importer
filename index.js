const {IMPORTER_TYPE} = require('./src/importer');
const {TEST_INFO_MAPPER_TYPE} = require('./src/importer/testinfo');
const log4js = require('log4js');
const logger = log4js.getLogger('main');
logger.level = 'info';

const {program} = require('commander');

program
  .name('cucumber-importer')
  .description(
    'Plugin to support import a cucumber feature file to test management system as a test case',
  )
  .version('0.1.0');

program
  .command('import-xray-jira-cloud')
  .description('Import list of cucumber feature files to test management tool')
  .requiredOption('-jh --jira-host <host>', 'The domain value for Jira')
  .requiredOption(
    '-ju --jira-username <username>',
    'The username to authenticate Jira',
  )
  .requiredOption(
    '-jp --jira-password <password>',
    'The password to authenticate Jira',
  )
  .requiredOption(
    '-xp --xray-project-id <projectId>',
    'The project ID to import Cucumber test ' +
      '[https://docs.getxray.app/display/XRAYCLOUD/Importing+Cucumber+Tests+-+REST]',
  )
  .requiredOption(
    '-xh --xray-host <host>',
    'The domain value for Xray',
    'xray.cloud.getxray.app',
  )
  .requiredOption(
    '-xu --xray-username <username|clientId>',
    'The username/clientId to authenticate Xray ' +
      '[https://docs.getxray.app/display/XRAYCLOUD/Global+Settings%3A+API+Keys]',
  )
  .requiredOption(
    '-xt --xray-token <token|password>',
    'The token|password to authenticate Xray [https://docs.getxray.app/display/XRAYCLOUD/Global+Settings%3A+API+Keys]',
  )
  .requiredOption(
    '-i, --import-list-file-path <filePath>',
    'Path to the file contains list of cucumber file for importing to tets management',
  )
  .option(
    '-c, --test-management-config-file-path <filePath>',
    'Path to the configuration file for import cucumber with extra fields to tets management',
  )
  .action((options) => {
    logger.info(
      'Start to import cucumber feature files to Xray in Jira Cloud',
      options,
    );
    const {
      importListFilePath,
      testManagementConfigFilePath,
      jiraHost,
      jiraUsername,
      jiraPassword,
      xrayHost,
      xrayUsername,
      xrayToken,
      xrayProjectId,
    } = options;
    process.env.XRAY_CLIENT_ID = xrayUsername;
    process.env.XRAY_CLIENT_SECRET = xrayToken;
    process.env.XRAY_PROJECT_ID = xrayProjectId;
    process.env.JIRA_HOST = jiraHost;
    process.env.JIRA_USERNAME = jiraUsername;
    process.env.JIRA_TOKEN = jiraPassword;
    new IMPORTER_TYPE.XRAY_CLOUD(
      importListFilePath,
      {
        host: xrayHost,
        clientId: xrayUsername,
        clientSecret: xrayToken,
        projectId: xrayProjectId,
      },
      testManagementConfigFilePath,
    ).importCucumberToTestManagement(TEST_INFO_MAPPER_TYPE.JIRA);
  });

program
  .command('query-test-management')
  .description(
    'Query an extract information for preparing test management config file',
  )
  .requiredOption('--first', 'display just the first substring')
  .requiredOption('-s, --separator <char>', 'separator character', ',')
  .action((str, options) => {
    const limit = options.first ? 1 : undefined;
    console.log(str.split(options.separator, limit));
  });

program.parse();
