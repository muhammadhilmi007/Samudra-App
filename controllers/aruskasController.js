// penjualan page
const index = (request, response, next) => {
  response.render("../views/pages/keuangan/aruskas/index.ejs", {
    title: "Arus Kas",
    name: "aruskas",
  });
};

module.exports = {
  index,
};
