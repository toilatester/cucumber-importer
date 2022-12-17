const {read, write} = require('gherkin-io');
const {Tag} = require('gherkin-ast');
// const {format} = require('gherkin-formatter');
const axios = require('axios');
const fs = require('fs');
const tmp = require('tmp');
const path = require('path');
const log4js = require('log4js');
const logger = log4js.getLogger();
logger.level = 'info';

const XRAY_CLIENT_ID = process.argv[2] || 'NO_XRAY_CLIENT_ID_INPUT';
const XRAY_CLIENT_SECRET = process.argv[3] || 'NO_XRAY_CLIENT_SECRET_INPUT';
const DEFAULT_TEST_INFO = {
  fields: {
    customfield_10044: [
      {
        id: '10027',
        value: 'API',
      },
    ],
    customfield_10051: [
      {
        id: '10046',
        value: 'User Management',
      },
    ],
  },
};

async function importTest(featureFilePath) {
  const documents = await read(featureFilePath);
  const options = {separateStepGroups: false};
  const xrayToken = `Bearer ${await authenticateXray()}`;

  const commitedFeature = documents[0].clone();
  const importFeature = documents[0].clone();
  const domain = extractDomainTag(importFeature.feature.tags);
  const tmpTestInfoFile = await createTemporaryTestInfoFile(
    buildCustomFields(domain),
  );
  importFeature.feature.elements.forEach((item, index) => {
    if (item.tags) item.tags.push(...importFeature.feature.tags);
  });
  const tmpFeatureFile = await createTemporaryFeatureFile(importFeature);
  const importResultsData = await importCucumberTestToXray(
    xrayToken,
    tmpFeatureFile.name,
    tmpTestInfoFile.name,
  );
  logger.error(JSON.stringify(importResultsData.data.errors));
  const keys = importResultsData.data.updatedOrCreatedTests.map(
    (item) => item['key'],
  );
  const existingTestTags = getExistingTestTags(commitedFeature);
  const newTags = keys.filter((x) => !existingTestTags.includes(x));
  const newScenarios = existingTestTags.filter((x) => !keys.includes(x));
  logger.info(keys);
  logger.info(existingTestTags);
  logger.info(`${newTags.length} new tags detected: ${newTags}`);
  logger.info(`${newScenarios.length} new scenarios detected: ${newScenarios}`);
  newScenarios.forEach((item, index) => {
    const scenario = commitedFeature.feature.elements.find(
      (scenario) => scenario.name === item,
    );
    if (newTags[index] !== undefined) {
      scenario.tags.push(new Tag('TEST_' + newTags[index]));
    }
    logger.info(`Add tag TEST_${newTags[index]} to scenario ${item}`);
  });
  await write(featureFilePath, commitedFeature, options);
  tmpFeatureFile.removeCallback();
  tmpTestInfoFile.removeCallback();
}

function extractDomainTag(tags) {
  const domainTag = tags.find((tag) => tag.name.includes('Domain'));
  return domainTag.name.split(':')[1];
}

function getExistingTestTags(document) {
  return document.feature.elements.map((item) => {
    if (!item.tags) return item.name;
    const testIdTag = item.tags.find((tag) => tag.name.includes('TEST_QE'));
    if (testIdTag !== undefined) return testIdTag.name.split('_')[1];
    return item.name;
  });
}

async function importCucumberTestToXray(
  xrayToken,
  featureFilePath,
  testInfoFilePath,
) {
  return await axios.post(
    'https://xray.cloud.getxray.app/api/v2/import/feature?projectKey=QE',
    {
      file: fs.createReadStream(featureFilePath),
      testInfo: fs.createReadStream(testInfoFilePath),
    },
    {
      headers: {
        'Content-Type': 'multipart/form-data',
        'Authorization': xrayToken,
      },
    },
  );
}

async function authenticateXray() {
  const res = await axios.post(
    'https://xray.cloud.getxray.app/api/v2/authenticate',
    {
      client_id: XRAY_CLIENT_ID,
      client_secret: XRAY_CLIENT_SECRET,
    },
    {
      headers: {
        'Content-Type': 'application/json',
      },
    },
  );
  return res.data;
}

async function createTemporaryFeatureFile(document) {
  const tmpobj = tmp.fileSync({
    postfix: '.feature',
  });
  const options = {separateStepGroups: false};
  logger.info('feature file path: ', tmpobj.name);
  await write(tmpobj.name, document, options);
  return tmpobj;
}

async function createTemporaryTestInfoFile(object) {
  const tmpobj = tmp.fileSync({
    postfix: '.json',
  });
  logger.info('testInfo file path: ', tmpobj.name);
  fs.writeFileSync(tmpobj.name, JSON.stringify(object));
  return tmpobj;
}

function buildCustomFields(domain) {
  switch (domain) {
    case 'UM':
    default:
      return DEFAULT_TEST_INFO;
  }
}

const fileChangedPath = path.resolve(
  `${__dirname}${path.sep}..${path.sep}`,
  'changed-files.txt',
);
const arrayText = fs.readFileSync(fileChangedPath, 'utf8').split('\n');

for (const i in arrayText) {
  const fullFile = `../${arrayText[i].replace(/\r\n/g, '\n').split('\n')}`;
  if (fullFile.includes('.feature')) {
    logger.info(`Importing ${fullFile}`);
    importTest(fullFile);
  }
}
