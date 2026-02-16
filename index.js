const postmanToOpenApi = require('postman-to-openapi');
const path = require('path');
const fs = require('fs');

function readJsonFile(filePath) {
  const buf = fs.readFileSync(filePath);
  const bomUtf8 = Buffer.from([0xEF, 0xBB, 0xBF]);
  const bomUtf16Le = Buffer.from([0xFF, 0xFE]);
  const bomUtf16Be = Buffer.from([0xFE, 0xFF]);
  let content;
  if (buf.length >= 3 && buf.slice(0, 3).equals(bomUtf8)) {
    content = buf.slice(3).toString('utf8');
  } else if (buf.length >= 2 && buf.slice(0, 2).equals(bomUtf16Le)) {
    content = buf.slice(2).toString('utf16le');
  } else if (buf.length >= 2 && buf.slice(0, 2).equals(bomUtf16Be)) {
    content = buf.slice(2).toString('utf16be');
  } else {
    content = buf.toString('utf8');
    if (content.length > 0 && content.charCodeAt(0) === 0xFEFF) {
      content = content.slice(1);
    }
  }
  return JSON.parse(content);
}

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
    console.log('Converting Postman collection to OpenAPI...');
    
    // Set default options for postman-to-openapi library
    const postmanOptions = {
      defaultTag: options.defaultTag || 'General'
    };
    
    // Convert Postman to OpenAPI and save as YAML
    try {
      await postmanToOpenApi(inputFile, outputFile, postmanOptions);
    } catch (conversionError) {
      // If the main conversion fails due to URL issues, create a basic OpenAPI spec
      console.log('Main conversion failed, creating basic OpenAPI spec...');
      await createBasicOpenApiSpec(inputFile, outputFile, postmanOptions);
    }
    
    console.log('Successfully generated OpenAPI specification!');
    console.log(`Output file: ${outputFile}`);
    
    // Post-process the OpenAPI YAML to inject example responses and custom info
    console.log('Post-processing OpenAPI to inject example responses and custom info...');
    await injectExampleResponses(inputFile, outputFile, options);
    
    console.log('Successfully enhanced OpenAPI with example responses and custom info!');
    
  } catch (error) {
    console.error('Error generating OpenAPI specification:', error.message);
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
    const postman = readJsonFile(postmanFile);
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
      console.log(`  Applied custom API info: ${openapi.info.title} v${openapi.info.version}`);
    }

    const collectionVars = {};
    if (postman.variable && Array.isArray(postman.variable)) {
      postman.variable.forEach(v => {
        if (v.key != null) collectionVars[v.key.toLowerCase()] = v.value;
      });
    }
    const baseUrl = collectionVars.baseurl || collectionVars.base_url || 'http://localhost:4000';
    if (openapi.servers && openapi.servers.length > 0) {
      let serverUrl = openapi.servers[0].url || '';
      if (serverUrl.includes('{{') && serverUrl.includes('}}')) {
        if (/^https?:\/\/\{\{\s*baseurl\s*\}\}\/?$/i.test(serverUrl.trim())) {
          serverUrl = baseUrl.replace(/\/$/, '');
        } else {
          serverUrl = serverUrl.replace(/\{\{baseurl\}\}/gi, baseUrl.replace(/^https?:\/\//, '')).replace(/\{\{base_url\}\}/gi, baseUrl.replace(/^https?:\/\//, ''));
          serverUrl = serverUrl.replace(/\{\{([^}]+)\}\}/g, (_, key) => collectionVars[key.toLowerCase()] ?? '');
        }
        if (serverUrl && !serverUrl.includes('{{')) {
          openapi.servers[0].url = serverUrl;
          console.log(`  Applied server URL from collection variables: ${serverUrl}`);
        }
      }
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
              // URL has raw property - handle Postman variables
              let rawUrl = url.raw;
              
              // Replace Postman variables with placeholder values
              rawUrl = rawUrl.replace(/\{\{url\}\}/g, 'http://localhost:3000');
              rawUrl = rawUrl.replace(/\{\{.*?\}\}/g, 'placeholder');
              
              try {
                const urlObj = new URL(rawUrl);
                apiPath = urlObj.pathname;
              } catch (urlError) {
                // If URL parsing still fails, try to extract path from the raw string
                if (rawUrl.includes('/')) {
                  const pathMatch = rawUrl.match(/(\/[^?]*)/);
                  apiPath = pathMatch ? pathMatch[1] : rawUrl;
                } else {
                  apiPath = rawUrl;
                }
              }
            } else {
              // Skip this item if we can't determine the path
              console.log(`  Could not determine path for ${item.name}`);
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
                  console.log(`  Enhanced: ${method.toUpperCase()} ${apiPath}`);
                } catch (parseError) {
                  console.log(`  Could not parse response body for ${method.toUpperCase()} ${apiPath}`);
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
    
    console.log(`Enhanced ${enhancedCount} API endpoints with example responses`);
    
  } catch (error) {
    console.error('Error during post-processing:', error.message);
    throw error;
  }
}

