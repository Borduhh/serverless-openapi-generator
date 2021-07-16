import { OpenAPIV3 } from 'openapi-types';
import validator from 'oas-validator';
import { clone } from './utils';
import Serverless from 'serverless';

type OpenAPIV3CustomDocumentation = {
  openapi: string;
  info: OpenAPIV3.InfoObject;
  servers?: OpenAPIV3.ServerObject[];
  components?: OpenAPIV3.ComponentsObject;
  security?: OpenAPIV3.SecurityRequirementObject[];
  tags?: OpenAPIV3.TagObject[];
  externalDocs?: OpenAPIV3.ExternalDocumentationObject;
};

export default class OpenApiGenerator {
  public openApiVersion: string;
  public schema: OpenAPIV3.Document;

  /**
   * Constructor
   * @param schema The intial OpenAPI schema
   */
  constructor(schema: OpenAPIV3CustomDocumentation) {
    this.openApiVersion = schema.openapi;

    const { openapi, info, servers = [], components, security = [], tags, externalDocs } = schema;

    this.schema = {
      openapi,
      info,
      paths: {},
    };

    if (servers) this.schema.servers = servers;
    if (components) this.schema.components = components;
    if (security) this.schema.security = security;
    if (tags) this.schema.tags = tags;
    if (externalDocs) this.schema.externalDocs = externalDocs;
  }

  /**
   * Parses through all children of the Components filed
   * @param components An OpenAPI Components Object
   */
  public parseComponents(components: OpenAPIV3.ComponentsObject): void {
    // Parse Schema Objects
    if (components.schemas) {
      const schemaComponents: { [key: string]: OpenAPIV3.SchemaObject } = {};
      const schemas = components.schemas;

      Object.keys(schemas).map((key) => {
        schemaComponents[key] = this.cleanSchema(schemas[key]);
      });

      this.schema.components = { ...this.schema.components, schemas: { ...schemaComponents } };
    }
  }

  /**
   * Parses through all children of the Functions field
   * @param functions An OpenAPI Components Object
   */
  public parseFunctions(functions: { [key: string]: Serverless.FunctionDefinitionHandler }): void {
    const paths: OpenAPIV3.PathsObject = {};

    Object.keys(functions).map((key) => {
      const httpEvents = functions[key].events
        .filter((event) => !!(event as any).http)
        .map((event) => (event as any).http as ServerlessOpenapi.HttpFunctionEvent);

      httpEvents.map((event) => {
        const {
          summary,
          description,
          tags,
          externalDocs,
          operationId,
          parameters,
          requestBody,
          responses,
          callbacks,
          deprecated,
          security,
          servers,
        } = event.openapi;

        const pathOperation: OpenAPIV3.OperationObject = {};

        if (summary) pathOperation.summary = summary;
        if (description) pathOperation.description = description;
        if (tags) pathOperation.tags = tags;
        if (externalDocs) pathOperation.externalDocs = externalDocs;
        if (operationId) pathOperation.operationId = operationId;
        if (parameters) pathOperation.parameters = parameters;
        if (requestBody) pathOperation.requestBody = requestBody;
        if (callbacks) pathOperation.callbacks = callbacks;
        if (deprecated) pathOperation.deprecated = deprecated;
        if (security) pathOperation.security = security;
        if (servers) pathOperation.servers = servers;

        // TODO: Parse Request Body

        // Parse path responses in order to clean schemas
        if (responses) {
          const pathResponses: OpenAPIV3.ResponsesObject = {};

          Object.keys(responses).map((statusCode) => {
            const content: { [key: string]: OpenAPIV3.MediaTypeObject } = {};

            const responseContent = (responses[statusCode] as OpenAPIV3.ResponseObject).content;

            if (responseContent)
              Object.keys(responseContent).map((contentType) => {
                content[contentType] = {
                  schema: {
                    $ref: `#/components/schemas/${responseContent[contentType]}`,
                  },
                };
              });

            pathResponses[statusCode] = {
              ...responses[statusCode],
              content,
            };
          });

          pathOperation.responses = pathResponses;
        }

        paths[event.path] = {
          ...paths[event.path],
          [event.method]: pathOperation,
        };
      });
    });

    this.schema.paths = paths;
  }

  /**
   * Cleans schema objects to make them OpenAPI compatible
   * @param schema JSON schema object
   * @returns Cleaned JSON schema object
   */
  private cleanSchema(schema: { [key: string]: any }) {
    const cleanedSchema = clone(schema);

    if (cleanedSchema.$schema) delete cleanedSchema.$schema;

    return cleanedSchema;
  }

  /**
   * Validates OpenAPI v3 Specification
   * @returns A valid OpenAPI specification object
   */
  public async validate(): Promise<OpenAPIV3.Document> {
    const result = await validator.validate(this.schema, {
      targetVersion: this.openApiVersion,
    });

    return result.openapi as OpenAPIV3.Document;
  }
}
