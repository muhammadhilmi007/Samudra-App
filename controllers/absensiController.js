// absensi page
const index = (request, response, next) => {
  response.render("../views/pages/hrd/absensi/index.ejs", {
    title: "Absensi dan Kehadiran",
    name: "absensi",
  });
};

module.exports = {
  index,
};
