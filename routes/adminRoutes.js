const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/auth');
const permissionMiddleware = require('../middlewares/permission');
const localeMiddleware = require('../middlewares/locale');

// Controllers
const ModuleController = require('../controllers/moduleController');
const UserController = require('../controllers/userController');

// Apply authentication middleware to all admin routes
router.use(authMiddleware.isAuthenticated);
router.use(permissionMiddleware.loadUserPermissions);

// Module Management
router.get('/modules', permissionMiddleware.checkPermission('modules', 'read'), ModuleController.index);
router.get('/modules/create', permissionMiddleware.checkPermission('modules', 'create'), ModuleController.create);
router.post('/modules', permissionMiddleware.checkPermission('modules', 'create'), ModuleController.store);
router.get('/modules/:id/edit', permissionMiddleware.checkPermission('modules', 'update'), ModuleController.edit);
router.put('/modules/:id', permissionMiddleware.checkPermission('modules', 'update'), ModuleController.update);
router.get('/modules/:id/permissions', permissionMiddleware.checkPermission('modules', 'read'), ModuleController.permissions);
router.post('/modules/:id/permissions', permissionMiddleware.checkPermission('modules', 'update'), ModuleController.addPermission);
router.delete('/modules/:id', permissionMiddleware.checkPermission('modules', 'delete'), ModuleController.destroy);

// AJAX Endpoints
router.get('/api/roles', authMiddleware.isAuthenticated, UserController.getRolesByFilters);

module.exports = router;