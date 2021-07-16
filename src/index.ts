import Serverless from 'serverless';
import OpenApiGenerator from './openApiGenerator';
import YAML from 'js-yaml';
import { writeFileSync } from 'fs';

type CliOptions = {
  format: string;
  output: string;
};

class SeverlessOpenapi {
  private serverless: Serverless;
  private options: Serverless.Options;

  private hooks: { [key: string]: Function };
  private commands: { [key: string]: any };

  constructor(serverless: Serverless, options: Serverless.Options) {
    this.serverless = serverless;
    this.options = options;

    this.commands = {
      openapi: {
        usage: 'Generate OpenAPI Documentation',
        lifecycleEvents: ['serverless'],
        options: {
          output: {
            usage: 'Output file location [default: openapi.yml|json]',
            shortcut: 'o',
            type: 'string',
          },
          format: {
            usage: 'OpenAPI file format (yml|json) [default: yml]',
            shortcut: 'f',
            type: 'string',
          },
        },
      },
    };

    this.hooks = {
      'openapi:serverless': this.generate.bind(this),
    };
  }

  /**
   * Logs a message to the Serverless console
   * @param message The message to log
   * @param options Serverless options
   * @returns
   */
  private log(message: string, options?: Serverless.LogOptions): void {
    this.serverless.cli.log(message, '', options);
  }

  /**
   * Imports configuration options from the CLI
   * @returns A configuration object
   */
  private handleCliInput(): CliOptions {
    const formats = ['yaml', 'json'];

    const config: CliOptions = {
      format: 'yaml',
      output: 'openapi.spec.yml',
    };

    config.format = (this.serverless.pluginManager.cliOptions as CliOptions).format || 'yaml';

    if (!formats.includes(config.format.toLowerCase()))
      throw new Error(`Invalid format option specified. Please choose either "yaml" or "json"`);

    config.output =
      (this.serverless.pluginManager.cliOptions as CliOptions).output || config.format === 'yaml'
        ? 'openapi.spec.yml'
        : 'openapi.spec.json';

    return config;
  }

  /**
   * Generates an OpenAPI specification file
   */
  private async generate() {
    this.log('Generating OpenAPI specification file');

    const documentation = this.serverless.service.custom.openapi;

    // Initialize the generator with required OpenAPI fields
    if (!documentation.openapi)
      throw new Error(`You must have an "openapi" field with the target OpenAPI version.`);

    if (!documentation.info || !documentation.info.title || !documentation.info.version)
      throw new Error(`You must have an "info" field with "title" and "version" properties`);

    const generator = new OpenApiGenerator(documentation);

    if (documentation.components) generator.parseComponents(documentation.components);

    const functions = this.serverless.service.functions as {
      [key: string]: Serverless.FunctionDefinitionHandler;
    };

    generator.parseFunctions(functions);

    // Validate specification against OAS
    try {
      const definition = await generator.validate();
      const cliOptions = this.handleCliInput();

      // Write specification to file
      const output =
        cliOptions.format === 'yaml' ? YAML.dump(definition) : JSON.stringify(definition);

      writeFileSync(cliOptions.output, output);

      this.log(`OpenAPI Generation Successful. Written to file ${cliOptions.output}`, {
        color: 'green',
        bold: true,
      });
    } catch (err) {
      this.log(`Validation Error: \n ${err.message}`, { bold: true, color: 'red' });
    }
  }
}

module.exports = SeverlessOpenapi;
