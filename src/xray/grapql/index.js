const {
  graphqlCreateFolder,
  graphqlDeleteFolder,
  graphqlAddTestsToFolder,
} = require("./mutation");
const {graphqlFolderQuery} = require("./query");

module.exports = {
  graphqlCreateFolder,
  graphqlDeleteFolder,
  graphqlFolderQuery,
  graphqlAddTestsToFolder,
};
