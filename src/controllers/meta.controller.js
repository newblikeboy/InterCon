const asyncHandler = require("../utils/asyncHandler");
const metaService = require("../services/meta.service");

const getEmbeddedSignupUrl = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    url: metaService.getEmbeddedSignupUrl()
  });
});

module.exports = {
  getEmbeddedSignupUrl
};
