// landing page
const landingPage = (request, response, next) => {
  response.render("../views/pages/website/landing", {
    title: "Landing Page",
    name: "landing",
  });
};

// cek resi page
const cekResi = (request, response, next) => {
  response.render("../views/pages/website/cek_resi", {
    title: "Cek Resi",
    name: "cek_resi",
  });
};
// cek harga page
const cekHarga = (request, response, next) => {
  response.render("../views/pages/website/cek_harga", {
    title: "Cek Harga",
    name: "cek_harga",
  });
};

// lokasi page
const lokasi = (request, response, next) => {
  response.render("../views/pages/website/lokasi", {
    title: "Lokasi",
    name: "lokasi",
  });
};
// berita page
const berita = (request, response, next) => {
  response.render("../views/pages/website/berita", {
    title: "Berita",
    name: "berita",
  });
};

module.exports = {
  landingPage,
  cekResi,
  cekHarga,
  lokasi,
  berita,
};
