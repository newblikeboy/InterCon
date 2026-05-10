const env = require("../config/env");
const HttpError = require("../utils/httpError");

function getEmbeddedSignupUrl() {
  if (!env.embeddedSignupUrl) {
    throw new HttpError(500, "EMBED_SIGN_UP is not configured");
  }

  return env.embeddedSignupUrl;
}

module.exports = {
  getEmbeddedSignupUrl
};
