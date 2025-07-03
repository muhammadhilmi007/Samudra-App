// kiriman barang page
const kirimanBarang = (request, response, next) => {
  response.render("../views/pages/operasional/kiriman_barang.ejs", {
    title: "Kiriman Barang",
    name: "kiriman_barang",
  });
};

// pengambilan barang page
const pengambilanBarang = (request, response, next) => {
  response.render("../views/pages/operasional/pengambilan_barang.ejs", {
    title: "Pengambilan Barang",
    name: "pengambilan_barang",
  });
};
// muat barang page
const muatBarang = (request, response, next) => {
  response.render("../views/pages/operasional/muat_barang.ejs", {
    title: "Muat Barang",
    name: "muat_barang",
  });
};

// antar cabang page
const antarCabang = (request, response, next) => {
  response.render("../views/pages/operasional/antar_cabang.ejs", {
    title: "Antar Cabang",
    name: "antar_cabang",
  });
};

// transit cabang page
const transitCabang = (request, response, next) => {
  response.render("../views/pages/operasional/transit_cabang.ejs", {
    title: "Transit Cabang",
    name: "transit_cabang",
  });
};

// lansir cabang page
const lansirCabang = (request, response, next) => {
  response.render("../views/pages/operasional/lansir_barang.ejs", {
    title: "Lansir Cabang",
    name: "lansir_cabang",
  });
};

module.exports = {
  kirimanBarang,
  pengambilanBarang,
  muatBarang,
  antarCabang,
  transitCabang,
  lansirCabang,
};
