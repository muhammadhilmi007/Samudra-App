// kendaraan page
const kendaraan = (request, response, next) => {
  response.render("../views/pages/administrasi/kendaraan.ejs", {
    title: "Kendaraan",
    name: "kendaraan",
  });
};

// surat page
const surat = (request, response, next) => {
  response.render("../views/pages/administrasi/surat.ejs", {
    title: "Surat",
    name: "surat",
  });
};

// tagihan page
const tagihan = (request, response, next) => {
  response.render("../views/pages/administrasi/tagihan.ejs", {
    title: "Tagihan",
    name: "tagihan",
  });
};

// retur page
const retur = (request, response, next) => {
  response.render("../views/pages/administrasi/retur.ejs", {
    title: "Retur",
    name: "retur",
  });
};

// overdue page
const overdue = (request, response, next) => {
  response.render("../views/pages/administrasi/overdue.ejs", {
    title: "Overdue",
    name: "overdue",
  });
};

// invoice page
const invoice = (request, response, next) => {
  response.render("../views/pages/administrasi/invoice.ejs", {
    title: "Invoice",
    name: "invoice",
  });
};

module.exports = {
  kendaraan,
  surat,
  tagihan,
  retur,
  overdue,
  invoice,
};
