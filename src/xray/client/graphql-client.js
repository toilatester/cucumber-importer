const {GraphQLClient} = require("graphql-request");
const Constant = require("../constant");
const {XrayRestClient} = require("./rest-client");
const {
  graphqlCreateFolder,
  graphqlDeleteFolder,
  graphqlFolderQuery,
  graphqlAddTestsToFolder,
} = require("../grapql");
const log4js = require("log4js");
const logger = log4js.getLogger();
logger.level = "info";

class XrayGraphqlClient {
  #host;
  #projectId;
  #xrayRestClient;
  constructor(host, clientId, clientSecret, projectId) {
    this.#host = host;
    this.#projectId = projectId;
    this.#xrayRestClient = new XrayRestClient(
      host,
      clientId,
      clientSecret,
      projectId,
    );
  }

  async #authenticateRequest() {
    await this.#xrayRestClient.exchangeAuthorizationToken();
  }

  async getTestFolders(rootPath) {
    await this.#authenticateRequest();
    const xrayGraphQLClient = new GraphQLClient(
      `https://${this.#host}/${Constant.GRAPHQL_API_PATH}`,
      {
        headers: {
          authorization: this.#xrayRestClient.getAuthorizationToken(),
        },
      },
    );
    const variables = {
      projectId: this.#projectId,
      path: rootPath,
    };
    const data = await xrayGraphQLClient.request(graphqlFolderQuery, variables);
    logger.info("GraphQL Data Response", JSON.stringify(data));
    return data;
  }

  async createTestFolder(folderPath) {
    await this.#authenticateRequest();
    const xrayGraphQLClient = new GraphQLClient(
      `https://${this.#host}/${Constant.GRAPHQL_API_PATH}`,
      {
        headers: {
          authorization: this.#xrayRestClient.getAuthorizationToken(),
        },
      },
    );
    const variables = {
      projectId: this.#projectId,
      path: folderPath,
    };
    const data = await xrayGraphQLClient.request(
      graphqlCreateFolder,
      variables,
    );
    logger.info("GraphQL Data Response", JSON.stringify(data));
    return data;
  }

  async deleteTestFolder(folderPath) {
    await this.#authenticateRequest();
    const xrayGraphQLClient = new GraphQLClient(
      `https://${this.#host}/${Constant.GRAPHQL_API_PATH}`,
      {
        headers: {
          authorization: this.#xrayRestClient.getAuthorizationToken(),
        },
      },
    );
    const variables = {
      projectId: this.#projectId,
      path: folderPath,
    };
    const data = await xrayGraphQLClient.request(
      graphqlDeleteFolder,
      variables,
    );
    logger.info("GraphQL Data Response", JSON.stringify(data));
    return data;
  }

  async addTestsToFolder(folderPath, testIssueIds) {
    await this.#authenticateRequest();
    const xrayGraphQLClient = new GraphQLClient(
      `https://${this.#host}/${Constant.GRAPHQL_API_PATH}`,
      {
        headers: {
          authorization: this.#xrayRestClient.getAuthorizationToken(),
        },
      },
    );
    const variables = {
      projectId: this.#projectId,
      path: folderPath,
      testIssueIds: testIssueIds,
    };
    const data = await xrayGraphQLClient.request(
      graphqlAddTestsToFolder,
      variables,
    );
    logger.info("GraphQL Data Response", JSON.stringify(data));
    return data;
  }
}

exports.XrayGraphqlClient = XrayGraphqlClient;
