// const fs = require('fs');
// const tmp = require('tmp');
// const path = require('path');
// const {read, write} = require('gherkin-io');

// const {CucumberDocuments} = require('./src/cucumber/cucumber-document');
const {IMPORTER_TYPE} = require('./src/importer/importer');
const log4js = require('log4js');
const logger = log4js.getLogger('main');
// const { FileUtils } = require('./src/utils/file-utils');
logger.level = 'info';

// const cucumberDocument = new CucumberDocuments(
//     '../src/test/resources/features/messenger/channels.feature',
// );

// cucumberDocument.loadFeatureFile().then(async () => {
//     const tags = cucumberDocument.extractTagsData();
//     console.log(cucumberDocument.getCucumberScenarios());
//     cucumberDocument.appendTagsToScenarios(tags);
//     console.log("========================");
//     console.log("========================");
//     console.log("========================");
//     console.log("========================");
//     console.log(cucumberDocument.getCucumberScenarios());
//     console.log("========================");
//     console.log("========================");
//     console.log("========================");
//     console.log("========================");

//     const tmpobj = tmp.fileSync({
//         postfix: ".feature"
//     });
//     const options = { separateStepGroups: false };
//     logger.info('feature file path: ', tmpobj.name);
//     for (const cucumberDocumentData of cucumberDocument.getCucumberDocuments())
//       await write(tmpobj.name, cucumberDocumentData, options);
//     return tmpobj;
// })

// console.log(FileUtils.getFileAbsolutePath(__dirname));
// console.log(FileUtils.getFileDirectoryAbsolutePath(__dirname));
// const tmpFile = FileUtils.createTemporaryFile({
//   postfix: '.json',
// });
// console.log(tmpFile.name);
// tmpFile.removeCallback();

new IMPORTER_TYPE.XRAY_CLOUD(
  '/Users/minhhoang/Workspace/automation/cucumber-importer/changed-files.txt',
  './testmanagement.config.yaml',
).importCucumberToTestManagement();