/**
 * Create a basic OpenAPI specification when the main conversion fails
 * @param {string} postmanFile - Path to Postman collection file
 * @param {string} outputFile - Path to output OpenAPI YAML file
 * @param {Object} postmanOptions - Options for the OpenAPI spec
 * @returns {Promise<void>}
 */
async function createBasicOpenApiSpec(postmanFile, outputFile, postmanOptions) {
  try {
    const postman = readJsonFile(postmanFile);
    const YAML = require('yamljs');
    
    const collectionVars = {};
    if (postman.variable && Array.isArray(postman.variable)) {
      postman.variable.forEach(v => {
        if (v.key != null) collectionVars[v.key.toLowerCase()] = v.value;
      });
    }
    const serverBaseUrl = collectionVars.baseurl || collectionVars.base_url || 'http://localhost:3000';

    const openapi = {
      openapi: '3.0.0',
      info: {
        title: postman.info?.name || 'API Documentation',
        description: postman.info?.description || 'API documentation generated from Postman collection',
        version: '1.0.0'
      },
      servers: [
        {
          url: serverBaseUrl.replace(/\/$/, ''),
          description: 'API server'
        }
      ],
      paths: {}
    };

    function pathFromStringUrl(str) {
      let path = str.replace(/^\{\{baseurl\}\}\/?/gi, '').replace(/^\{\{base_url\}\}\/?/gi, '');
      path = path.replace(/\{\{([^}]+)\}\}/g, '{$1}');
      return path.startsWith('/') ? path : `/${path}`;
    }

    // Process each item to extract paths
    function processItems(items, parentPath = '') {
      items.forEach(item => {
        if (item.item) {
          // This is a folder, recursively process its items
          const folderPath = parentPath ? `${parentPath}/${item.name}` : item.name;
          processItems(item.item, folderPath);
        } else if (item.request && item.request.url) {
          // This is a request
          const url = item.request.url;
          let apiPath;
          let method = item.request.method ? item.request.method.toLowerCase() : 'get';
          
          // Handle different URL formats
          if (typeof url === 'string') {
            try {
              const urlObj = new URL(url);
              apiPath = urlObj.pathname;
            } catch (urlError) {
              if (url.startsWith('http')) {
                try {
                  apiPath = new URL(url).pathname;
                } catch (_) {
                  apiPath = pathFromStringUrl(url);
                }
              } else {
                apiPath = pathFromStringUrl(url);
              }
            }
          } else if (url.path) {
            const pathSegments = Array.isArray(url.path) ? url.path : [url.path];
            apiPath = `/${pathSegments.join('/')}`;
          } else if (url.raw) {
            let rawUrl = url.raw;
            // Replace Postman variables
            rawUrl = rawUrl.replace(/\{\{url\}\}/g, 'http://localhost:3000');
            rawUrl = rawUrl.replace(/\{\{.*?\}\}/g, 'placeholder');
            
            try {
              const urlObj = new URL(rawUrl);
              apiPath = urlObj.pathname;
            } catch (urlError) {
              if (rawUrl.includes('/')) {
                const pathMatch = rawUrl.match(/(\/[^?]*)/);
                apiPath = pathMatch ? pathMatch[1] : rawUrl;
              } else {
                apiPath = rawUrl;
              }
            }
          }
          
          // Ensure apiPath starts with /
          if (apiPath && !apiPath.startsWith('/')) {
            apiPath = `/${apiPath}`;
          }
          
                     if (apiPath) {
             // Initialize path if it doesn't exist
             if (!openapi.paths[apiPath]) {
               openapi.paths[apiPath] = {};
             }
             
             // Build the method specification
             const methodSpec = {
               tags: [postmanOptions.defaultTag || 'General'],
               summary: item.name,
               responses: {
                 '200': {
                   description: 'Success response',
                   content: {
                     'application/json': {
                       schema: {
                         type: 'object'
                       }
                     }
                   }
                 }
               }
             };
             
                           // Add query parameters
              if (url.query && Array.isArray(url.query)) {
                methodSpec.parameters = methodSpec.parameters || [];
                url.query.forEach(queryParam => {
                  if (queryParam.key && !queryParam.disabled) {
                    methodSpec.parameters.push({
                      name: queryParam.key,
                      in: 'query',
                      required: false,
                      schema: {
                        type: 'string'
                      },
                      example: queryParam.value || ''
                    });
                  }
                });
              }
              
              // Add path parameters (extract from path segments)
              const pathParams = apiPath.match(/\{([^}]+)\}/g);
              if (pathParams) {
                methodSpec.parameters = methodSpec.parameters || [];
                pathParams.forEach(param => {
                  const paramName = param.replace(/[{}]/g, '');
                  methodSpec.parameters.push({
                    name: paramName,
                    in: 'path',
                    required: true,
                    schema: {
                      type: 'string'
                    }
                  });
                });
              }
              
              // Also check for numeric path segments that might be IDs
              const pathSegments = apiPath.split('/');
              pathSegments.forEach((segment, index) => {
                if (segment && !isNaN(segment) && segment !== '') {
                  const paramName = `id${index > 0 ? index : ''}`;
                  if (!methodSpec.parameters || !methodSpec.parameters.some(p => p.name === paramName)) {
                    methodSpec.parameters = methodSpec.parameters || [];
                    methodSpec.parameters.push({
                      name: paramName,
                      in: 'path',
                      required: true,
                      schema: {
                        type: 'string'
                      },
                      description: `Path parameter at position ${index}`
                    });
                  }
                }
              });
              
              // Add request body for POST/PUT/PATCH methods
              if (['post', 'put', 'patch'].includes(method) && item.request.body) {
                if (item.request.body.mode === 'raw' && item.request.body.raw) {
                  try {
                    const bodyContent = JSON.parse(item.request.body.raw);
                    methodSpec.requestBody = {
                      required: true,
                      content: {
                        'application/json': {
                          schema: {
                            type: 'object',
                            properties: Object.keys(bodyContent).reduce((props, key) => {
                              props[key] = {
                                type: typeof bodyContent[key] === 'number' ? 'number' : 'string',
                                example: bodyContent[key]
                              };
                              return props;
                            }, {})
                          },
                          example: bodyContent
                        }
                      }
                    };
                  } catch (parseError) {
                    // If JSON parsing fails, create a generic schema
                    methodSpec.requestBody = {
                      required: true,
                      content: {
                        'application/json': {
                          schema: {
                            type: 'object'
                          },
                          example: item.request.body.raw
                        }
                      }
                    };
                  }
                } else if (item.request.body.mode === 'formdata' && item.request.body.formdata) {
                  methodSpec.requestBody = {
                    required: true,
                    content: {
                      'multipart/form-data': {
                        schema: {
                          type: 'object',
                          properties: item.request.body.formdata.reduce((props, field) => {
                            if (field.key && !field.disabled) {
                                                           props[field.key] = {
                               type: field.type === 'text' ? 'string' : 'string',
                               example: field.value || ''
                             };
                            }
                            return props;
                          }, {})
                        }
                      }
                    }
                  };
                }
              }
              
              // Add headers
              if (item.request.header && Array.isArray(item.request.header)) {
                methodSpec.parameters = methodSpec.parameters || [];
                item.request.header.forEach(header => {
                  if (header.key && header.value) {
                    methodSpec.parameters.push({
                      name: header.key,
                      in: 'header',
                      required: false,
                      schema: {
                        type: 'string'
                      },
                      example: header.value
                    });
                  }
                });
              }
              
              // Add authentication headers if present
              if (item.request.auth) {
                methodSpec.parameters = methodSpec.parameters || [];
                if (item.request.auth.type === 'bearer') {
                  methodSpec.parameters.push({
                    name: 'Authorization',
                    in: 'header',
                    required: true,
                    schema: {
                      type: 'string'
                    },
                    description: 'Bearer token for authentication',
                    example: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
                  });
                } else if (item.request.auth.type === 'apikey') {
                  methodSpec.parameters.push({
                    name: item.request.auth.apikey?.key || 'X-API-Key',
                    in: 'header',
                    required: true,
                    schema: {
                      type: 'string'
                    },
                    description: 'API key for authentication'
                  });
                }
              }
             
             // Add the method to the path
             openapi.paths[apiPath][method] = methodSpec;
           }
        }
      });
    }
    
    // Start processing from the root items
    if (postman.item && Array.isArray(postman.item)) {
      processItems(postman.item);
    }
    
    // Write the basic OpenAPI spec to YAML file
    const yamlString = YAML.stringify(openapi, 2);
    fs.writeFileSync(outputFile, yamlString);
    
    console.log(`Created basic OpenAPI spec with ${Object.keys(openapi.paths).length} paths`);
    
  } catch (error) {
    console.error('Error creating basic OpenAPI spec:', error.message);
    throw error;
  }
}

module.exports = {
  generateSwagger,
  injectExampleResponses,
  createBasicOpenApiSpec
};
