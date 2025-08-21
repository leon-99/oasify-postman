# Oasify Postman

<div align="center">
  <img src="cover.png" alt="Oasify Postman Cover" width="600" />
  
  [![npm version](https://badge.fury.io/js/oasify-postman.svg)](https://badge.fury.io/js/oasify-postman)
  [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
  [![Node.js](https://img.shields.io/badge/Node.js-14.0.0+-green.svg)](https://nodejs.org/)
  [![OpenAPI](https://img.shields.io/badge/OpenAPI-3.0-blue.svg)](https://swagger.io/specification/)
</div>

**Convert Postman collections to OpenAPI specifications with example responses automatically injected.**

## ✨ Features

- 🔄 **Convert Postman collections** to OpenAPI 3.0 specifications
- 📝 **Automatic example injection** from saved Postman responses
- 🎯 **Customizable API metadata** (title, description, version, tags)
- 📁 **YAML output** for easy integration with documentation tools
- 🖥️ **Command-line interface** for quick conversions
- 📚 **Programmatic API** for integration into build processes

## 📋 Table of Contents

- [Installation](#-installation)
- [Quick Start](#-quick-start)
- [CLI Options](#-cli-options)
- [API Reference](#-api-reference)
- [Requirements](#-requirements)
- [Example Output](#-example-output)
- [Contributing](#-contributing)
- [License](#-license)

## 📦 Installation

### Local Installation (Library) - **Recommended**
```bash
npm install oasify-postman
```

### Global Installation (CLI)
```bash
npm install -g oasify-postman
```

## 🎯 Demo

<div align="center">
  <strong>Transform your Postman collections into professional OpenAPI documentation in seconds!</strong>
</div>

**Before (Postman Collection):** Raw JSON with saved responses
**After (OpenAPI Spec):** Beautiful, interactive API documentation with examples

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
    console.log('✅ Conversion completed successfully!');
  } catch (error) {
    console.error('❌ Conversion failed:', error.message);
  }
}

convertCollection();
```

### Command Line Usage

**Basic conversion:**
```bash
oasify-postman collection.json swagger.yaml
```

**With custom API information:**
```bash
oasify-postman -t "My Awesome API" -d "API for managing users and posts" -v "2.0.0" collection.json api.yaml
```

**Quick test with example collection:**
```bash
# Download example collection
curl -o example.json https://raw.githubusercontent.com/your-repo/example-collection.json

# Convert to OpenAPI
oasify-postman example.json api-docs.yaml
```

## 📖 CLI Options

| Option | Short | Description | Default |
|--------|-------|-------------|---------|
| `--help` | `-h` | Show help message | - |
| `--title` | `-t` | API title | "API Documentation" |
| `--description` | `-d` | API description | "API documentation generated from Postman collection" |
| `--version` | `-v` | API version | "1.0.0" |
| `--tag` | `-g` | Default tag for endpoints | "General" |

### Usage Examples

```bash
# Basic conversion
oasify-postman my-api.json api.yaml

# Custom API information
oasify-postman -t "User Management API" -d "Complete user management system" -v "1.2.0" users.json users-api.yaml

# With custom default tag
oasify-postman -g "Users" -t "User API" users.json users.yaml
```

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

#### Example

```javascript
const options = {
  defaultTag: 'Users',
  info: {
    title: 'User Management API',
    description: 'Complete user management system',
    version: '2.0.0'
  }
};

await generateSwagger('users.json', 'users-api.yaml', options);
```

### `injectExampleResponses(postmanFile, openapiFile)`

Injects example responses from Postman collection into OpenAPI specification.

#### Parameters

- `postmanFile` (string): Path to Postman collection file
- `openapiFile` (string): Path to OpenAPI YAML file

#### Returns

Promise that resolves when injection is complete.

#### Example

```javascript
await injectExampleResponses('collection.json', 'api.yaml');
```



## 📋 Requirements

- **Node.js** 14.0.0 or higher
- **Postman collection** with saved responses (for example injection)
- **Proper URL format** in collection (e.g., `"https://api.example.com/endpoint"`)

## ⚠️ Troubleshooting

### Common Issues

**❌ "Invalid URL format" error**
- Ensure your Postman collection has proper URL format
- URLs should be complete (e.g., `https://api.example.com/users` not just `/users`)

**❌ "No examples found" warning**
- Make sure your Postman collection has saved responses
- Export collection with "Save responses" option enabled

**❌ "Permission denied" error**
- Check file permissions for input/output files
- Ensure you have write access to the output directory

### Getting Help

- 📖 Check the [example collection](example-collection.json) for reference
- 🐛 Report issues on GitHub
- 💬 Ask questions in discussions

## 📝 Example Output

### Before vs After

| Aspect | Postman Collection | OpenAPI Specification |
|--------|-------------------|----------------------|
| **Format** | JSON | YAML |
| **Examples** | Saved responses | Injected examples |
| **Documentation** | Basic | Interactive |
| **Integration** | Manual | Auto-generated |
| **Standards** | Proprietary | OpenAPI 3.0 |

### Sample Output

Input Postman collection with saved responses generates an OpenAPI spec like:

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

**💡 Pro Tip:** Your Postman collection should have proper URL format (e.g., `"https://api.example.com/endpoint"`) for the converter to work correctly.

## 🤝 Contributing

We welcome contributions! Here's how you can help:

### 🚀 Quick Start

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### 🎯 Areas to Contribute

- 🐛 Bug fixes
- ✨ New features
- 📚 Documentation improvements
- 🧪 Test coverage
- 🔧 Performance optimizations



## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built on top of [postman-to-openapi](https://github.com/joolfe/postman-to-openapi)
- Uses [yamljs](https://github.com/jeremyfa/yaml-js) for YAML processing
- Inspired by the need for better Postman-to-OpenAPI conversion tools

---

<div align="center">
  <strong>Made with ❤️ by Win Khant Aung</strong>
</div>
