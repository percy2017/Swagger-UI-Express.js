// /tools/crawl/index.js

import router from './router.js';
import { crawlSpec } from './spec.js';

export default {
  router,
  spec: crawlSpec,
};