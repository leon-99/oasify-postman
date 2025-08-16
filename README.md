# 🚀 Oasify Postman

Convert Postman collections to OpenAPI specifications with example responses automatically injected.

[![npm version](https://badge.fury.io/js/oasify-postman.svg)](https://badge.fury.io/js/oasify-postman)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## ✨ Features

- 🔄 **Convert Postman collections** to OpenAPI 3.0 specifications
- 📝 **Automatic example injection** from saved Postman responses
- 🎯 **Customizable API metadata** (title, description, version, tags)
- 📁 **YAML output** for easy integration with documentation tools
- 🖥️ **Command-line interface** for quick conversions
- 📚 **Programmatic API** for integration into build processes

## 📦 Installation

### Local Installation (Library) - **Recommended**
```bash
npm install oasify-postman
```

### Global Installation (CLI)
```bash
npm install -g oasify-postman
```

## 🚀 Quick Start

### Programmatic Usage - **Recommended**

```javascript
const { generateSwagger } = require('oasify-postman');

async function convertCollection() {
  try {
    await generateSwagger('collection.json', 'swagger.yaml', {
      defaultTag: 'API',
      info: {
        title: 'My API',
        description: 'My awesome API description',
        version: '1.0.0'
      }
    });
    console.log('Conversion completed!');
  } catch (error) {
    console.error('Conversion failed:', error.message);
  }
}

convertCollection();
```

### Command Line Usage

Convert a Postman collection to OpenAPI:

```bash
oasify-postman collection.json swagger.yaml
```

With custom API information:

```bash
oasify-postman -t "My Awesome API" -d "API for managing users and posts" -v "2.0.0" collection.json api.yaml
```

## 📖 CLI Options

| Option | Short | Description | Default |
|--------|-------|-------------|---------|
| `--help` | `-h` | Show help message | - |
| `--title` | `-t` | API title | "API Documentation" |
| `--description` | `-d` | API description | "API documentation generated from Postman collection" |
| `--version` | `-v` | API version | "1.0.0" |
| `--tag` | `-g` | Default tag for endpoints | "General" |

## 🔧 API Reference

### `generateSwagger(inputFile, outputFile, options)`

Converts a Postman collection to OpenAPI specification.

#### Parameters

- `inputFile` (string): Path to Postman collection JSON file
- `outputFile` (string): Path to output OpenAPI YAML file
- `options` (Object): Conversion options
  - `defaultTag` (string): Default tag for endpoints
  - `info` (Object): API information
    - `title` (string): API title
    - `description` (string): API description
    - `version` (string): API version

#### Returns

Promise that resolves when conversion is complete.

### `injectExampleResponses(postmanFile, openapiFile)`

Injects example responses from Postman collection into OpenAPI specification.

#### Parameters

- `postmanFile` (string): Path to Postman collection file
- `openapiFile` (string): Path to OpenAPI YAML file

#### Returns

Promise that resolves when injection is complete.

## 🔄 How It Works

1. **Parse Postman Collection**: Reads the Postman collection JSON file
2. **Convert to OpenAPI**: Uses `postman-to-openapi` library for initial conversion
3. **Extract Examples**: Scans saved responses for example data
4. **Inject Examples**: Adds example responses to the OpenAPI specification
5. **Generate Output**: Writes the enhanced OpenAPI spec to YAML file

## 📋 Requirements

- Node.js 14.0.0 or higher
- Postman collection with saved responses (for example injection)
- Postman collection must have proper URL format (e.g., `"https://api.example.com/endpoint"`)

## 📝 Example Output

Input Postman collection with saved responses generates an OpenAPI spec like:

**Note**: Your Postman collection should have proper URL format (e.g., `"https://api.example.com/endpoint"`) for the converter to work correctly.

```yaml
openapi: 3.0.0
info:
  title: My API
  description: API documentation generated from Postman collection
  version: 1.0.0
paths:
  /users:
    get:
      tags:
        - General
      responses:
        '200':
          description: Example response for Get Users
          content:
            application/json:
              example:
                users:
                  - id: 1
                    name: "John Doe"
                    email: "john@example.com"
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built on top of [postman-to-openapi](https://github.com/joolfe/postman-to-openapi)
- Uses [yamljs](https://github.com/jeremyfa/yaml-js) for YAML processing



---

Made with ❤️ by Win Khant Aung
