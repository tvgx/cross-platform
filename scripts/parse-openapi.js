const fs = require('fs');

const spec = JSON.parse(fs.readFileSync('scripts/openapi.json', 'utf8'));

console.log('OpenAPI Version:', spec.openapi || spec.swagger);
console.log('Title:', spec.info.title);
console.log('Description:', spec.info.description);
console.log('Version:', spec.info.version);

console.log('\n================ ENDPOINTS ================\n');

for (const [path, pathItem] of Object.entries(spec.paths)) {
  for (const [method, operation] of Object.entries(pathItem)) {
    console.log(`[${method.toUpperCase()}] ${path} - ${operation.summary || ''}`);
    
    // Check parameters
    if (operation.parameters && operation.parameters.length > 0) {
      console.log('  Parameters:');
      for (const param of operation.parameters) {
        console.log(`    - ${param.name} (${param.in}): ${param.required ? 'required' : 'optional'} - ${param.description || ''}`);
      }
    }
    
    // Check requestBody
    if (operation.requestBody) {
      console.log('  Request Body:');
      const content = operation.requestBody.content;
      for (const [mimeType, mediaType] of Object.entries(content)) {
        console.log(`    Mime: ${mimeType}`);
        if (mediaType.schema) {
          if (mediaType.schema.$ref) {
            console.log(`      Schema Ref: ${mediaType.schema.$ref}`);
          } else {
            console.log(`      Schema properties:`, Object.keys(mediaType.schema.properties || {}));
          }
        }
      }
    }
    
    // Check responses
    if (operation.responses) {
      console.log('  Responses:');
      for (const [statusCode, response] of Object.entries(operation.responses)) {
        console.log(`    ${statusCode}: ${response.description || ''}`);
      }
    }
    console.log('-------------------------------------------');
  }
}

// Print Schemas / Definitions if needed
if (spec.components && spec.components.schemas) {
  console.log('\n================ SCHEMAS ================');
  for (const [name, schema] of Object.entries(spec.components.schemas)) {
    console.log(`\nSchema: ${name}`);
    console.log(`  Properties:`);
    for (const [propName, prop] of Object.entries(schema.properties || {})) {
      console.log(`    - ${propName}: ${prop.type || ''} ${prop.$ref ? 'Ref: ' + prop.$ref : ''} (${schema.required && schema.required.includes(propName) ? 'required' : 'optional'})`);
    }
  }
}
