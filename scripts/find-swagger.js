const axios = require('axios');

const BASE_URL = 'https://adware-merely-andrews-home.trycloudflare.com';

const typicalPaths = [
  '/api-json',
  '/api-docs-json',
  '/swagger.json',
  '/openapi.json',
  '/api-docs/swagger.json',
  '/api-docs-json',
];

async function run() {
  for (const path of typicalPaths) {
    try {
      const res = await axios.get(`${BASE_URL}${path}`);
      console.log(`[FOUND] ${path} - Status: ${res.status}`);
      if (res.data && (res.data.paths || res.data.openapi || res.data.swagger)) {
        console.log(`Successfully retrieved OpenAPI JSON from ${path}!`);
        const fs = require('fs');
        fs.writeFileSync('scripts/openapi.json', JSON.stringify(res.data, null, 2));
        console.log('Saved to scripts/openapi.json');
        return;
      }
    } catch (e) {
      console.log(`[NOT FOUND] ${path} - ${e.message}`);
    }
  }

  // If not found, let's fetch /api-docs HTML to see if we can find the JSON spec URL
  try {
    const res = await axios.get(`${BASE_URL}/api-docs`);
    console.log(`[FETCHED] /api-docs HTML - Status: ${res.status}`);
    const html = res.data;
    const match = html.match(/url:\s*['"]([^'"]+)['"]/i) || html.match(/swagger\.json/gi) || html.match(/urls\s*:\s*\[([^\]]+)\]/i);
    if (match) {
      console.log('Match found in HTML:', match[0]);
    } else {
      console.log('No direct spec url match in HTML, but here is a part of HTML:');
      console.log(html.substring(0, 1000));
    }
  } catch (e) {
    console.log(`Failed to fetch /api-docs: ${e.message}`);
  }
}

run();
