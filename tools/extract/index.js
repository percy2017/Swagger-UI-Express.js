// /tools/extract/index.js

import router from './router.js';
import { extractSpec } from './spec.js';

export default {
  router: router,
  spec: extractSpec,
};