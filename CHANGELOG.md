# [1.2.0](https://github.com/FutureHax/futurehax-shared-tooling/compare/v1.1.3...v1.2.0) (2026-08-20)


### Features

* upload Foundry Hub zip to GCS on release ([f6d1602](https://github.com/FutureHax/futurehax-shared-tooling/commit/f6d1602d51250591b92644856560861105fc0c96))

## [1.1.3](https://github.com/FutureHax/futurehax-shared-tooling/compare/v1.1.2...v1.1.3) (2026-08-18)


### Bug Fixes

* **release:** still emit Hub zip when skip-foundry-api is true ([12fc169](https://github.com/FutureHax/futurehax-shared-tooling/commit/12fc16913594f8e2a12d55c31493af12c75f8bea))

## [1.1.2](https://github.com/FutureHax/futurehax-shared-tooling/compare/v1.1.1...v1.1.2) (2026-08-15)


### Bug Fixes

* **eslint:** match TypeScript files in createFoundryConfig ([520fbe6](https://github.com/FutureHax/futurehax-shared-tooling/commit/520fbe65b4d544c44b78bc696aac8baacdb36cd3))

## [1.1.1](https://github.com/FutureHax/futurehax-shared-tooling/compare/v1.1.0...v1.1.1) (2026-08-15)


### Bug Fixes

* **inject-patrons:** skip injection when Patreon token is unauthorized ([3908480](https://github.com/FutureHax/futurehax-shared-tooling/commit/3908480179d240c63652f8a5fe801de372a29bb9))

# [1.1.0](https://github.com/FutureHax/futurehax-shared-tooling/compare/v1.0.0...v1.1.0) (2026-08-14)


### Features

* **release:** emit Foundry-protected Hub zip alongside catalog zip ([a9276ea](https://github.com/FutureHax/futurehax-shared-tooling/commit/a9276ea97bf4d75ed289d211bf7b0cf11ac11a0b))

# 1.0.0 (2026-08-06)


### Bug Fixes

* **ci:** install semantic-release plugins in release workflow ([5e190e4](https://github.com/FutureHax/futurehax-shared-tooling/commit/5e190e4613eaef25858f6d7483683d6748448f2d))
* **foundry-hub:** use CDN CHANGELOG.md as notes URL when CDN is configured ([60ae66a](https://github.com/FutureHax/futurehax-shared-tooling/commit/60ae66ae135c7c6c61169745583bfabd4fd9fffe))
* **husky:** bootstrap node PATH for GUI-launched Git hooks ([0dd52a8](https://github.com/FutureHax/futurehax-shared-tooling/commit/0dd52a883b75d5dec2bb02cea56f66978f208f37))
* **husky:** ensure correct node PATH for GUI Git clients by sourcing ensure-node-path.sh in hooks ([237282a](https://github.com/FutureHax/futurehax-shared-tooling/commit/237282a0fdd6a5674173a88918c00ac0055cb2b7))
* **inject-patrons:** exit 0 with warning when credentials are not set ([6677179](https://github.com/FutureHax/futurehax-shared-tooling/commit/667717914c0e4affa83440d01ec118a4d99e0b40))
* **release:** accept Patreon /c/r2plays vanity URLs in inject-patrons ([7c3a279](https://github.com/FutureHax/futurehax-shared-tooling/commit/7c3a279966c71bba64c8b7eb362542e8c2fbb848))
* **release:** bump package.json version via @semantic-release/npm in next-app config ([3d76a20](https://github.com/FutureHax/futurehax-shared-tooling/commit/3d76a206e65bfd9c883fb00e6cd89b93036902aa))
* **release:** compile compendium packs before zipping module artifacts ([61f04a2](https://github.com/FutureHax/futurehax-shared-tooling/commit/61f04a296a96a9dfa44cf97054c01ba1530909a6))
* **release:** don't skip GCS upload when PACKAGE_RELEASE_TOKEN is unset ([0819f81](https://github.com/FutureHax/futurehax-shared-tooling/commit/0819f81360b163b94aea7fddc5df172b0f153c26))
* **release:** remap shared-tooling plugin paths for local release ([dfc4c03](https://github.com/FutureHax/futurehax-shared-tooling/commit/dfc4c036f94a74c50127069bf90b9453524df82c))
* **release:** upload GitHub assets via gh CLI instead of Octokit ([709efc9](https://github.com/FutureHax/futurehax-shared-tooling/commit/709efc9d0054182ca640969546eba3e5ec8f6a50))
* remove type:module to allow CJS require of lint-staged/releaserc configs ([ef25d4c](https://github.com/FutureHax/futurehax-shared-tooling/commit/ef25d4c640fe1ffd8f105e4d580501f0d0e95cb6))
* **scripts:** correct repo names and MODULE_ID placeholder fallback in batch tools ([63a18db](https://github.com/FutureHax/futurehax-shared-tooling/commit/63a18db379e470895eb455606f83487d86eb21ce))
* **scripts:** detect submodule gitfile as well as git dir ([f9d3025](https://github.com/FutureHax/futurehax-shared-tooling/commit/f9d3025e8bf0af58fd17083ba36b24ca59181c6b))
* **scripts:** improve submodule handling for branch-specific operations ([6dcc139](https://github.com/FutureHax/futurehax-shared-tooling/commit/6dcc139bc7394eb4cca4531816b8d628c3195ebb))
* **scripts:** resilient batch rollout with rebase and scoped staging ([a189c49](https://github.com/FutureHax/futurehax-shared-tooling/commit/a189c4937f4c228115421a952fa02ef5e9859e7d))
* **scripts:** skip husky during batch rollout commits ([7ad20da](https://github.com/FutureHax/futurehax-shared-tooling/commit/7ad20dafb84aaa71c55dcd13d3b97ed61b7deda4))
* **scripts:** use current branch for pull/push during submodule bumps ([6912f17](https://github.com/FutureHax/futurehax-shared-tooling/commit/6912f176af670c49f1b4f0834e3ff6905f13709d))
* **scripts:** use direct build-module path in batch rollout ([b62d4f1](https://github.com/FutureHax/futurehax-shared-tooling/commit/b62d4f153171f2546d799b5b9130d71cd78ed84a))


### Features

* **foundry:** add pre-push pack-freshness hook and pack:check task ([b5e0612](https://github.com/FutureHax/futurehax-shared-tooling/commit/b5e0612ba6e911d3bb203d91217e9079ccc8f182))
* **hooks:** run npm run build in pre-commit when source files are staged ([c2b8778](https://github.com/FutureHax/futurehax-shared-tooling/commit/c2b8778a559f73f5fcfd0f14cee45bebb586bc97))
* **init:** shared tooling repo with all configs and scripts ([d596ad8](https://github.com/FutureHax/futurehax-shared-tooling/commit/d596ad85fd7dd0a6ee3dffbf0ed006167d5f080e))
* **next-app:** add Next.js web app baseline preset ([cbf1f51](https://github.com/FutureHax/futurehax-shared-tooling/commit/cbf1f5143db66b4748fc76d57c3af5767153081f))
* **release:** add batch script to trigger pack-at-release CDN rebuilds ([3951b48](https://github.com/FutureHax/futurehax-shared-tooling/commit/3951b4897487ae16dff03d6e94ed75684adf261b))
* **release:** add Patreon patron list injector script ([187ee0b](https://github.com/FutureHax/futurehax-shared-tooling/commit/187ee0b69e2bcc14613edaec9c10ae8490b988f2))
* **release:** add public changelog CDN upload and AI summary plugins ([87db736](https://github.com/FutureHax/futurehax-shared-tooling/commit/87db736e6413da98e539dd9b8360a836f2c1d04f))
* **release:** support CMS proxy URLs and Foundry API skip ([cd94d52](https://github.com/FutureHax/futurehax-shared-tooling/commit/cd94d522e26d6e103dc82da7bd823d2954b51164))
* **release:** upload gated artifacts to private bucket + fix CI and propagate ([79c4e22](https://github.com/FutureHax/futurehax-shared-tooling/commit/79c4e22d37da6fe83f032de541ed1d5559a3eb1a))
