// barang page
const index = (request, response, next) => {
  response.render("../views/pages/penjualan/barang/index.ejs", {
    title: "Barang",
    name: "barang",
  });
};

module.exports = {
  index,
};
