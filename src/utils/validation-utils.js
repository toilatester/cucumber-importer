const {ENVIRONMENT_KEYS_REQUIRE} = require('./constant');
function validateEnvironmentVariables(enviromentVariables, logger) {
  for (const keyRequired of ENVIRONMENT_KEYS_REQUIRE) {
    const missingValueInEnvironmentVariables =
      !enviromentVariables.includes(keyRequired);
    if (missingValueInEnvironmentVariables) {
      logger.warn(
        `Missing value of ${keyRequired} in environment variable, you need to input value in CLI`,
      );
    }
  }
}

exports.validateEnvironmentVariables = validateEnvironmentVariables;
