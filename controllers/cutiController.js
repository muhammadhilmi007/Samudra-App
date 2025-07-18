// penjualan page
const index = (request, response, next) => {
  response.render("../views/pages/hrd/cuti/index.ejs", {
    title: "Cuti",
    name: "cuti",
  });
};

module.exports = {
  index,
};
