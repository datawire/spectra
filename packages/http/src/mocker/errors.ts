import type { ProblemJson } from '../types';

export const UNPROCESSABLE_ENTITY: Omit<ProblemJson, 'detail'> = {
  type: 'https://www.getambassador.io/docs/blackbird/latest/reference/mock-server-errors#unprocessable_entity',
  title: 'Invalid request.',
  status: 422,
};

export const NOT_ACCEPTABLE: Omit<ProblemJson, 'detail'> = {
  type: 'https://www.getambassador.io/docs/blackbird/latest/reference/mock-server-errors#not_acceptable',
  title: 'The server cannot produce a representation for your accept header.',
  status: 406,
};

export const NOT_FOUND: Omit<ProblemJson, 'detail'> = {
  type: 'https://www.getambassador.io/docs/blackbird/latest/reference/mock-server-errors#not_found',
  title: 'The server cannot find the requested content.',
  status: 404,
};

export const NO_RESPONSE_DEFINED: Omit<ProblemJson, 'detail'> = {
  type: 'https://www.getambassador.io/docs/blackbird/latest/reference/mock-server-errors#no_response_defined',
  title: 'No response defined for the selected operation.',
  status: 500,
};

export const UNAUTHORIZED: Omit<ProblemJson, 'detail'> = {
  type: 'https://www.getambassador.io/docs/blackbird/latest/reference/mock-server-errors#unauthorized',
  title: 'Invalid security scheme used.',
  status: 401,
};

export const VIOLATIONS: Omit<ProblemJson, 'detail'> = {
  type: 'VIOLATIONS',
  title: 'Request/Response not valid. Please contact Blackbird support for more details.',
  status: 500,
};

export const INVALID_CONTENT_TYPE: Omit<ProblemJson, 'detail'> = {
  type: 'https://www.getambassador.io/docs/blackbird/latest/reference/mock-server-errors#invalid_content_type',
  title: 'Invalid content type.',
  status: 415,
};

export const SCHEMA_TOO_COMPLEX: Omit<ProblemJson, 'detail'> = {
  type: 'https://www.getambassador.io/docs/blackbird/latest/reference/mock-server-errors#schema_too_complex',
  title: 'Schema too complex.',
  status: 500,
};
