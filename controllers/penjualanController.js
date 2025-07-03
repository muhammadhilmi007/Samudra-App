// penjualan page
const penjualan = (request, response, next) => {
  response.render("../views/pages/penjualan/penjualan.ejs", {
    title: "Penjualan",
    name: "penjualan",
  });
};

// barang page
const barang = (request, response, next) => {
  response.render("../views/pages/penjualan/barang.ejs", {
    title: "Barang",
    name: "barang",
  });
};
// pelanggan page
const pelanggan = (request, response, next) => {
  response.render("../views/pages/penjualan/pelanggan.ejs", {
    title: "Pelanggan",
    name: "pelanggan",
  });
};

// packing page
const packing = (request, response, next) => {
  response.render("../views/pages/penjualan/packing.ejs", {
    title: "Packing",
    name: "packing",
  });
};

// harga page
const harga = (request, response, next) => {
  response.render("../views/pages/penjualan/harga.ejs", {
    title: "Harga",
    name: "harga",
  });
};

// ekspedisi page
const ekspedisi = (request, response, next) => {
  response.render("../views/pages/penjualan/ekspedisi.ejs", {
    title: "Mitra Ekspedisi",
    name: "ekspedisi",
  });
};

module.exports = {
  penjualan,
  barang,
  pelanggan,
  packing,
  harga,
  ekspedisi,
};
