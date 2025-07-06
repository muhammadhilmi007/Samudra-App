const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/auth');
const permissionMiddleware = require('../middlewares/permission');
const localeMiddleware = require('../middlewares/locale');

// Controllers
const BranchController = require('../controllers/branchController');
const DivisionController = require('../controllers/divisionController');
const PositionController = require('../controllers/positionController');
const RoleController = require('../controllers/roleController');
const ModuleController = require('../controllers/moduleController');
const UserController = require('../controllers/userController');

// Apply authentication middleware to all admin routes
router.use(authMiddleware.isAuthenticated);
router.use(permissionMiddleware.loadUserPermissions);

// Branch Management
router.get('/branches', permissionMiddleware.checkPermission('branches', 'read'), BranchController.index);
router.get('/branches/create', permissionMiddleware.checkPermission('branches', 'create'), BranchController.create);
router.post('/branches', permissionMiddleware.checkPermission('branches', 'create'), BranchController.store);
router.get('/branches/:id/edit', permissionMiddleware.checkPermission('branches', 'update'), BranchController.edit);
router.put('/branches/:id', permissionMiddleware.checkPermission('branches', 'update'), BranchController.update);
router.delete('/branches/:id', permissionMiddleware.checkPermission('branches', 'delete'), BranchController.destroy);

// Division Management
router.get('/divisions', permissionMiddleware.checkPermission('divisions', 'read'), DivisionController.index);
router.get('/divisions/create', permissionMiddleware.checkPermission('divisions', 'create'), DivisionController.create);
router.post('/divisions', permissionMiddleware.checkPermission('divisions', 'create'), DivisionController.store);
router.get('/divisions/:id/edit', permissionMiddleware.checkPermission('divisions', 'update'), DivisionController.edit);
router.put('/divisions/:id', permissionMiddleware.checkPermission('divisions', 'update'), DivisionController.update);
router.delete('/divisions/:id', permissionMiddleware.checkPermission('divisions', 'delete'), DivisionController.destroy);

// Position Management
router.get('/positions', permissionMiddleware.checkPermission('positions', 'read'), PositionController.index);
router.get('/positions/create', permissionMiddleware.checkPermission('positions', 'create'), PositionController.create);
router.post('/positions', permissionMiddleware.checkPermission('positions', 'create'), PositionController.store);
router.get('/positions/:id/edit', permissionMiddleware.checkPermission('positions', 'update'), PositionController.edit);
router.put('/positions/:id', permissionMiddleware.checkPermission('positions', 'update'), PositionController.update);
router.delete('/positions/:id', permissionMiddleware.checkPermission('positions', 'delete'), PositionController.destroy);

// Role Management
router.get('/roles/:language(en|gr|ar)',[localeMiddleware.localized, authMiddleware.isAuthenticated], permissionMiddleware.checkPermission('roles', 'read'), RoleController.index);
router.get('/roles/create/:language(en|gr|ar)',[localeMiddleware.localized, authMiddleware.isAuthenticated], permissionMiddleware.checkPermission('roles', 'create'), RoleController.create);
router.post('/roles/:language(en|gr|ar)',[localeMiddleware.localized, authMiddleware.isAuthenticated], permissionMiddleware.checkPermission('roles', 'create'), RoleController.store);
router.get('/roles/:id/edit/:language(en|gr|ar)',[localeMiddleware.localized, authMiddleware.isAuthenticated], permissionMiddleware.checkPermission('roles', 'update'), RoleController.edit);
router.put('/roles/:id/:language(en|gr|ar)',[localeMiddleware.localized, authMiddleware.isAuthenticated], permissionMiddleware.checkPermission('roles', 'update'), RoleController.update);
router.get('/roles/:id/permissions/:language(en|gr|ar)',[localeMiddleware.localized, authMiddleware.isAuthenticated], permissionMiddleware.checkPermission('roles', 'update'), RoleController.permissions);
router.post('/roles/:id/permissions/:language(en|gr|ar)',[localeMiddleware.localized, authMiddleware.isAuthenticated], permissionMiddleware.checkPermission('roles', 'update'), RoleController.updatePermissions);
router.delete('/roles/:id/:language(en|gr|ar)',[localeMiddleware.localized, authMiddleware.isAuthenticated], permissionMiddleware.checkPermission('roles', 'delete'), RoleController.destroy);

// Module Management
router.get('/modules', permissionMiddleware.checkPermission('modules', 'read'), ModuleController.index);
router.get('/modules/create', permissionMiddleware.checkPermission('modules', 'create'), ModuleController.create);
router.post('/modules', permissionMiddleware.checkPermission('modules', 'create'), ModuleController.store);
router.get('/modules/:id/edit', permissionMiddleware.checkPermission('modules', 'update'), ModuleController.edit);
router.put('/modules/:id', permissionMiddleware.checkPermission('modules', 'update'), ModuleController.update);
router.get('/modules/:id/permissions', permissionMiddleware.checkPermission('modules', 'read'), ModuleController.permissions);
router.post('/modules/:id/permissions', permissionMiddleware.checkPermission('modules', 'update'), ModuleController.addPermission);
router.delete('/modules/:id', permissionMiddleware.checkPermission('modules', 'delete'), ModuleController.destroy);

// User Management
router.get('/users', permissionMiddleware.checkPermission('users', 'read'), UserController.index);
router.get('/users/create', permissionMiddleware.checkPermission('users', 'create'), UserController.create);
router.post('/users', permissionMiddleware.checkPermission('users', 'create'), UserController.store);
router.get('/users/:id/edit', permissionMiddleware.checkPermission('users', 'update'), UserController.edit);
router.put('/users/:id', permissionMiddleware.checkPermission('users', 'update'), UserController.update);
router.delete('/users/:id', permissionMiddleware.checkPermission('users', 'delete'), UserController.destroy);

// AJAX Endpoints
router.get('/api/roles', authMiddleware.isAuthenticated, UserController.getRolesByFilters);

module.exports = router;