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

  async getAllJiraProjects() {
    return await this.#jiraClient.listProjects();
  }

  async getAllJiraFieldOptions() {
    const fields = await this.getAllJiraFields();
    for (const field of fields) {
      try {
        const {key, name, schema, custom} = field;
        const {type, customId} = schema || {};
        const fieldContext = await this.getJiraFieldContextValue(key);
        const fieldContextValue = fieldContext.values;
        if (fieldContextValue) {
          const fieldContextId = fieldContextValue[0]['id'];
          const {id, isGlobalContext, isAnyIssueType} = fieldContextValue[0];
          const fieldOptions = await this.getJiraFieldContextOptionValues(
            key,
            id,
          );
          const fieldOptionValues = fieldOptions.values;
          const fieldOptionErrorMessages = fieldOptions.errorMessages;
          const customFieldOptionValues = fieldOptionErrorMessages
            ? `[${fieldOptionErrorMessages}]`
            : JSON.stringify(fieldOptionValues);
          logger.info(`
          Field name [${name}]
          Field key [${key}]
          Field context id [${fieldContextId}]
          Custom field [${custom}]
          Custom field type [${type}]
          CustomId [${customId}]
          Context id ${id}
          Field with global context [${isGlobalContext}]
          Field config for any issue type [${isAnyIssueType}]
          Field options ${customFieldOptionValues}
          `);
        }
      } catch (err) {
        console.error(err);
      }
    }
  }

  async getAllJiraFields() {
    return await this.#jiraClient.listFields();
  }

  async getAllJiraIssueType() {
    return await this.#jiraClient.listIssueTypes();
  }

  async getJiraFieldContextValue(fieldKey) {
    const response = await axios.get(
      `https://${this.#jiraHost}/rest/api/3/field/${fieldKey}/context`,
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

  async getJiraFieldContextOptionValues(fieldKey, contextId) {
    const response = await axios.get(
      `https://${
        this.#jiraHost
      }/rest/api/3/field/${fieldKey}/context/${contextId}/option`,
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
