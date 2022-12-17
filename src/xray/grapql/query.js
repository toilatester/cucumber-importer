const {gql} = require('graphql-request');

const graphqlFolderQuery = gql`
  query ($path: String!, $projectId: String!) {
    getFolder(path: $path, projectId: $projectId) {
      name
      path
      testsCount
      folders
    }
  }
`;

module.exports = {
  graphqlFolderQuery,
};
