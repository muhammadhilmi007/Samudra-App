const express = require('express')
const router = express.Router()
const HrdController = require('../controllers/hrdController')
const authMiddleware = require('../middlewares/auth')
const localeMiddleware = require('../middlewares/locale')

router.get('/karyawan/:language(en|gr|ar)', [localeMiddleware.localized, authMiddleware.isAuthenticated], HrdController.karyawan)
router.get('/absensi/:language(en|gr|ar)', [localeMiddleware.localized, authMiddleware.isAuthenticated], HrdController.absensi)
router.get('/gaji/:language(en|gr|ar)', [localeMiddleware.localized, authMiddleware.isAuthenticated], HrdController.gaji)
router.get('/cuti/:language(en|gr|ar)', [localeMiddleware.localized, authMiddleware.isAuthenticated], HrdController.cuti)
router.get('/laporan/:language(en|gr|ar)', [localeMiddleware.localized, authMiddleware.isAuthenticated], HrdController.laporan)

module.exports = router