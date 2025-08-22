// tools/scrape/index.js

import router from './router.js';
import { scrapeSpec } from './spec.js';

export default {
  router: router,
  spec: scrapeSpec
};