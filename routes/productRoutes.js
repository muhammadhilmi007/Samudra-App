const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/auth");
const permissionMiddleware = require("../middlewares/permission");
const ProductController = require("../controllers/productController");
const localeMiddleware = require("../middlewares/locale");

// Apply authentication middleware
router.use(authMiddleware.isAuthenticated);
router.use(permissionMiddleware.loadUserPermissions);

// Product routes with permission checks
router.get(
  "/index/:language(en|gr|ar)",
  [localeMiddleware.localized, authMiddleware.isAuthenticated],
  permissionMiddleware.checkPermission("products", "read"),
  ProductController.index
);
router.get(
  "/create/:language(en|gr|ar)",
  [localeMiddleware.localized, authMiddleware.isAuthenticated],
  permissionMiddleware.checkPermission("products", "create"),
  ProductController.create
);
router.post(
  "/create/:language(en|gr|ar)",
  [localeMiddleware.localized, authMiddleware.isAuthenticated],
  permissionMiddleware.checkPermission("products", "create"),
  ProductController.store
);
router.get(
  "/show/:id/:language(en|gr|ar)",
  [localeMiddleware.localized, authMiddleware.isAuthenticated],
  permissionMiddleware.checkPermission("products", "read"),
  ProductController.show
);
router.get(
  "/edit/:id/:language(en|gr|ar)",
  [localeMiddleware.localized, authMiddleware.isAuthenticated],
  permissionMiddleware.checkPermission("products", "update"),
  ProductController.edit
);
router.post(
  "/update/:id/:language(en|gr|ar)",
  [localeMiddleware.localized, authMiddleware.isAuthenticated],
  permissionMiddleware.checkPermission("products", "update"),
  ProductController.update
);
router.post(
  "/delete/:id/:language(en|gr|ar)",
  [localeMiddleware.localized, authMiddleware.isAuthenticated],
  permissionMiddleware.checkPermission("products", "delete"),
  ProductController.destroy
);

module.exports = router;
