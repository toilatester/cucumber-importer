const {FileUtils} = require('../../utils/file-utils');
const {Importer} = require('../cucumber-importer');
const {CucumberDocuments} = require('../../cucumber/cucumber-document');
const {XRayClient} = require('./client');
const log4js = require('log4js');
const logger = log4js.getLogger('cucumber-importer');
logger.level = 'info';

class XrayCucumberImporter extends Importer {
  #cucumberDocument;
  #importFeatureListContent;
  #cucumberListFilesPath;
  #testManagementFieldMapperConfigPath;
  #testManagementFieldMapper;
  #featureFilesPath;
  #xrayClient;

  constructor(
    cucumberListFilesPath,
    testManagementFieldMapperConfigPath,
    clientConfig = {host, clientId, clientSecret, projectId},
  ) {
    super();
    this.#cucumberListFilesPath = FileUtils.getFileAbsolutePath(
      cucumberListFilesPath,
    );
    this.#testManagementFieldMapperConfigPath = FileUtils.getFileAbsolutePath(
      testManagementFieldMapperConfigPath,
    );
    this.#xrayClient = new XRayClient(clientConfig);
  }

  async importCucumberToTestManagement(
    testManagementFieldMapperType,
    testManagementType,
  ) {
    this.#importFeatureListContent = this.#getImportFeatureListContent(
      this.#cucumberListFilesPath,
    );
    this.#featureFilesPath = this.#getFeatureFilesPath(
      this.#importFeatureListContent,
    );
    await this.#importTest(testManagementFieldMapperType, testManagementType);
  }

  #getImportFeatureListContent(path) {
    const featureFiles = FileUtils.readFileContent(path).split(/\r?\n/);
    return featureFiles.filter((file) => file.length > 0);
  }

  #getFeatureFilesPath(fileChangedContent) {
    const featureFilesPath = [];
    for (const featurePath of fileChangedContent) {
      featureFilesPath.push(FileUtils.getFileAbsolutePath(featurePath));
    }
    return featureFilesPath;
  }

  async #importTest(testManagementFieldMapperType, testManagementType) {
    const tempFeatureFilesPath =
      await this.#createTemporaryFeatureFileWithExtraTags();
    logger.info(
      'List temp features file for uploading to XRay',
      tempFeatureFilesPath,
    );
    const tempTestInfoFilePath = await this.#createTemporaryTestInfoFile(
      testManagementFieldMapperType,
    );
    console.log(tempTestInfoFilePath);
    await this.#createXrayTestRepositoryFolder(testManagementType);
  }

  async #createTemporaryFeatureFileWithExtraTags() {
    const tempFeatureFilesPath = [];
    for (const featureFilePath of this.#featureFilesPath) {
      const cucumberDocument = await this.#loadCucumberDocument(
        featureFilePath,
      );
      cucumberDocument.appendTagsToScenarios(
        cucumberDocument.getFeatureTagsData(),
      );
      tempFeatureFilesPath.push(
        ...(await cucumberDocument.dumpCucumberDocumentToFeatureFile()),
      );
    }
    return tempFeatureFilesPath;
  }

  async #loadCucumberDocument(featureFilePath) {
    this.#cucumberDocument = new CucumberDocuments(featureFilePath);
    await this.#cucumberDocument.loadFeatureFile();
    return this.#cucumberDocument;
  }

  async #createTemporaryTestInfoFile(testManagementFieldMapperType) {
    this.#testManagementFieldMapper = Reflect.construct(
      testManagementFieldMapperType,
      [this.#testManagementFieldMapperConfigPath],
    );
    return this.#testManagementFieldMapper.createTestInfoTemporaryFile(
      this.#cucumberDocument.getFeatureTags(),
    ).name;
  }

  async #createXrayTestRepositoryFolder() {
    console.log(this.#testManagementFieldMapper.getTestInfoStructureConfig());
    if (
      !this.#testManagementFieldMapper.getTestInfoStructureConfig().generate
    ) {
      return;
    }
    const folders = await this.#xrayClient.getTestFolders('/');
    console.log(JSON.stringify(folders));
  }
}

exports.XrayCucumberImporter = XrayCucumberImporter;
