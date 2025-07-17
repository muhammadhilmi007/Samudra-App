// penjualan page
const index = (request, response, next) => {
  response.render("../views/pages/keuangan/bank/index.ejs", {
    title: "Bank",
    name: "bank",
  });
};

module.exports = {
  index,
};
