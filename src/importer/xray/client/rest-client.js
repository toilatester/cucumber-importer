const fs = require('fs');
const axios = require('axios');
const log4js = require('log4js');
const logger = log4js.getLogger('xray-rest-client');
logger.level = 'info';

class XrayRestClient {
  #host;
  #clientId;
  #clientSecret;
  #authorizationToken;
  constructor(host, clientId, clientSecret) {
    this.#host = host;
    this.#clientId = clientId;
    this.#clientSecret = clientSecret;
  }

  async exchangeAuthorizationToken() {
    if (!this.#authorizationToken) {
      const res = await axios.post(
        `https://${this.#host}/api/v2/authenticate`,
        {
          client_id: this.#clientId,
          client_secret: this.#clientSecret,
        },
        {
          validateStatus: (status) => status >= 200 && status < 500,
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );
      this.#authorizationToken = `Bearer ${res.data}`;
    }
  }

  async importCucumberTestToXray(projectId, featureFilePath, testInfoFilePath) {
    await this.exchangeAuthorizationToken();
    return await axios.post(
      `https://${this.#host}/api/v2/import/feature?projectKey=${projectId}`,
      {
        file: fs.createReadStream(featureFilePath),
        testInfo: fs.createReadStream(testInfoFilePath),
      },
      {
        validateStatus: (status) => status >= 200 && status < 500,
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': this.#authorizationToken,
        },
      },
    );
  }

  getAuthorizationToken() {
    return this.#authorizationToken;
  }

  setAuthorizationToken(authorizationToken) {
    this.#authorizationToken = authorizationToken;
  }
}

exports.XrayRestClient = XrayRestClient;
