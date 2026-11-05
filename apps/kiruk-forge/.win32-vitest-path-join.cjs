'use strict';

const Module = require('node:module');
const path = require('node:path');

if (process.env.VITEST) {
  const originalJoin = path.join.bind(path);
  path.join = (...segments) => originalJoin(...segments).replaceAll('\\', '/');
  Module.syncBuiltinESMExports();
}
