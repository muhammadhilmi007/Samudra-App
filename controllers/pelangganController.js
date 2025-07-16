// penjualan page
const index = (request, response, next) => {
  response.render("../views/pages/penjualan/pelanggan/index.ejs", {
    title: "Pelanggan",
    name: "pelanggan",
  });
};

module.exports = {
  index,
};
