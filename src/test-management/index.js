const {JiraRestClient} = require('./jira');

const TEST_MANAGEMENT_TYPE = {
  JIRA_CLOUD: JiraRestClient,
  JIRA_DC: JiraRestClient,
};

exports.TEST_MANAGEMENT_TYPE = TEST_MANAGEMENT_TYPE;
