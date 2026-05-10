const asyncHandler = require("../utils/asyncHandler");
const contactService = require("../services/contact.service");

const listContacts = asyncHandler(async (req, res) => {
  const contacts = await contactService.listContacts(req.tenantId, req.query);

  res.json({
    success: true,
    contacts
  });
});

const createContact = asyncHandler(async (req, res) => {
  const contact = await contactService.createContact(req.tenantId, req.body);

  res.status(201).json({
    success: true,
    contact
  });
});

const importContacts = asyncHandler(async (req, res) => {
  const result = await contactService.importContacts(req.tenantId, req.body.contacts);

  res.json({
    success: true,
    result
  });
});

const listOptOuts = asyncHandler(async (req, res) => {
  const contacts = await contactService.listOptOuts(req.tenantId);

  res.json({
    success: true,
    contacts
  });
});

const createSegment = asyncHandler(async (req, res) => {
  const segment = await contactService.createSegment(req.tenantId, req.body);

  res.status(201).json({
    success: true,
    segment
  });
});

const listSegments = asyncHandler(async (req, res) => {
  const segments = await contactService.listSegments(req.tenantId);

  res.json({
    success: true,
    segments
  });
});

module.exports = {
  listContacts,
  createContact,
  importContacts,
  listOptOuts,
  createSegment,
  listSegments
};
