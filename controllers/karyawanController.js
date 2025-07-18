// penjualan page
const index = (request, response, next) => {
  response.render("../views/pages/hrd/karyawan/index.ejs", {
    title: "Karyawan",
    name: "karyawan",
  });
};

module.exports = {
  index,
};
