// akun page
const index = (request, response, next) => {
  response.render("../views/pages/keuangan/akun/index.ejs", {
    title: "Akun",
    name: "akun",
  });
};

module.exports = {
  index,
};
