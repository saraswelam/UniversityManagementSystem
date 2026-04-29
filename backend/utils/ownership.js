function isAdmin(req) {
  return req.user?.role === "admin";
}

function ownerFilter(req, extra = {}) {
  if (isAdmin(req)) return { ...extra };
  return { ...extra, createdBy: req.user.id };
}

function withOwner(req, data) {
  return {
    ...data,
    createdBy: req.user.id,
  };
}

function removeUndefined(data) {
  Object.keys(data).forEach((key) => {
    if (data[key] === undefined) delete data[key];
  });

  return data;
}

module.exports = {
  isAdmin,
  ownerFilter,
  removeUndefined,
  withOwner,
};
