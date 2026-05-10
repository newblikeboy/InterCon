const asyncHandler = require("../utils/asyncHandler");
const webhookService = require("../services/webhook.service");

const verifyMetaWebhook = asyncHandler(async (req, res) => {
  const challenge = webhookService.verifyMetaChallenge(req.query);
  res.status(200).send(challenge);
});

const receiveMetaWebhook = asyncHandler(async (req, res) => {
  await webhookService.processMetaWebhook(req);
  res.sendStatus(200);
});

module.exports = {
  verifyMetaWebhook,
  receiveMetaWebhook
};
