// penjualan page
const index = (request, response, next) => {
  response.render("../views/pages/hrd/laporan/index.ejs", {
    title: "Laporan",
    name: "laporan",
  });
};

module.exports = {
  index,
};
