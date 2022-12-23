// const {IMPORTER_TYPE} = require('./src/importer');
// const {TEST_INFO_MAPPER_TYPE} = require('./src/importer/testinfo');
const log4js = require('log4js');
const logger = log4js.getLogger('main');
logger.level = 'info';

const {program} = require('commander');

program
  .name('cucumber-importer')
  .description(
    'Plugin to support import cucumber feature file to test management system as a test case',
  )
  .version('0.1.0');

program
  .command('import')
  .description('Import list of cucumber feature files to test management tool')
  .argument('<string>', 'string to split')
  .option('--first', 'display just the first substring')
  .option('-s, --separator <char>', 'separator character', ',')
  .action((str, options) => {
    const limit = options.first ? 1 : undefined;
    console.log(str.split(options.separator, limit));
  });

program
  .command('query-test-management')
  .description(
    'Query an extract information for preparing test management config file',
  )
  .argument('<string>', 'string to split')
  .option('--first', 'display just the first substring')
  .option('-s, --separator <char>', 'separator character', ',')
  .action((str, options) => {
    const limit = options.first ? 1 : undefined;
    console.log(str.split(options.separator, limit));
  });

program.parse();
