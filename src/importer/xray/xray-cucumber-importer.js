const {FileUtils} = require('../../utils/file-utils');
const {Importer} = require('../cucumber-importer');
const {CucumberDocuments} = require('../../cucumber/cucumber-document');
const log4js = require('log4js');
const logger = log4js.getLogger('cucumber-importer');
logger.level = 'info';

class XrayCucumberImporter extends Importer {
  #importFeatureListContent;
  #cucumberListFilesPath;
  #testManagementFieldMapperConfigPath;
  #featureFilesPath;

  constructor(cucumberListFilesPath, testManagementFieldMapperConfigPath) {
    super();
    this.#cucumberListFilesPath = FileUtils.getFileAbsolutePath(
      cucumberListFilesPath,
    );
    this.testManagementFieldMapperConfigPath = FileUtils.getFileAbsolutePath(
      testManagementFieldMapperConfigPath,
    );
  }

  async importCucumberToTestManagement(testManagementType) {
    this.#importFeatureListContent = this.#getImportFeatureListContent(
      this.#cucumberListFilesPath,
    );
    this.#featureFilesPath = this.#getFeatureFilesPath(
      this.#importFeatureListContent,
    );
    await this.#importTest(testManagementType);
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

  async #importTest(testManagementType) {
    const tempFeatureFilesPath =
      await this.#createTemporaryFeatureFileWithExtraTags();
    logger.info(
      'List temp features file for uploading to XRay',
      tempFeatureFilesPath,
    );
  }

  async #createTemporaryFeatureFileWithExtraTags() {
    const tempFeatureFilesPath = [];
    for (const featureFilePath of this.#featureFilesPath) {
      const cucumberDocument = await this.#loadCucumberDocuemnt(
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

  async #loadCucumberDocuemnt(featureFilePath) {
    const cucumberDocument = new CucumberDocuments(featureFilePath);
    await cucumberDocument.loadFeatureFile();
    return cucumberDocument;
  }
}

exports.XrayCucumberImporter = XrayCucumberImporter;
