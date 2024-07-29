import type { ProblemJson } from '../types';

export const UNPROCESSABLE_ENTITY: Omit<ProblemJson, 'detail'> = {
  type: 'UNPROCESSABLE_ENTITY',
  title: 'Invalid request. Please contact Blackbird support for more details.',
  status: 422,
};

export const NOT_ACCEPTABLE: Omit<ProblemJson, 'detail'> = {
  type: 'NOT_ACCEPTABLE',
  title: 'The server cannot produce a representation for your accept header. Please contact Blackbird support for more details.',
  status: 406,
};

export const NOT_FOUND: Omit<ProblemJson, 'detail'> = {
  type: 'NOT_FOUND',
  title: 'The server cannot find the requested content. Visit the Blackbird documentation for more details here: https://www.getambassador.io/docs/blackbird/latest/reference/spectra-errors',
  status: 404,
};

export const NO_RESPONSE_DEFINED: Omit<ProblemJson, 'detail'> = {
  type: 'NO_RESPONSE_RESPONSE_DEFINED',
  title: 'No response defined for the selected operation. Visit the Blackbird documentation for more details here: https://www.getambassador.io/docs/blackbird/latest/reference/spectra-errors',
  status: 500,
};

export const UNAUTHORIZED: Omit<ProblemJson, 'detail'> = {
  type: 'UNAUTHORIZED',
  title: 'Invalid security scheme used. Visit the Blackbird documentation for more details here: https://www.getambassador.io/docs/blackbird/latest/reference/spectra-errors',
  status: 401,
};

export const VIOLATIONS: Omit<ProblemJson, 'detail'> = {
  type: 'VIOLATIONS',
  title: 'Request/Response not valid. Please contact Blackbird support for more details.',
  status: 500,
};

export const INVALID_CONTENT_TYPE: Omit<ProblemJson, 'detail'> = {
  type: 'INVALID_CONTENT_TYPE',
  title: 'Invalid content type. Visit the Blackbird documentation for more details here: https://www.getambassador.io/docs/blackbird/latest/reference/spectra-errors',
  status: 415,
};

export const SCHEMA_TOO_COMPLEX: Omit<ProblemJson, 'detail'> = {
  type: 'SCHEMA_TOO_COMPLEX',
  title: 'Schema too complex. Visit the Blackbird documentation for more details here: https://www.getambassador.io/docs/blackbird/latest/reference/spectra-errors',
  status: 500,
};
