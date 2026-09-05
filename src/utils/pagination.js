const mongoose = require("mongoose");
const HttpError = require("./httpError");
function cursorFilter(cursor, direction = "$lt") {
  if (!cursor) return {};
  if (!mongoose.Types.ObjectId.isValid(cursor)) throw new HttpError(400, "Invalid page cursor");
  return { _id: { [direction]: new mongoose.Types.ObjectId(String(cursor)) } };
}
function pageSize(value, fallback = 100, max = 500) {
  return Math.max(1, Math.min(max, Math.floor(Number(value) || fallback)));
}
module.exports = { cursorFilter, pageSize };
