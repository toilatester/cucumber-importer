const {XrayGraphqlClient} = require('./graphql-client');
const {XrayRestClient} = require('./rest-client');

class XRayClient {
  #xrayRestClient;
  #xrayGraphQLClient;
  constructor(clientConfig = {host, clientId, clientSecret, projectId}) {
    const {host, clientId, clientSecret, projectId} = clientConfig;
    this.#xrayRestClient = new XrayRestClient(host, clientId, clientSecret);
    this.#xrayGraphQLClient = new XrayGraphqlClient(
      host,
      clientId,
      clientSecret,
      projectId,
    );
  }

  async exchangeAuthorizationToken() {
    await this.#xrayRestClient.exchangeAuthorizationToken();
  }

  async importCucumberTestToXray(
    projectKey,
    featureFilePath,
    testInfoFilePath,
  ) {
    return await this.#xrayRestClient.importCucumberTestToXray(
      projectKey,
      featureFilePath,
      testInfoFilePath,
    );
  }

  getAuthorizationToken() {
    return this.#xrayRestClient.getAuthorizationToken();
  }

  async getTestFolders(rootPath) {
    return await this.#xrayGraphQLClient.getTestFolders(rootPath);
  }

  async createTestFolder(folderPath) {
    return await this.#xrayGraphQLClient.createTestFolder(folderPath);
  }

  async deleteTestFolder(folderPath) {
    return await this.#xrayGraphQLClient.deleteTestFolder(folderPath);
  }

  async addTestsToFolder(folderPath, testIssueIds) {
    return await this.#xrayGraphQLClient.addTestsToFolder(
      folderPath,
      testIssueIds,
    );
  }
}

exports.XRayClient = XRayClient;
