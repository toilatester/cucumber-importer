const {FileUtils} = require('../utils/file-utils');
const {Importer} = require('../importer/cucumber-importer');
const {CucumberDocuments} = require('../cucumber/cucumber-document');
const log4js = require('log4js');
const logger = log4js.getLogger();
logger.level = 'info';

class XrayCucumberImporter extends Importer {
  #importFeatureListContent;
  #fileChangedPath;
  #featureFilesPath;

  constructor(fileChangedPath) {
    super();
    this.#fileChangedPath = FileUtils.getFileAbsolutePath(fileChangedPath);
  }

  async importCucumberToTestManagement() {
    this.#importFeatureListContent = this.#getImportFeatureListContent(
      this.#fileChangedPath,
    );
    this.#featureFilesPath = this.#getFeatureFilesPath(
      this.#importFeatureListContent,
    );
    await this.#importTest();
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

  async #importTest() {
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
