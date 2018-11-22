#!/usr/bin/env bash

set -e

npm run check:header
npm run check:typescript
npm run check:types
npm run check:lint

