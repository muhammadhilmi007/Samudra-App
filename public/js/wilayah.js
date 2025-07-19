// Client-side wilayah API handler
const WilayahAPI = {
  baseUrl: 'https://www.emsifa.com/api-wilayah-indonesia/api',

  async getProvinces() {
    const response = await fetch(`${this.baseUrl}/provinces.json`);
    return response.json();
  },

  async getCities(provinceId) {
    const response = await fetch(`${this.baseUrl}/regencies/${provinceId}.json`);
    return response.json();
  },

  async getDistricts(cityId) {
    const response = await fetch(`${this.baseUrl}/districts/${cityId}.json`);
    return response.json();
  },

  async getVillages(districtId) {
    const response = await fetch(`${this.baseUrl}/villages/${districtId}.json`);
    return response.json();
  },

  // Initialize dropdowns
  async initializeDropdowns(selectors) {
    const { province, city, district, village } = selectors;
    
    // Load provinces
    const provinces = await this.getProvinces();
    this.populateDropdown(province, provinces);

    // Province change handler
    document.querySelector(province).addEventListener('change', async (e) => {
      const provinceId = e.target.value;
      document.querySelector(city).innerHTML = '<option value="">Select City</option>';
      document.querySelector(district).innerHTML = '<option value="">Select District</option>';
      if (village) document.querySelector(village).innerHTML = '<option value="">Select Village</option>';
      
      if (provinceId) {
        const cities = await this.getCities(provinceId);
        this.populateDropdown(city, cities);
      }
    });

    // City change handler
    document.querySelector(city).addEventListener('change', async (e) => {
      const cityId = e.target.value;
      document.querySelector(district).innerHTML = '<option value="">Select District</option>';
      if (village) document.querySelector(village).innerHTML = '<option value="">Select Village</option>';
      
      if (cityId) {
        const districts = await this.getDistricts(cityId);
        this.populateDropdown(district, districts);
      }
    });

    // District change handler (if village selector exists)
    if (village) {
      document.querySelector(district).addEventListener('change', async (e) => {
        const districtId = e.target.value;
        document.querySelector(village).innerHTML = '<option value="">Select Village</option>';
        
        if (districtId) {
          const villages = await this.getVillages(districtId);
          this.populateDropdown(village, villages);
        }
      });
    }
  },

  populateDropdown(selector, data) {
    const dropdown = document.querySelector(selector);
    dropdown.innerHTML = '<option value="">Select...</option>';
    data.forEach(item => {
      const option = document.createElement('option');
      option.value = item.id;
      option.textContent = item.name;
      dropdown.appendChild(option);
    });
  }
};