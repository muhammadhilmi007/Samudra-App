require("dotenv").config({ path: "./.env" });
const express = require("express");
const session = require("express-session");
const MongoDBStore = require("connect-mongodb-session")(session);
const globalSession = require("./middlewares/session");
const localeMiddleware = require("./middlewares/locale");
const permissionMiddleware = require("./middlewares/permission");
const menuMiddleware = require("./middlewares/menu");
const bodyParser = require("body-parser");
const expressLayout = require("express-ejs-layouts");
const app = express();
const path = require("path");
const { I18n } = require("i18n");
const storage = require("node-sessionstorage");
const PORT = process.env.PORT || 5000;
const mongoose = require("mongoose");
const DB_HOST = process.env.DATABASE_HOST;
const DB_PORT = process.env.DATABASE_PORT;
const DB_NAME = process.env.DATABASE_NAME;
const BASE_URL = process.env.BASE_URL;

// Method override for PUT and DELETE
const methodOverride = require("method-override");
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));

// requires all the routes
const dashboard_routes = require("./routes/dashboard");
const changelog_routes = require("./routes/changelog");
const application_routes = require("./routes/application");
const ui_routes = require("./routes/ui");
const feature_routes = require("./routes/feature");
const page_routes = require("./routes/pages");
const auth_routes = require("./routes/auth");
const customer_routes = require("./routes/customer");
const website_routes = require("./routes/website");
const keuangan_routes = require("./routes/keuanganRoutes");
const operasional_routes = require("./routes/operasionalRoutes");
const administrasi_routes = require("./routes/administrasiRoutes");
const hrd_routes = require("./routes/hrdRoutes");

// New routes
const module_routes = require("./routes/moduleRoutes");
const product_routes = require("./routes/productRoutes");
const division_routes = require("./routes/divisionRoutes");
const user_routes = require("./routes/userRoutes");
const role_routes = require("./routes/roleRoutes");
const branch_routes = require("./routes/branchesRoutes");
const position_routes = require("./routes/positionRoutes");

// Penjualan Routes
const penjualan_routes = require("./routes/penjualanRoutes");
const barang_routes = require("./routes/barangRoutes");
const ekspedisi_routes = require("./routes/ekspedisiRoutes");
const harga_routes = require("./routes/hargaRoutes");
const packing_routes = require("./routes/packingRoutes");
const pelanggan_routes = require("./routes/pelangganRoutes");

// Keuangan Routes
const akun_routes = require("./routes/akunRoutes");
const aruskas_routes = require("./routes/aruskasRoutes");
const bank_routes = require("./routes/bankRoutes");
const jurnal_routes = require("./routes/jurnalumumRoutes");
const kasbantuan_routes = require("./routes/kasbantuanRoutes");
const kaskecil_routes = require("./routes/kaskecilRoutes");
const labarugi_routes = require("./routes/labarugiRoutes");
const neraca_routes = require("./routes/neracaRoutes");
const pajak_routes = require("./routes/pajakRoutes");
const piutang_routes = require("./routes/piutangRoutes");

// HRD Routes
const absensi_routes = require("./routes/absensiRoutes");
const cuti_routes = require("./routes/cutiRoutes");
const gaji_routes = require("./routes/gajiRoutes");
const karyawan_routes = require("./routes/employeeRoutes");
const laporan_routes = require("./routes/laporanRoutes");

// register all the assets
app.use(BASE_URL + "css", express.static(__dirname + "/public/css"));
app.use(BASE_URL + "js", express.static(__dirname + "/public/js"));
app.use(BASE_URL + "img", express.static(__dirname + "/public/img"));
app.use(BASE_URL + "fonts", express.static(__dirname + "/public/fonts"));
app.use(BASE_URL + "json", express.static(__dirname + "/public/js/json"));

// i18n configuration
const i18n = new I18n();
i18n.configure({
  locales: ["en", "gr", "ar"],
  register: global,
  defaultLocale: "en",
  directory: path.join(__dirname, "/locales"),
});

