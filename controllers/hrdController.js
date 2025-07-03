// karyawan page
const karyawan = (request, response, next) => {
  response.render("../views/pages/hrd/karyawan.ejs", {
    title: "Karyawan",
    name: "karyawan",
  });
};

// absensi page
const absensi = (request, response, next) => {
  response.render("../views/pages/hrd/absensi.ejs", {
    title: "Absensi",
    name: "absensi",
  });
};
// gaji page
const gaji = (request, response, next) => {
  response.render("../views/pages/hrd/gaji.ejs", {
    title: "Gaji",
    name: "gaji",
  });
};

// cuti page
const cuti = (request, response, next) => {
  response.render("../views/pages/hrd/cuti.ejs", {
    title: "Cuti",
    name: "cuti",
  });
};

// laporan page
const laporan = (request, response, next) => {
  response.render("../views/pages/hrd/laporan.ejs", {
    title: "Laporan",
    name: "laporan",
  });
};

module.exports = {
    karyawan,
    absensi,
    gaji,
    cuti,
    laporan
};
