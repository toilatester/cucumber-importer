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
    for (const featureFilePath of tempFeatureFilesPath) {
      const featureFileCucumber = new CucumberDocuments(featureFilePath);
      await featureFileCucumber.loadFeatureFile();
      const tags = featureFileCucumber.getFeatureTags();
      const tempTestInfoFilePath = await this.#createTemporaryTestInfoFile(
        testManagementFieldMapperType,
        tags,
      );
      const xrayFolder = await this.#createXrayTestRepositoryFolder(tags);
      const result = await this.#import(featureFilePath, tempTestInfoFilePath);
      if (result.errors.length > 0) {
        logger.error(
          'Error in import feature file with error: ',
          result.errors,
          `\n\r[Feature file content] \r\n${featureFileCucumber.getFeatureContent()}`,
        );
      }
      this.#xrayClient.addTestsToFolder(
        xrayFolder,
        result.updatedOrCreatedTests.map((test) => test.id),
      );
    }
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

  async #createTemporaryTestInfoFile(testManagementFieldMapperType, tags) {
    this.#testManagementFieldMapper = Reflect.construct(
      testManagementFieldMapperType,
      [this.#testManagementFieldMapperConfigPath],
    );
    const temp =
      await this.#testManagementFieldMapper.createTestInfoTemporaryFile(tags);
    return temp.name;
  }

  async #createXrayTestRepositoryFolder(tags) {
    const folders = await this.#xrayClient.getTestFolders('/');
    const folderData = [folders.getFolder.path];
    this.#extractXrayFolders(folderData, folders.getFolder);
    const folderTarget = this.#buildFolderStructureWithConfig(tags);
    const createXrayFolder =
      this.#testManagementFieldMapper.getTestInfoStructureConfig().generate &&
      !folderData.includes(folderTarget);
    if (createXrayFolder) {
      logger.info('Create XRay test folder', folderTarget);
      await this.#xrayClient.createTestFolder(folderTarget);
    }
    return folderTarget;
  }

  async #import(tempFeatureFilePath, tempTestInfoFilePath) {
    const response = await this.#xrayClient.importCucumberTestToXray(
      tempFeatureFilePath,
      tempTestInfoFilePath,
    );
    logger.info('Import cucumber feature status', response);
    return response;
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

  #buildFolderStructureWithConfig(tags) {
    const dynamicFolderPath = [];
    const structure =
      this.#testManagementFieldMapper.getTestInfoStructureConfig().structure;
    this.#extractDynamicFolderWithConfig(dynamicFolderPath, structure);
    const dynamicFolderValue = tags.filter((tag) =>
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
