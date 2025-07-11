require("dotenv").config({ path: "./.env" });
const express = require("express");
const session = require("express-session");
const MongoDBStore = require("connect-mongodb-session")(session);
const globalSession = require("./middlewares/session");
const localeMiddleware = require("./middlewares/locale");
const permissionMiddleware = require("./middlewares/permission");
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
const penjualan_routes = require("./routes/penjualanRoutes");
const keuangan_routes = require("./routes/keuanganRoutes");
const operasional_routes = require("./routes/operasionalRoutes");
const administrasi_routes = require("./routes/administrasiRoutes");
const hrd_routes = require("./routes/hrdRoutes");

// New routes
const admin_routes = require("./routes/adminRoutes");
const product_routes = require("./routes/productRoutes");
const division_routes = require("./routes/divisionRoutes");
const user_routes = require("./routes/userRoutes");
const role_routes = require("./routes/roleRoutes");

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
app.use(globalSession.globalSession);
app.use(globalSession.errorMessage);

// Global middleware for permissions
app.use(permissionMiddleware.loadUserPermissions);

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
app.use(BASE_URL + "penjualan", penjualan_routes);
app.use(BASE_URL + "keuangan", keuangan_routes);
app.use(BASE_URL + "operasional", operasional_routes);
app.use(BASE_URL + "administrasi", administrasi_routes);
app.use(BASE_URL + "hrd", hrd_routes);
app.use(BASE_URL + "admin", admin_routes);
app.use(BASE_URL + "products", product_routes);
app.use(BASE_URL + "administrasi/division", division_routes);
app.use(BASE_URL + "settings/users", user_routes);
app.use(BASE_URL + "settings/roles", role_routes);

app.use(localeMiddleware.activeLocale);

mongoose
  .connect("mongodb://" + DB_HOST + ":" + DB_PORT + "/" + DB_NAME + "")
  .then(() => console.log("Mongodb connected successfully !"))
  .catch((error) => console.log(error));

app.listen(PORT, () => console.info("App is running on port " + PORT));
