// penjualan page
const index = (request, response, next) => {
  response.render("../views/pages/keuangan/neraca/index.ejs", {
    title: "Neraca",
    name: "neraca",
  });
};

module.exports = {
  index,
};
