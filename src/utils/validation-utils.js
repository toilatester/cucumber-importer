const {ENVIRONMENT_KEYS_REQUIRE} = require('./constant');
function validateEnvironmentVariables() {
  console.log(ENVIRONMENT_KEYS_REQUIRE);
}

exports.validateEnvironmentVariables = validateEnvironmentVariables;