app.use(i18n.init);
app.use(expressLayout);
const store = new MongoDBStore({
  uri: "mongodb://" + DB_HOST + ":" + DB_PORT + "/" + DB_NAME + "",
  collection: "sessions",
});
app.use(
  session({
    secret: ".D>8z]?H?{(DqzJ*",
    resave: false,
    saveUninitialized: true,
    cookie: {
      secure: false,
      maxAge: 3600000,
    },
    store: store,
  })
);
app.use(bodyParser.urlencoded({ extended: false }));
app.use(globalSession);

// Global middleware for permissions
app.use(permissionMiddleware.loadUserPermissions);

// Global middleware for menu
app.use(menuMiddleware.loadUserMenu);

// Make hasPermission helper available in views
app.locals.hasPermission = permissionMiddleware.hasPermission;

app.locals.base = BASE_URL;
app.use(function (request, response, next) {
  response.locals.base = BASE_URL;
  next();
});

app.set("layout", "./layout/app");
app.set("view engine", "ejs");
app.use(localeMiddleware.currentRoute);

// registering all the routes
app.use(BASE_URL + "dashboard", dashboard_routes);
app.use(BASE_URL + "website", website_routes);
app.use(BASE_URL + "changelog", changelog_routes);
app.use(BASE_URL + "application", application_routes);
app.use(BASE_URL + "ui", ui_routes);
app.use(BASE_URL + "feature", feature_routes);
app.use(BASE_URL + "pages", page_routes);
app.use(BASE_URL + "", auth_routes);
app.use(BASE_URL + "customer", customer_routes);
app.use(BASE_URL + "keuangan", keuangan_routes);
app.use(BASE_URL + "operasional", operasional_routes);
app.use(BASE_URL + "administrasi", administrasi_routes);
app.use(BASE_URL + "hrd", hrd_routes);

// Settings Routes
app.use(BASE_URL + "settings/users", user_routes);
app.use(BASE_URL + "settings/roles", role_routes);
app.use(BASE_URL + "settings/modules", module_routes);

// Administrasi Routes
app.use(BASE_URL + "administrasi/branches", branch_routes);
app.use(BASE_URL + "administrasi/position", position_routes);
app.use(BASE_URL + "administrasi/division", division_routes);

// Penjualan Routes
app.use(BASE_URL + "penjualan/pos", penjualan_routes);
app.use(BASE_URL + "penjualan/barang", barang_routes);
app.use(BASE_URL + "penjualan/produk", product_routes);
app.use(BASE_URL + "penjualan/ekspedisi", ekspedisi_routes);
app.use(BASE_URL + "penjualan/harga", harga_routes);
app.use(BASE_URL + "penjualan/packing", packing_routes);
app.use(BASE_URL + "penjualan/pelanggan", pelanggan_routes);

// Keuangan Routes
app.use(BASE_URL + "keuangan/akun", akun_routes);
app.use(BASE_URL + "keuangan/aruskas", aruskas_routes);
app.use(BASE_URL + "keuangan/bank", bank_routes);
app.use(BASE_URL + "keuangan/jurnalumum", jurnal_routes);
app.use(BASE_URL + "keuangan/kasbantuan", kasbantuan_routes);
app.use(BASE_URL + "keuangan/kaskecil", kaskecil_routes);
app.use(BASE_URL + "keuangan/labarugi", labarugi_routes);
app.use(BASE_URL + "keuangan/neraca", neraca_routes);
app.use(BASE_URL + "keuangan/pajak", pajak_routes);
app.use(BASE_URL + "keuangan/piutang", piutang_routes);

// HRD Absensi
app.use(BASE_URL + "hrd/absensi", absensi_routes);
app.use(BASE_URL + "hrd/cuti", cuti_routes);
app.use(BASE_URL + "hrd/gaji", gaji_routes);
app.use(BASE_URL + "hrd/karyawan", karyawan_routes);
app.use(BASE_URL + "hrd/laporan", laporan_routes);

app.use(localeMiddleware.activeLocale);

mongoose
  .connect("mongodb://" + DB_HOST + ":" + DB_PORT + "/" + DB_NAME + "")
  .then(() => console.log("Mongodb connected successfully !"))
  .catch((error) => console.log(error));

app.listen(PORT, () => console.info("App is running on port " + PORT));
