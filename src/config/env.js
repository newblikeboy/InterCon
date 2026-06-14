const path = require("path");
const dotenv = require("dotenv");

dotenv.config({
  path: path.resolve(process.cwd(), ".env")
});

const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT || 5000),
  mongoUri: process.env.MONGODB_URI || "",
  clientOrigin: process.env.CLIENT_ORIGIN || "",
  embeddedSignupUrl: process.env.EMBED_SIGN_UP || "",
  metaGraphApiVersion: process.env.META_GRAPH_API_VERSION || "v23.0",
  metaWebhookVerifyToken: process.env.META_WEBHOOK_VERIFY_TOKEN || "",
  metaAppSecret: process.env.META_APP_SECRET || "",
  facebookAppId: process.env.FB_APP_ID || "",
  facebookAppSecret: process.env.FB_APP_SECRET || "",
  facebookRegistrationPin: process.env.FB_REG_PIN || "",
  facebookSdkVersion: process.env.FACEBOOK_SDK_VERSION || "v25.0",
  facebookOAuthRedirectUri: process.env.FB_OAUTH_REDIRECT_URI || "",
  facebookLoginConfigId: process.env.FB_LOGIN_CONFIG_ID || "",
  razorpayKeyId: process.env.RAZORPAY_KEY_ID || "",
  razorpayKeySecret: process.env.RAZORPAY_KEY_SECRET || "",
  sessionSecret: process.env.SESSION_SECRET || "",
  jwtSecret: process.env.JWT_SECRET || process.env.SESSION_SECRET || "",
  dataEncryptionKey: process.env.DATA_ENCRYPTION_KEY || process.env.JWT_SECRET || process.env.SESSION_SECRET || "",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  authCookieName: process.env.AUTH_COOKIE_NAME || "intercon_token",
  authCookieMaxAgeMs: Number(process.env.AUTH_COOKIE_MAX_AGE_MS || 7 * 24 * 60 * 60 * 1000),
  rateLimitWindowMs: Number(process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000),
  rateLimitMax: Number(process.env.RATE_LIMIT_MAX || 300)
};

module.exports = env;
