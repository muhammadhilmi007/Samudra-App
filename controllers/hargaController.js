// penjualan page
const index = (request, response, next) => {
  response.render("../views/pages/penjualan/harga/index.ejs", {
    title: "Harga",
    name: "Harga",
  });
};

module.exports = {
  index,
};
