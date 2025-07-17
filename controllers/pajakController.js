// penjualan page
const index = (request, response, next) => {
  response.render("../views/pages/keuangan/pajak/index.ejs", {
    title: "Pajak",
    name: "pajak",
  });
};

module.exports = {
  index,
};
