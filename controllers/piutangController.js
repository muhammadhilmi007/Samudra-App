// penjualan page
const index = (request, response, next) => {
  response.render("../views/pages/keuangan/piutang/index.ejs", {
    title: "Piutang",
    name: "piutang",
  });
};

module.exports = {
  index,
};
