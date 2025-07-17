// penjualan page
const index = (request, response, next) => {
  response.render("../views/pages/keuangan/kasbantuan/index.ejs", {
    title: "Kas Bantuan",
    name: "kasbantuan",
  });
};

module.exports = {
  index,
};
