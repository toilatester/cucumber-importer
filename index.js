#!/usr/bin/env node
const {IMPORTER_TYPE} = require('./src/importer');
const {TEST_INFO_MAPPER_TYPE} = require('./src/importer/testinfo');
const {validateEnvironmentVariables} = require('./src/utils/validation-utils');
const {
  getQueryJiraRequiredData,
  getXrayRequiredData,
  initJiraClient,
  validateQueryJiraRequiredData,
  validateXRayRequiredData,
} = require('./src/utils/command-utils');
const inquirer = require('inquirer');
const log4js = require('log4js');
const logger = log4js.getLogger('main');
logger.level = 'info';
require('dotenv').config();

const {program} = require('commander');
validateEnvironmentVariables(Object.keys(process.env), logger);

program
  .name('cucumber-importer')
  .description(
    'Plugin to support import a cucumber feature file to test management system as a test case',
  )
  .version('0.1.0');

program
  .command('import-xray-jira-cloud')
  .description('Import list of cucumber feature files to test management tool')
  .option('-jh --jira-host <host>', 'The domain value for Jira')
  .option('-ju --jira-username <username>', 'The username to authenticate Jira')
  .option('-jp --jira-password <password>', 'The password to authenticate Jira')
  .option(
    '-xh --xray-host <host>',
    'The domain value for Xray',
    'xray.cloud.getxray.app',
  )
  .option(
    '-xu --xray-username <username|clientId>',
    'The username/clientId to authenticate Xray ' +
      '[https://docs.getxray.app/display/XRAYCLOUD/Global+Settings%3A+API+Keys]',
  )
  .option(
    '-xt --xray-token <token|password>',
    'The token|password to authenticate Xray [https://docs.getxray.app/display/XRAYCLOUD/Global+Settings%3A+API+Keys]',
  )
  .option(
    '-xp --xray-project-id <projectId>',
    'The project ID to import Cucumber test ' +
      '[https://docs.getxray.app/display/XRAYCLOUD/Importing+Cucumber+Tests+-+REST]',
  )
  .option(
    '-c, --test-management-config-file-path <filePath>',
    'Path to the configuration file for import cucumber with extra fields to tets management',
  )
  .requiredOption(
    '-i, --import-list-file-path <filePath>',
    'Path to the file contains list of cucumber file for importing to tets management',
  )
  .action((options) => {
    logger.info('Start to import cucumber feature files to Xray in Jira Cloud');
    validateXRayRequiredData(options);
    validateQueryJiraRequiredData(options);
    getQueryJiraRequiredData(options);
    const {
      importListFilePath,
      testManagementConfigFilePath,
      xrayHost,
      xrayUsername,
      xrayToken,
      xrayProjectId,
    } = getXrayRequiredData(options);
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
  .command('query-jira-projects')
  .description(
    'Query an extract information for preparing test management config file',
  )
  .option('-jh --jira-host <host>', 'The domain value for Jira')
  .option('-ju --jira-username <username>', 'The username to authenticate Jira')
  .option('-jp --jira-password <password>', 'The password to authenticate Jira')
  .action(async (options) => {
    logger.info('Start to get all projects in Jira Cloud with option');
    const jira = initJiraClient(options);
    const projects = await jira.getAllJiraProjects();
    for (const project of projects) {
      const {id, key, name} = project;
      logger.info(`
      Project name [${name}]
      Project key [${key}]
      Project id [${id}]`);
    }
  });

program
  .command('query-jira-project-fields')
  .description(
    'Query an extract information for preparing test management config file',
  )
  .option('-jh --jira-host <host>', 'The domain value for Jira')
  .option('-ju --jira-username <username>', 'The username to authenticate Jira')
  .option('-jp --jira-password <password>', 'The password to authenticate Jira')
  .action(async (options) => {
    logger.info('Start to get all fields in Jira Cloud');
    const jira = initJiraClient(options);
    const fields = await jira.getAllJiraFields();
    for (const field of fields) {
      const {id, key, name, custom, schema} = field;
      const {type, customId} = schema || {};
      logger.info(`
      Field name [${name}]
      Field key [${key}]
      Field id [${id}]
      Custom field [${custom}]
      Custom field type [${type}]
      CustomId [${customId}]`);
    }
  });

program
  .command('query-jira-project-fields-options')
  .description(
    'Query an extract information for preparing test management config file',
  )
  .option('-jh --jira-host <host>', 'The domain value for Jira')
  .option('-ju --jira-username <username>', 'The username to authenticate Jira')
  .option('-jp --jira-password <password>', 'The password to authenticate Jira')
  .action(async (options) => {
    logger.info('Start to get all fields in Jira Cloud with option');
    const jira = initJiraClient(options);
    await jira.getAllJiraFieldOptions();
  });

program
  .command('init')
  .description(
    'Init and config an extract information for preparing test management config file',
  )
  .action(async () => {
    const initInputOption = {};
    const prompt = inquirer.createPromptModule();
    Object.assign(
      initInputOption,
      await askUserInput(prompt, {
        default: 'false',
        type: 'list',
        name: 'syncTestFolderToTestManagement',
        choices: ['true', 'false'],
        message:
          'Do you want to generate test folder to test management with Cucumber @Tag value?',
        filter: (data) => data === 'true',
      }),
    );
    console.log(initInputOption);
    Object.assign(
      initInputOption,
      await askUserInput(prompt, {
        type: 'list',
        default: 'false',
        name: 'addCustomFieldToTestManagement',
        choices: ['true', 'false'],
        message:
          'Do you want to sync Cucumber features to test management with custom fields?',
        filter: (data) => data === 'true',
      }),
    );
    console.log(initInputOption);
  });

program.parse();

async function askUserInput(prompt, question) {
  return await prompt([question]);
}
