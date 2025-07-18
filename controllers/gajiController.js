// penjualan page
const index = (request, response, next) => {
  response.render("../views/pages/hrd/gaji/index.ejs", {
    title: "Gaji",
    name: "gaji",
  });
};

module.exports = {
  index,
};
