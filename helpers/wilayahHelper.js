const axios = require("axios");

const BASE_URL = "https://www.emsifa.com/api-wilayah-indonesia/api";

const wilayahHelper = {
  // Get all provinces
  async getProvinces() {
    try {
      const response = await axios.get(`${BASE_URL}/provinces.json`);
      return response.data;
    } catch (error) {
      console.error("Error fetching provinces:", error);
      return [];
    }
  },

  // Get cities by province ID
  async getCities(provinceId) {
    try {
      const response = await axios.get(
        `${BASE_URL}/regencies/${provinceId}.json`
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching cities:", error);
      return [];
    }
  },

  // Get districts by city ID
  async getDistricts(cityId) {
    try {
      const response = await axios.get(`${BASE_URL}/districts/${cityId}.json`);
      return response.data;
    } catch (error) {
      console.error("Error fetching districts:", error);
      return [];
    }
  },

  // Get villages by district ID
  async getVillages(districtId) {
    try {
      const response = await axios.get(
        `${BASE_URL}/villages/${districtId}.json`
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching villages:", error);
      return [];
    }
  },
};

module.exports = wilayahHelper;
