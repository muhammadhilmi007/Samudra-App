// penjualan page
const index = (request, response, next) => {
  response.render("../views/pages/penjualan/packing/index.ejs", {
    title: "Packing",
    name: "packing",
  });
};

module.exports = {
  index,
};
