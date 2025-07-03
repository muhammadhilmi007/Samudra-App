const express = require('express')
const router = express.Router()
const WebsiteController = require('../controllers/website')
const authMiddleware = require('../middlewares/auth')
const localeMiddleware = require('../middlewares/locale')

router.get('/landing/:language(en|gr|ar)', [localeMiddleware.localized, authMiddleware.isAuthenticated], WebsiteController.landingPage)
router.get('/cek-resi/:language(en|gr|ar)', [localeMiddleware.localized, authMiddleware.isAuthenticated], WebsiteController.cekResi)
router.get('/cek-harga/:language(en|gr|ar)', [localeMiddleware.localized, authMiddleware.isAuthenticated], WebsiteController.cekHarga)
router.get('/lokasi/:language(en|gr|ar)', [localeMiddleware.localized, authMiddleware.isAuthenticated], WebsiteController.lokasi)
router.get('/berita/:language(en|gr|ar)', [localeMiddleware.localized, authMiddleware.isAuthenticated], WebsiteController.berita)

module.exports = router