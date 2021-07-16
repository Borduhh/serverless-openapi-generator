import { OpenAPIV3 } from 'openapi-types';
import validator from 'oas-validator';
import { clone } from './utils';

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
  public version: string;
  public schema: OpenAPIV3.Document;

  /**
   * Constructor
   * @param schema The intial OpenAPI schema
   */
  constructor(schema: OpenAPIV3CustomDocumentation) {
    this.version = schema.openapi;

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
    const result = (await validator.validate(this.schema, {
      targetVersion: this.version,
    })) as ValidationResult;

    return result.openapi as OpenAPIV3.Document;
  }
}
