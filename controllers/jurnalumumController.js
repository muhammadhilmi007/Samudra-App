// penjualan page
const index = (request, response, next) => {
  response.render("../views/pages/keuangan/jurnalumum/index.ejs", {
    title: "Jurnal Umum",
    name: "jurnalumum",
  });
};

module.exports = {
  index,
};
