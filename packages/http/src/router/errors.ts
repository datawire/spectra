import type { ProblemJson } from '../types';

export const NO_BASE_URL_ERROR: Omit<ProblemJson, 'detail'> = {
  title: 'Attempted to make a request to a server but neither baseUrl param provided nor servers defined in the spec.',
  type: 'NO_BASE_URL_ERROR',
  status: 400,
};
export const NO_RESOURCE_PROVIDED_ERROR: Omit<ProblemJson, 'detail'> = {
  title: 'Route not resolved, no resource provided.',
  type: 'NO_RESOURCE_PROVIDED_ERROR',
  status: 404,
};
export const NO_PATH_MATCHED_ERROR: Omit<ProblemJson, 'detail'> = {
  title: 'Route not resolved, no path matched.',
  type: 'https://www.getambassador.io/docs/blackbird/latest/reference/mock-server-errors#no_path_matched_error',
  status: 404,
};
export const NO_SERVER_MATCHED_ERROR: Omit<ProblemJson, 'detail'> = {
  title: 'Route not resolved, no server matched.',
  type: 'NO_SERVER_MATCHED_ERROR',
  status: 404,
};
export const NO_METHOD_MATCHED_ERROR: Omit<ProblemJson, 'detail'> = {
  title: 'Route resolved, but no method matched.',
  type: 'https://www.getambassador.io/docs/blackbird/latest/reference/mock-server-errors#no_method_matched_error',
  status: 405,
};
export const NO_SERVER_CONFIGURATION_PROVIDED_ERROR: Omit<ProblemJson, 'detail'> = {
  title: 'Route not resolved, no server configuration provided.',
  type: 'https://www.getambassador.io/docs/blackbird/latest/reference/mock-server-errors#no_server_configuration_provided_error',
  status: 404,
};
