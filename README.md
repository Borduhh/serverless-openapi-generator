# Serverless OpenAPI Generator
A simple OpenAPI 3 definition generator for Serverless projects that follows the OpenAPI specification structure.

**Disclaimer: This tool was built minimally to support a specific project. Most OpenAPI fields are supported, however there may be some that are not. If you find a field that is not, feel free read the `CONTRIBUTING.md` guidelines and add a pull request. Otherwise, please create an issue with a link to the OpenAPI specification section.**

## Usage

### Install
```bash
npm install serverless-openapi --save-dev
```

### Configuration
Add this plugin to the `plugins` section of your `serverless.yml` file.
```yaml
plugins:
  - serverless-openapi
```

### Generating a defintion file
```bash
serverless openapi
```

### Command Line Options

| Name        | Command  | Shortcut | Type        | Required? | Description                                | Default     |
|-------------|:----------:|:----------:|:-------------:|:-----------:|--------------------------------------------|:-------------:|
| Output File Location | `--output` | `-o`       | `string`      | Optional  | The output file location                   | `openapi.yml` |
| OpenAPI Definition Format      | `--format` | `-f`       | `json` \| `yaml` | Optional  | The format of the OpenAPI definition file. | `yaml`        |


## Sample Definitions
This plugin parses your `serverless.yml` file and extracts an OpenAPI configuration from `custom.openapi`, `functions.events.http`, and `functions.events.http.openapi`. It maintains the [OpenAPI specification](https://swagger.io/specification/) structure.

### Openapi Field
```yaml
custom:
  openapi:
    openapi: '3.0.3' # The version of OpenAPI you want to validate against
```

### Info Field
```yaml
custom:
  openapi:
    title: Sample Pet Store App
    description: This is a sample server for a pet store.
    termsOfService: http://example.com/terms/
    contact:
      name: API Support
      url: http://www.example.com/support
      email: support@example.com
    license:
      name: Apache 2.0
      url: https://www.apache.org/licenses/LICENSE-2.0.html
    version: 1.0.1
```

### Servers Field
```yaml
custom:
  openapi:
    servers:
      - url: https://development.gigantic-server.com/v1
        description: Development server
      - url: https://staging.gigantic-server.com/v1
        description: Staging server
      - url: https://api.gigantic-server.com/v1
        description: Production server
```

### Components Field

#### Schemas Field with Serverless File Import
```yaml
custom:
  openapi:
    components:
      schemas:
        ErrorResponse: ${file(schemas/Error.json)}
```
#### Schemas Field with Schema Reference
```yaml
custom:
  openapi:
    components:
      schemas:
        ErrorResponse: 
          $ref: '#/components/schemas/ErrorResponse'
```

#### Security Schemes
```yaml
custom:
  openapi:
    components:
      securitySchemes:
        PetAuth:
          type: oauth2
          flows: 
            implicit:
              authorizationUrl: https://example.com/api/oauth/dialog
              scopes:
                write:pets: modify pets in your account
                read:pets: read your pets
            authorizationCode:
              authorizationUrl: https://example.com/api/oauth/dialog
              tokenUrl: https://example.com/api/oauth/token
              scopes:
                write:pets: modify pets in your account
                read:pets: read your pets 
```

### Security Field
```yaml
custom:
  openapi:
    security:
      - PetAuth:
        - read:pets
        - write:pets
```
### Paths Field (Function Definitions)
```yaml
functions:
  RetrievePets:
    name: RetrievePets-Dev
    events:
      - http:
          method: get
          path: /pets
          openapi:
            summary: Retrieve pets
            description: Retrieves pets
            tags:
              - Pets
            security:
              - PetAuth:
                  - read:pets
            responses:
              '200':
                description: An API Query response with pets
                content:
                  application/json:
                    schema:
                      $ref: '#/components/schemas/RetrievePetsResponse'
              '400':
                description: An invalid request error
                content:
                  application/json:
                    schema:
                      $ref: '#/components/schemas/ErrorResponse'
              '401':
                description: An unauthorized error
                content:
                  application/json:
                    schema:
                      $ref: '#/components/schemas/ErrorResponse'
              '500':
                description: An unknown error
                content:
                  application/json:
                    schema:
                      $ref: '#/components/schemas/ErrorResponse'
```