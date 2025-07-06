const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/auth');
const permissionMiddleware = require('../middlewares/permission');
const ProductController = require('../controllers/productController');

// Apply authentication middleware
router.use(authMiddleware.isAuthenticated);
router.use(permissionMiddleware.loadUserPermissions);

// Product routes with permission checks
router.get('/', permissionMiddleware.checkPermission('products', 'read'), ProductController.index);
router.get('/create', permissionMiddleware.checkPermission('products', 'create'), ProductController.create);
router.post('/', permissionMiddleware.checkPermission('products', 'create'), ProductController.store);
router.get('/:id', permissionMiddleware.checkPermission('products', 'read'), ProductController.show);
router.get('/:id/edit', permissionMiddleware.checkPermission('products', 'update'), ProductController.edit);
router.put('/:id', permissionMiddleware.checkPermission('products', 'update'), ProductController.update);
router.delete('/:id', permissionMiddleware.checkPermission('products', 'delete'), ProductController.destroy);

module.exports = router;