import { OpenAPIV3 } from 'openapi-types';

export type HttpMethod = 'get' | 'post' | 'put' | 'patch' | 'options' | 'head' | 'delete' | 'any';

export type HttpFunctionEvent = {
  path: string;
  method: HttpMethod;
  authorizer?: any;
  cors?: any;
  integration?: string | undefined;
  openapi: OpenAPIV3.OperationObject;
};

export as namespace ServerlessOpenapiGenerator;
