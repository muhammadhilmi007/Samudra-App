// akun page
const akun = (request, response, next) => {
  response.render("../views/pages/keuangan/akun.ejs", {
    title: "Akun",
    name: "akun",
  });
};

// jurnal umum page
const jurnalUmum = (request, response, next) => {
  response.render("../views/pages/keuangan/jurnal_umum.ejs", {
    title: "Jurnal Umum",
    name: "jurnal_umum",
  });
};
// arus kas page
const arusKas = (request, response, next) => {
  response.render("../views/pages/keuangan/arus_kas.ejs", {
    title: "Arus Kas",
    name: "arus_kas",
  });
};

// kas kecil page
const kasKecil = (request, response, next) => {
  response.render("../views/pages/keuangan/kas_kecil.ejs", {
    title: "Kas Kecil",
    name: "kas_kecil",
  });
};

// kas bantuan page
const kasBantuan = (request, response, next) => {
  response.render("../views/pages/keuangan/kas_bantuan.ejs", {
    title: "Kas Bantuan",
    name: "kas_bantuan",
  });
};

// bank page
const bank = (request, response, next) => {
  response.render("../views/pages/keuangan/bank.ejs", {
    title: "Bank",
    name: "bank",
  });
};

// piutang page
const piutang = (request, response, next) => {
  response.render("../views/pages/keuangan/piutang.ejs", {
    title: "Piutang",
    name: "piutang",
  });
};

// laba rugi page
const labaRugi = (request, response, next) => {
  response.render("../views/pages/keuangan/laba_rugi.ejs", {
    title: "Laba Rugi",
    name: "laba_rugi",
  });
};

// neraca page
const neraca = (request, response, next) => {
  response.render("../views/pages/keuangan/neraca.ejs", {
    title: "Neraca",
    name: "neraca",
  });
};

// pajak page
const pajak = (request, response, next) => {
  response.render("../views/pages/keuangan/pajak.ejs", {
    title: "Pajak",
    name: "pajak",
  });
};

module.exports = {
    akun,
    jurnalUmum,
    arusKas,
    kasKecil,
    kasBantuan,
    bank,
    piutang,
    labaRugi,
    neraca,
    pajak
};
