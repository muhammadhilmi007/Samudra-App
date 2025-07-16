// ekspedisi page
const index = (request, response, next) => {
  response.render("../views/pages/penjualan/ekspedisi/index.ejs", {
    title: "Ekspedisi",
    name: "ekspedisi",
  });
};

module.exports = {
  index,
};
