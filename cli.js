#!/usr/bin/env node

const path = require('path');
const fs = require('fs');
const { generateSwagger } = require('./index');

// Parse command line arguments
const args = process.argv.slice(2);

function showHelp() {
  console.log(`
Postman to OpenAPI Converter

Usage: postman-to-openapi [options] <input-file> <output-file>

Options:
  -h, --help          Show this help message
  -t, --title         API title (default: "API Documentation")
  -d, --description   API description (default: "API documentation generated from Postman collection")
  -v, --version       API version (default: "1.0.0")
  -g, --tag           Default tag for endpoints (default: "General")

Examples:
  postman-to-openapi collection.json swagger.yaml
  postman-to-openapi -t "My API" -d "My awesome API" collection.json swagger.yaml
  postman-to-openapi --title "User API" --version "2.0.0" users.json api.yaml

Input file should be a Postman collection JSON file.
Output file will be generated as OpenAPI YAML specification.
  `);
}

function parseArgs(args) {
  const options = {
    title: 'API Documentation',
    description: 'API documentation generated from Postman collection',
    version: '1.0.0',
    tag: 'General'
  };

  let inputFile = null;
  let outputFile = null;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    switch (arg) {
      case '-h':
      case '--help':
        showHelp();
        process.exit(0);
        break;
      case '-t':
      case '--title':
        options.title = args[++i];
        break;
      case '-d':
      case '--description':
        options.description = args[++i];
        break;
      case '-v':
      case '--version':
        options.version = args[++i];
        break;
      case '-g':
      case '--tag':
        options.tag = args[++i];
        break;
      default:
        if (!inputFile) {
          inputFile = arg;
        } else if (!outputFile) {
          outputFile = arg;
        } else {
          console.error(`Unexpected argument: ${arg}`);
          showHelp();
          process.exit(1);
        }
    }
  }

  return { options, inputFile, outputFile };
}

async function main() {
  try {
    const { options, inputFile, outputFile } = parseArgs(args);

    // Validate arguments
    if (!inputFile || !outputFile) {
      console.error('Input and output files are required');
      showHelp();
      process.exit(1);
    }

    // Check if input file exists
    if (!fs.existsSync(inputFile)) {
      console.error(`Input file not found: ${inputFile}`);
      process.exit(1);
    }

    // Create output directory if it doesn't exist
    const outputDir = path.dirname(outputFile);
    if (outputDir && !fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Convert Postman to OpenAPI
    await generateSwagger(inputFile, outputFile, {
      defaultTag: options.tag,
      info: {
        title: options.title,
        description: options.description,
        version: options.version
      }
    });

    console.log('\nConversion completed successfully!');
    
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
}

// Run the CLI if this file is executed directly
if (require.main === module) {
  main();
}
