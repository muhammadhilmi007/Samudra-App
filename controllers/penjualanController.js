// penjualan page
const index = (request, response, next) => {
  response.render("../views/pages/penjualan/pos/index.ejs", {
    title: "Penjualan",
    name: "penjualan",
  });
};

module.exports = {
  index,
};
