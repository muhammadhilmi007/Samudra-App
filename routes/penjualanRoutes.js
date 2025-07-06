const express = require('express')
const router = express.Router()
const PenjualanController = require('../controllers/penjualanController')
const authMiddleware = require('../middlewares/auth')
const localeMiddleware = require('../middlewares/locale')

router.get('/penjualan/:language(en|gr|ar)', [localeMiddleware.localized, authMiddleware.isAuthenticated], PenjualanController.penjualan)
router.get('/barang/:language(en|gr|ar)', [localeMiddleware.localized, authMiddleware.isAuthenticated], PenjualanController.barang)
router.get('/pelanggan/:language(en|gr|ar)', [localeMiddleware.localized, authMiddleware.isAuthenticated], PenjualanController.pelanggan)
router.get('/packing/:language(en|gr|ar)', [localeMiddleware.localized, authMiddleware.isAuthenticated], PenjualanController.packing)
router.get('/harga/:language(en|gr|ar)', [localeMiddleware.localized, authMiddleware.isAuthenticated], PenjualanController.harga)
router.get('/ekspedisi/:language(en|gr|ar)', [localeMiddleware.localized, authMiddleware.isAuthenticated], PenjualanController.ekspedisi)
router.get('/produk/:language(en|gr|ar)', [localeMiddleware.localized, authMiddleware.isAuthenticated], PenjualanController.produk)
module.exports = router