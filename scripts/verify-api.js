const axios = require('axios');

const BASE_URL = 'https://adware-merely-andrews-home.trycloudflare.com';

async function testCatalog() {
  try {
    const catRes = await axios.post(`${BASE_URL}/api/get_categories`, {});
    console.log('[SUCCESS] POST /api/get_categories');
    console.log('Keys:', Object.keys(catRes.data));
    console.log('Data sample:', JSON.stringify(catRes.data.data).substring(0, 300));

    const brandRes = await axios.post(`${BASE_URL}/api/get_list_brands`, {});
    console.log('[SUCCESS] POST /api/get_list_brands');
    console.log('Keys:', Object.keys(brandRes.data));
    console.log('Data sample:', JSON.stringify(brandRes.data.data).substring(0, 300));
  } catch (err) {
    console.error('[ERROR]', err.message);
  }
}

testCatalog();
