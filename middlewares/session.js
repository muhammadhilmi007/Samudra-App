// middleware/flashMessages.js
const flashMessages = (req, res, next) => {
  res.locals.session = req.session.user || '';
  res.locals.successMessage = req.session.successMessage || null;
  res.locals.errorMessage = req.session.errorMessage || null;

  // Hapus dari session setelah disalin ke locals
  delete req.session.successMessage;
  delete req.session.errorMessage;

  next();
};

module.exports = flashMessages;
