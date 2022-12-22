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
    clientConfig = {host, clientId, clientSecret, projectId},
    testManagementFieldMapperConfigPath,
  ) {
    super();
    this.#cucumberListFilesPath = FileUtils.getFileAbsolutePath(
      cucumberListFilesPath,
    );
    this.#xrayClient = new XRayClient(clientConfig);
    this.#testManagementFieldMapperConfigPath =
      testManagementFieldMapperConfigPath;
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
    const xrayFolder = await this.#createXrayTestRepositoryFolder(
      testManagementType,
    );
    await this.#import(tempFeatureFilesPath, tempTestInfoFilePath, xrayFolder);
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
    if (
      !this.#testManagementFieldMapper.getTestInfoStructureConfig().generate
    ) {
      return;
    }
    const folders = await this.#xrayClient.getTestFolders('/');
    const folderData = [folders.getFolder.path];
    this.#extractXrayFolders(folderData, folders.getFolder);
    const folderTarget = this.#buildFolderStructureWithConfig();
    if (!folderData.includes(folderTarget)) {
      logger.info('Create XRay test folder', folderTarget);
      await this.#xrayClient.createTestFolder(folderTarget);
    }
    return folderTarget;
  }

  async #import(tempFeatureFilesPath, tempTestInfoFilePath, xrayFolder) {
    console.log(tempFeatureFilesPath, tempTestInfoFilePath);
    for (const featureFilePath of tempFeatureFilesPath) {
      const response = await this.#xrayClient.importCucumberTestToXray(
        featureFilePath,
        tempTestInfoFilePath,
      );
      logger.info('Import cucumber feature status', response);
    }
  }

  #extractXrayFolders(folderData, folders) {
    if (!folders) return folderData;
    if (Object.keys(folders).includes('folders')) {
      for (const subFolder of folders.folders) {
        folderData.push(subFolder.path);
        this.#extractXrayFolders(folderData, subFolder);
      }
    }
  }

  #buildFolderStructureWithConfig() {
    const dynamicFolderPath = [];
    const featureTags = this.#cucumberDocument.getFeatureTags();
    const structure =
      this.#testManagementFieldMapper.getTestInfoStructureConfig().structure;
    this.#extractDynamicFolderWithConfig(dynamicFolderPath, structure);
    const dynamicFolderValue = featureTags.filter((tag) =>
      dynamicFolderPath.includes(tag.split(':')[0]),
    );
    return this.#buildFolderPathToCreateToXray(
      dynamicFolderPath,
      dynamicFolderValue,
    );
  }

  #extractDynamicFolderWithConfig(dynamicFolderPath, structure) {
    if (!structure) return dynamicFolderPath;
    if (Object.keys(structure).includes('dynamicKey')) {
      dynamicFolderPath.push(structure.dynamicKey);
      this.#extractDynamicFolderWithConfig(
        dynamicFolderPath,
        structure.structure,
      );
    }
  }

  #buildFolderPathToCreateToXray(dynamicFolderPath, dynamicFolderValue) {
    if (!(dynamicFolderPath.length === dynamicFolderValue.length)) {
      logger.warn(
        'Mapping folder structure and dynamic folder value missing dynamic tag data',
        dynamicFolderPath,
        dynamicFolderValue,
      );
      throw new Error(`'Mapping folder structure and dynamic folder value missing dynamic tag extract data
        Folder Structure Config: ${dynamicFolderPath}
        Folder Extract Value: ${dynamicFolderValue}`);
    }
    const folderPath = [''];
    for (const dynamicKey of dynamicFolderPath) {
      const folderValue = dynamicFolderValue.filter((value) =>
        value.includes(dynamicKey),
      );
      const value = folderValue[0] ? folderValue[0].split(':')[1] : '';
      folderPath.push(value);
    }
    return folderPath.join('/');
  }
}

exports.XrayCucumberImporter = XrayCucumberImporter;
