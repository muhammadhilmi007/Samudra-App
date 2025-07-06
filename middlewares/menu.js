const menuHelper = require('../helpers/menuHelper');

const loadUserMenu = async (req, res, next) => {
  try {
    if (req.session.user && req.session.user.role_id) {
      // Generate menu based on user's role
      const menu = await menuHelper.generateMenu(req.session.user.role_id);
      res.locals.userMenu = menu;
    } else {
      res.locals.userMenu = [];
    }
    next();
  } catch (error) {
    console.error("Error loading user menu:", error);
    res.locals.userMenu = [];
    next();
  }
};

module.exports = {
  loadUserMenu
};