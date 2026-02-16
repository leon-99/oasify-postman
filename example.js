const { generateSwagger } = require('./index');
const path = require('path');

// Example usage of oasify-postman
async function example() {
  try {
    console.log('Example: Converting Postman collection to OpenAPI...\n');
    
    // Example with custom options
    await generateSwagger(
      './example-collection.json',  // Input Postman collection
      './output/swagger.yaml',      // Output OpenAPI file
      {
        defaultTag: 'Example API',
        info: {
          title: 'Example API',
          description: 'This is an example API converted from Postman',
          version: '1.0.0'
        }
      }
    );
    
    console.log('\nExample completed successfully!');
    console.log('Check the output/swagger.yaml file');
    
  } catch (error) {
    console.error('Example failed:', error.message);
  }
}

// Run the example if this file is executed directly
if (require.main === module) {
  example();
}

module.exports = { example };
