// penjualan page
const index = (request, response, next) => {
  response.render("../views/pages/keuangan/labarugi/index.ejs", {
    title: "Laba Rugi",
    name: "labarugi",
  });
};

module.exports = {
  index,
};
