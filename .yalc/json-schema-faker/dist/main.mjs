import './vendor.js';

import { setDependencies } from './shared.js';

/* global $RefParser */
if (typeof $RefParser !== 'undefined') {
  setDependencies({ $RefParser });
}

export { default, JSONSchemaFaker } from './shared.js';
