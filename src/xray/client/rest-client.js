const axios = require("axios");
const log4js = require("log4js");
const logger = log4js.getLogger();
logger.level = "info";

class XrayRestClient {
  #host;
  #clientId;
  #clientSecret;
  #projectId;
  #authorizationToken;
  constructor(host, clientId, clientSecret, projectId) {
    this.#host = host;
    this.#clientId = clientId;
    this.#clientSecret = clientSecret;
    this.#projectId = projectId;
  }

  async exchangeAuthorizationToken() {
    if (!this.#authorizationToken) {
      logger.info("Send Request To Authorization Service");
      const res = await axios.post(
        `https://${this.#host}/api/v2/authenticate`,
        {
          client_id: this.#clientId,
          client_secret: this.#clientSecret,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        },
      );
      this.#authorizationToken = `Bearer ${res.data}`;
    }
    logger.info("JWT Token", this.#authorizationToken);
  }

  async importCucumberTestToXray(
    projectKey,
    featureFilePath,
    testInfoFilePath,
  ) {
    return await axios.post(
      `https://${this.#host}/api/v2/import/feature?projectKey=${projectKey}`,
      {
        file: fs.createReadStream(featureFilePath),
        testInfo: fs.createReadStream(testInfoFilePath),
      },
      {
        headers: {
          "Content-Type": "multipart/form-data",
          "Authorization": this.#authorizationToken,
        },
      },
    );
  }

  getAuthorizationToken() {
    return this.#authorizationToken;
  }
}

exports.XrayRestClient = XrayRestClient;
