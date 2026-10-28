// Conservative date based on the Gazette's printed commencement date. Review
// if the Government changes the phased commencement or retention requirements.
const OPERATIONAL_FROM = Date.parse("2027-05-13T00:00:00+05:30");
function processingRetentionUntil(records, now = Date.now()) {
  if (now < OPERATIONAL_FROM) return null;
  const dates = records.filter(Boolean).map(record => record.lastProcessedAt || record.updatedAt || record.createdAt)
    .map(value => new Date(value).getTime()).filter(Number.isFinite);
  return dates.length ? new Date(Math.max(...dates) + 366 * 86400000) : new Date(now + 366 * 86400000);
}
module.exports = { processingRetentionUntil };
