document.addEventListener("DOMContentLoaded", () => {
  const provinsi = document.getElementById("provinsi");
  const kabupaten = document.getElementById("kabupaten");
  const kecamatan = document.getElementById("kecamatan");
  const kelurahan = document.getElementById("kelurahan");

  provinsi.addEventListener("change", async () => {
    const provId = provinsi.value;
    kabupaten.innerHTML = "<option>Pilih Kabupaten</option>";
    kecamatan.innerHTML = "<option>Pilih Kecamatan</option>";
    kelurahan.innerHTML = "<option>Pilih Kelurahan</option>";
    kabupaten.disabled = true;
    kecamatan.disabled = true;
    kelurahan.disabled = true;

    if (provId) {
      const res = await fetch(
        `https://www.emsifa.com/api-wilayah-indonesia/api/regencies/${provId}.json`
      );
      const data = await res.json();
      data.forEach((kab) => {
        kabupaten.innerHTML += `<option value="${kab.id}">${kab.name}</option>`;
      });
      kabupaten.disabled = false;
    }
  });

  kabupaten.addEventListener("change", async () => {
    const kabId = kabupaten.value;
    kecamatan.innerHTML = "<option>Pilih Kecamatan</option>";
    kelurahan.innerHTML = "<option>Pilih Kelurahan</option>";
    kecamatan.disabled = true;
    kelurahan.disabled = true;

    if (kabId) {
      const res = await fetch(
        `https://www.emsifa.com/api-wilayah-indonesia/api/districts/${kabId}.json`
      );
      const data = await res.json();
      data.forEach((kec) => {
        kecamatan.innerHTML += `<option value="${kec.id}">${kec.name}</option>`;
      });
      kecamatan.disabled = false;
    }
  });

  kecamatan.addEventListener("change", async () => {
    const kecId = kecamatan.value;
    kelurahan.innerHTML = "<option>Pilih Kelurahan</option>";
    kelurahan.disabled = true;

    if (kecId) {
      const res = await fetch(
        `https://www.emsifa.com/api-wilayah-indonesia/api/villages/${kecId}.json`
      );
      const data = await res.json();
      data.forEach((kel) => {
        kelurahan.innerHTML += `<option value="${kel.id}">${kel.name}</option>`;
      });
      kelurahan.disabled = false;
    }
  });
});
