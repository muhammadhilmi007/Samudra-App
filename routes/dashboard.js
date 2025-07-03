const express = require('express')
const router = express.Router()
const DashboardController = require('../controllers/dashboard')
const authMiddleware = require('../middlewares/auth')
const localeMiddleware = require('../middlewares/locale')

router.get('/analytics/:language(en|gr|ar)', [localeMiddleware.localized, authMiddleware.isAuthenticated], DashboardController.index)
router.get('/marketing/:language(en|gr|ar)', [localeMiddleware.localized, authMiddleware.isAuthenticated], DashboardController.marketing)
router.get('/operasional/:language(en|gr|ar)', [localeMiddleware.localized, authMiddleware.isAuthenticated], DashboardController.operasional)
router.get('/logistics/:language(en|gr|ar)', [localeMiddleware.localized, authMiddleware.isAuthenticated], DashboardController.logistics)
router.get('/keuangan/:language(en|gr|ar)', [localeMiddleware.localized, authMiddleware.isAuthenticated], DashboardController.keuangan)
router.get('/hrd/:language(en|gr|ar)', [localeMiddleware.localized, authMiddleware.isAuthenticated], DashboardController.hrd)
router.get('/cabang/:language(en|gr|ar)', [localeMiddleware.localized, authMiddleware.isAuthenticated], DashboardController.cabang)

module.exports = router