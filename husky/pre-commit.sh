#!/bin/bash
[ -n "$CI" ] && exit 0
[ "$HUSKY" = "0" ] && exit 0

cd "$(git rev-parse --show-toplevel)" || exit 1
npx lint-staged
