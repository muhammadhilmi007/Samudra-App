const express = require('express')
const router = express.Router()
const OperasionalController = require('../controllers/operasionalController')
const authMiddleware = require('../middlewares/auth')
const localeMiddleware = require('../middlewares/locale')

router.get('/kiriman-barang/:language(en|gr|ar)', [localeMiddleware.localized, authMiddleware.isAuthenticated], OperasionalController.kirimanBarang)
router.get('/pengambilan-barang/:language(en|gr|ar)', [localeMiddleware.localized, authMiddleware.isAuthenticated], OperasionalController.pengambilanBarang)
router.get('/muat-barang/:language(en|gr|ar)', [localeMiddleware.localized, authMiddleware.isAuthenticated], OperasionalController.muatBarang)
router.get('/antar-cabang/:language(en|gr|ar)', [localeMiddleware.localized, authMiddleware.isAuthenticated], OperasionalController.antarCabang)
router.get('/transit-cabang/:language(en|gr|ar)', [localeMiddleware.localized, authMiddleware.isAuthenticated], OperasionalController.transitCabang)
router.get('/lansir-barang/:language(en|gr|ar)', [localeMiddleware.localized, authMiddleware.isAuthenticated], OperasionalController.lansirCabang)

module.exports = router