const Jira = require('jira-client');
const axios = require('axios');
const log4js = require('log4js');
const logger = log4js.getLogger('jira-rest-client');
logger.level = 'info';

class JiraRestClient {
  #jiraRestClientUserName;
  #jiraRestClientToken;
  #jiraRestBasicAuthenticateData;
  #jiraHost;
  #jiraClient;

  constructor(config = {host, username, token}) {
    const {host, username, token} = config;
    this.#jiraHost = host;
    this.#jiraRestClientUserName = username;
    this.#jiraRestClientToken = token;
    this.#generateBasicAuthenticateData();
    this.#jiraClient = new Jira({
      protocol: 'https',
      host,
      username: username,
      password: token,
      apiVersion: '3',
      strictSSL: true,
    });
  }

  getJiraClientInstance() {
    return this.#jiraClient;
  }

  async getAllJiraFields() {
    return await this.#jiraClient.listFields();
  }

  async getAllIssueType() {
    return await this.#jiraClient.listIssueTypes();
  }

  async getFieldContextValue(filedKey) {
    const response = await axios.get(
      `https://${this.#jiraHost}/rest/api/3/field/${filedKey}/context`,
      {
        validateStatus: (status) => status >= 200 && status < 500,
        headers: {
          'Accept-Encoding': 'gzip,deflate,compress',
          'Content-Type': 'application/json',
          'Authorization': `Basic ${this.#jiraRestBasicAuthenticateData}`,
        },
      },
    );
    return response.data;
  }

  async getFieldContextOptionValues(filedKey, contextId) {
    const response = await axios.get(
      `https://${
        this.#jiraHost
      }/rest/api/3/field/${filedKey}/context/${contextId}/option`,
      {
        validateStatus: (status) => status >= 200 && status < 500,
        headers: {
          'Accept-Encoding': 'gzip,deflate,compress',
          'Content-Type': 'application/json',
          'Authorization': `Basic ${this.#jiraRestBasicAuthenticateData}`,
        },
      },
    );
    return response.data;
  }

  #generateBasicAuthenticateData() {
    const basicAuth = Buffer.from(
      `${this.#jiraRestClientUserName}:${this.#jiraRestClientToken}`,
      'utf-8',
    );
    this.#jiraRestBasicAuthenticateData = basicAuth.toString('base64');
  }
}

exports.JiraRestClient = JiraRestClient;
