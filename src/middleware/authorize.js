const HttpError = require("../utils/httpError");

function authorize(...allowedRoles) {
  const roles = new Set(allowedRoles);

  return function requireRole(req, res, next) {
    if (!req.user || !roles.has(req.user.role)) {
      next(new HttpError(403, "You do not have permission to perform this action"));
      return;
    }
    next();
  };
}

module.exports = authorize;
