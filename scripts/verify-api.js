const axios = require('axios');
const fs = require('fs');
const path = require('path');

function getBaseUrl() {
  try {
    const envPath = path.resolve(__dirname, '../local.env');
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8');
      const match = envContent.match(/^EXPO_PUBLIC_API_URL\s*=\s*(.+)$/m);
      if (match && match[1]) {
        return match[1].trim();
      }
    }
  } catch (e) {
    console.error('Lỗi đọc file local.env:', e);
  }
  return 'https://api.example.com/v1'; // fallback
}

const BASE_URL = getBaseUrl();

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
