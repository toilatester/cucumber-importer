const {FileUtils} = require('../../utils/file-utils');
const {Importer} = require('../cucumber-importer');
const {CucumberDocuments} = require('../../cucumber/cucumber-document');
const log4js = require('log4js');
const logger = log4js.getLogger('cucumber-importer');
logger.level = 'info';

class XrayCucumberImporter extends Importer {
  #cucumberDocument;
  #importFeatureListContent;
  #cucumberListFilesPath;
  #testManagementFieldMapperConfigPath;
  #featureFilesPath;

  constructor(cucumberListFilesPath, testManagementFieldMapperConfigPath) {
    super();
    this.#cucumberListFilesPath = FileUtils.getFileAbsolutePath(
      cucumberListFilesPath,
    );
    this.#testManagementFieldMapperConfigPath = FileUtils.getFileAbsolutePath(
      testManagementFieldMapperConfigPath,
    );
  }

  async importCucumberToTestManagement(testManagementFieldMapperType) {
    this.#importFeatureListContent = this.#getImportFeatureListContent(
      this.#cucumberListFilesPath,
    );
    this.#featureFilesPath = this.#getFeatureFilesPath(
      this.#importFeatureListContent,
    );
    await this.#importTest(testManagementFieldMapperType);
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

  async #importTest(testManagementFieldMapperType) {
    const testManagementFieldMapper = Reflect.construct(
      testManagementFieldMapperType,
      [this.#testManagementFieldMapperConfigPath],
    );
    const tempFeatureFilesPath =
      await this.#createTemporaryFeatureFileWithExtraTags();
    logger.info(
      'List temp features file for uploading to XRay',
      tempFeatureFilesPath,
    );
    testManagementFieldMapper.createTestInfoTemporaryFile(
      this.#cucumberDocument.getFeatureTags(),
    );
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
}

exports.XrayCucumberImporter = XrayCucumberImporter;
