const {read, write} = require('gherkin-io');
const {FileUtils} = require('../utils/file-utils');
const log4js = require('log4js');
const logger = log4js.getLogger('cucumber-document');
logger.level = 'info';

class CucumberDocuments {
  #cucumberDocuments;
  #cucumberFeatureTags;
  #cucumberScenarioTags;
  #cucumberFeatures;
  #cucumberScenarios;
  #featureFilePath;

  constructor(featureFilePath) {
    this.#featureFilePath = featureFilePath;
  }

  async loadFeatureFile() {
    this.#cucumberDocuments = await read(this.#featureFilePath);
    this.#cucumberScenarios = this.#extractCucumberScenarios();
    this.#cucumberFeatures = this.#extractCucumberFeatures();
    this.extractFeatureTagsData();
    this.extractScenariosTagsData();
  }

  async dumpCucumberDocumentToFeatureFile(
    options = {separateStepGroups: false},
  ) {
    const tempFeatureFilesPath = [];
    for (const document of this.#cucumberDocuments) {
      const tempFile = FileUtils.createTemporaryFile({
        postfix: '.feature',
      });
      await write(tempFile.name, document, options);
      logger.info(
        'dump Cucumber Document to feature file in path: ',
        tempFile.name,
      );
      tempFeatureFilesPath.push(tempFile.name);
    }
    return tempFeatureFilesPath;
  }

  extractFeatureTagsData() {
    if (!this.#cucumberDocuments) {
      logger.error('Please load feature file with readFeatureFile method');
      throw new Error(
        'Cucumber document is empty, please load the document with method readFeatureFile',
      );
    }
    const tasgData = [];
    const isSingleFeatureWithTags =
      this.#cucumberDocuments.length === 1 &&
      this.#cucumberDocuments[0].feature.tags;
    if (isSingleFeatureWithTags) {
      tasgData.push(...this.#cucumberDocuments[0].feature.tags);
    } else {
      for (const cucumberDocument of this.#cucumberDocuments) {
        if (cucumberDocument.feature.tags) {
          tasgData.push(...cucumberDocument.feature.tags);
        }
      }
    }
    this.#cucumberFeatureTags = tasgData;
    return tasgData;
  }

  extractScenariosTagsData() {
    if (!this.#cucumberDocuments) {
      logger.error('Please load feature file with readFeatureFile method');
      throw new Error(
        'Cucumber document is empty, please load the document with method readFeatureFile',
      );
    }
    const tasgData = [];
    const isSingleFeatureWithTags =
      this.#cucumberDocuments.length === 1 &&
      this.#cucumberDocuments[0].feature.tags;
    if (isSingleFeatureWithTags) {
      for (const featureElement of this.#cucumberDocuments[0].feature
        .elements) {
        if (featureElement.tags) tasgData.push(...featureElement.tags);
      }
    } else {
      for (const cucumberDocument of this.#cucumberDocuments) {
        for (const featureElement of cucumberDocument.feature.elements) {
          if (featureElement.tags) tasgData.push(...featureElement.tags);
        }
      }
    }
    this.#cucumberScenarioTags = tasgData;
    return tasgData;
  }

  appendTagsToScenarios(tags) {
    for (const cucumberScenario of this.#cucumberScenarios) {
      if (cucumberScenario.tags) cucumberScenario.tags.push(...tags);
    }
  }

  printFeatureTags() {
    this.#cucumberFeatures.forEach((feature) =>
      feature.tags.forEach((tag) => logger.info('feature tag', tag.name)),
    );
  }

  printScenarioTags() {
    this.#cucumberScenarios.forEach((scenario) => {
      if (scenario.tags) {
        scenario.tags.forEach((tag) => logger.info('scenario tag', tag.name));
      }
    });
  }

  getFeatureTags() {
    const tags = [];
    this.#cucumberFeatures.forEach((feature) =>
      feature.tags.forEach((tag) => tags.push(tag.name)),
    );
    return tags;
  }

  getScenarioTags() {
    const tags = [];
    this.#cucumberScenarios.forEach((scenario) => {
      if (scenario.tags) {
        scenario.tags.forEach((tag) => tags.push(tag.name));
      }
    });
  }

  getFeatureTagsData() {
    return this.#cucumberFeatureTags;
  }

  getScenariosTagsData() {
    return this.#cucumberScenarioTags;
  }

  getCucumberScenarios() {
    return this.#cucumberScenarios;
  }

  getCucumberFeatures() {
    return this.#cucumberFeatures;
  }

  getCucumberDocuments() {
    return this.#cucumberDocuments;
  }

  #extractCucumberScenarios() {
    const cucumberScenarios = [];
    if (this.#cucumberDocuments.length === 1) {
      const document = this.#cucumberDocuments[0];
      cucumberScenarios.push(...document.feature.elements);
    } else {
      for (const cucumberDocument of this.#cucumberDocuments) {
        cucumberScenarios.push(...cucumberDocument.feature.elements);
      }
    }
    return cucumberScenarios;
  }

  #extractCucumberFeatures() {
    const cucumberFeatures = [];
    if (this.#cucumberDocuments.length === 1) {
      const cucumberDocument = this.#cucumberDocuments[0];
      cucumberFeatures.push(cucumberDocument.feature);
    } else {
      for (const cucumberDocument of this.#cucumberDocuments) {
        cucumberFeatures.push(cucumberDocument.feature);
      }
    }
    return cucumberFeatures;
  }
}

exports.CucumberDocuments = CucumberDocuments;
