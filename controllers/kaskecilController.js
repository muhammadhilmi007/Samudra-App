// penjualan page
const index = (request, response, next) => {
  response.render("../views/pages/keuangan/kaskecil/index.ejs", {
    title: "Kas Kecil",
    name: "kaskecil",
  });
};

module.exports = {
  index,
};
