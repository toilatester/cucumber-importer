const {read} = require("gherkin-io");
const log4js = require("log4js");
const logger = log4js.getLogger();
logger.level = "info";

class CucumberDocuments {
  #cucumberDocuments;
  #cucumberTags;
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
  }

  extractTagsData() {
    if (!this.#cucumberDocuments) {
      logger.error("Please load feature file with readFeatureFile method");
      throw new Error(
        "Cucumber document is empty, please load the document with method readFeatureFile",
      );
    }
    const tasgData = [];
    if (
      this.#cucumberDocuments.length === 1 &&
      this.#cucumberDocuments[0].feature.tags
    ) {
      tasgData.push(...this.#cucumberDocuments[0].feature.tags);
    } else {
      for (const cucumberDocument of this.#cucumberDocuments) {
        if (cucumberDocument.feature.tags) {
          tasgData.push(...cucumberDocument.feature.tags);
        }
      }
    }
    this.#cucumberTags = tasgData;
    return tasgData;
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

  appendTagsToScenarios(tags) {
    for (const cucumberScenario of this.#cucumberScenarios) {
      if (cucumberScenario.tags) cucumberScenario.tags.push(...tags);
    }
  }

  getTagsData() {
    return this.#cucumberTags;
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
}

exports.CucumberDocuments = CucumberDocuments;
