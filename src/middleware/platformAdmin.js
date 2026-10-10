const asyncHandler = require("../utils/asyncHandler");
const User = require("../models/User");
const HttpError = require("../utils/httpError");
module.exports = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user._id).select("+platformRole status isVerified name email tenantId").lean();
  if (user?.status !== "active" || !user.isVerified || user.platformRole !== "admin") throw new HttpError(403, "Platform administrator access is required");
  req.adminActor = user;
  next();
});
