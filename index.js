const postmanToOpenApi = require('postman-to-openapi');
const path = require('path');
const fs = require('fs');

/**
 * Convert Postman collection to OpenAPI specification
 * @param {string} inputFile - Path to Postman collection JSON file
 * @param {string} outputFile - Path to output OpenAPI YAML file
 * @param {Object} options - Conversion options
 * @param {string} options.defaultTag - Default tag for endpoints
 * @param {Object} options.info - API information
 * @param {string} options.info.title - API title
 * @param {string} options.info.description - API description
 * @param {string} options.info.version - API version
 * @returns {Promise<void>}
 */
async function generateSwagger(inputFile, outputFile, options = {}) {
  try {
    console.log('🔄 Converting Postman collection to OpenAPI...');
    
    // Set default options for postman-to-openapi library
    const postmanOptions = {
      defaultTag: options.defaultTag || 'General'
    };
    
    // Convert Postman to OpenAPI and save as YAML
    await postmanToOpenApi(inputFile, outputFile, postmanOptions);
    
    console.log('✅ Successfully generated OpenAPI specification!');
    console.log(`📁 Output file: ${outputFile}`);
    
    // Post-process the OpenAPI YAML to inject example responses and custom info
    console.log('🔄 Post-processing OpenAPI to inject example responses and custom info...');
    await injectExampleResponses(inputFile, outputFile, options);
    
    console.log('✅ Successfully enhanced OpenAPI with example responses and custom info!');
    
  } catch (error) {
    console.error('❌ Error generating OpenAPI specification:', error.message);
    throw error;
  }
}

/**
 * Inject example responses from Postman collection into OpenAPI specification
 * @param {string} postmanFile - Path to Postman collection file
 * @param {string} openapiFile - Path to OpenAPI YAML file
 * @param {Object} options - Options for customizing the OpenAPI spec
 * @returns {Promise<void>}
 */
async function injectExampleResponses(postmanFile, openapiFile, options = {}) {
  try {
    // Load both files
    const postman = JSON.parse(fs.readFileSync(postmanFile, 'utf8'));
    const openapiContent = fs.readFileSync(openapiFile, 'utf8');
    
    // Parse YAML content
    const YAML = require('yamljs');
    const openapi = YAML.parse(openapiContent);
    
    // Apply custom API info if provided
    if (options.info) {
      if (options.info.title) {
        openapi.info.title = options.info.title;
      }
      if (options.info.description) {
        openapi.info.description = options.info.description;
      }
      if (options.info.version) {
        openapi.info.version = options.info.version;
      }
      console.log(`  ✅ Applied custom API info: ${openapi.info.title} v${openapi.info.version}`);
    }
    
    let enhancedCount = 0;
    
    // Process each item in the Postman collection
    function processItems(items, parentPath = '') {
      items.forEach(item => {
        if (item.item) {
          // This is a folder, recursively process its items
          const folderPath = parentPath ? `${parentPath}/${item.name}` : item.name;
          processItems(item.item, folderPath);
        } else if (item.request && item.response && item.response.length > 0) {
          // This is a request with responses
          const example = item.response[0]; // First saved example
          const url = item.request.url;
          
          if (url) {
            let apiPath;
            let method = item.request.method ? item.request.method.toLowerCase() : 'get';
            
            // Handle different URL formats in Postman collections
            if (typeof url === 'string') {
              // URL is a simple string
              try {
                const urlObj = new URL(url);
                apiPath = urlObj.pathname;
              } catch (urlError) {
                // If URL parsing fails, try to extract path from the string
                apiPath = url.startsWith('http') ? new URL(url).pathname : url;
              }
            } else if (url.path) {
              // URL has path property (array or string)
              const pathSegments = Array.isArray(url.path) ? url.path : [url.path];
              apiPath = `/${pathSegments.join('/')}`;
            } else if (url.raw) {
              // URL has raw property
              try {
                const urlObj = new URL(url.raw);
                apiPath = urlObj.pathname;
              } catch (urlError) {
                apiPath = url.raw.startsWith('http') ? new URL(url.raw).pathname : url.raw;
              }
            } else {
              // Skip this item if we can't determine the path
              console.log(`  ⚠️  Could not determine path for ${item.name}`);
              return;
            }
            
            // Ensure apiPath starts with /
            if (!apiPath.startsWith('/')) {
              apiPath = `/${apiPath}`;
            }
            
            // Check if this path and method exist in the OpenAPI spec
            if (openapi.paths[apiPath] && openapi.paths[apiPath][method]) {
              // Inject the example response
              if (example.body) {
                try {
                  let responseBody;
                  if (typeof example.body === 'string') {
                    responseBody = JSON.parse(example.body);
                  } else {
                    responseBody = example.body;
                  }
                  
                  // Get the status code from the response
                  const statusCode = example.code || example.status || '200';
                  
                  // Initialize responses object if it doesn't exist
                  if (!openapi.paths[apiPath][method].responses) {
                    openapi.paths[apiPath][method].responses = {};
                  }
                  
                  // Add the example response
                  openapi.paths[apiPath][method].responses[statusCode] = {
                    description: `Example response for ${item.name}`,
                    content: {
                      "application/json": {
                        example: responseBody
                      }
                    }
                  };
                  
                  enhancedCount++;
                  console.log(`  ✅ Enhanced: ${method.toUpperCase()} ${apiPath}`);
                } catch (parseError) {
                  console.log(`  ⚠️  Could not parse response body for ${method.toUpperCase()} ${apiPath}`);
                }
              }
            }
          }
        }
      });
    }
    
    // Start processing from the root items
    if (postman.item && Array.isArray(postman.item)) {
      processItems(postman.item);
    }
    
    // Write the enhanced OpenAPI spec back to YAML file
    const yamlString = YAML.stringify(openapi, 2);
    fs.writeFileSync(openapiFile, yamlString);
    
    console.log(`📊 Enhanced ${enhancedCount} API endpoints with example responses`);
    
  } catch (error) {
    console.error('❌ Error during post-processing:', error.message);
    throw error;
  }
}

module.exports = {
  generateSwagger,
  injectExampleResponses
};
