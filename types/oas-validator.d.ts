type ValidationResult = {
  version: string;
  valid: boolean;
  context: string[];
  warnings: string[];
  lintLimit: number;
  lintSkip: number[];
  openapi: { [key: string]: any };
};

declare module 'oas-validator' {
  export function validate(
    schema: { [key: string]: any },
    options: { targetVersion: string }
  ): Promise<ValidationResult>;
}
