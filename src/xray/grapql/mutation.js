const {gql} = require("graphql-request");

const graphqlCreateFolder = gql`
  mutation ($path: String!, $projectId: String!) {
    createFolder(path: $path, projectId: $projectId) {
      folder {
        name
        path
        testsCount
      }
    }
  }
`;

const graphqlDeleteFolder = gql`
  mutation ($path: String!, $projectId: String!) {
    deleteFolder(path: $path, projectId: $projectId)
  }
`;

const graphqlAddTestsToFolder = gql`
  mutation ($projectId: String!, $path: String!, $testIssueIds: [String]!) {
    addTestsToFolder(
      projectId: $projectId
      path: $path
      testIssueIds: $testIssueIds
    ) {
      folder {
        name
        path
        testsCount
      }
      warnings
    }
  }
`;

module.exports = {
  graphqlCreateFolder,
  graphqlDeleteFolder,
  graphqlAddTestsToFolder,
};
