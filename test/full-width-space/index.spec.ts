import * as path from 'node:path';

import { assertFormattedEqualsFixed } from '../test-helpers';

describe(`Unit: ${path.basename(__dirname)}`, () => {
  assertFormattedEqualsFixed(__dirname);
});
