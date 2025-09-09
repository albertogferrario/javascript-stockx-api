# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.1] - 2025-01-09

### Added
- Comprehensive test suite with 57 tests for all modules
- TypeScript declaration files (.d.ts) for better IDE support
- GitHub Actions workflows for CI/CD (test matrix, lint, publish)
- CHANGELOG.md for version history tracking
- Improved npm scripts (test:watch, test:coverage, lint:fix, format)
- Package metadata enhancements (keywords, engines, files array)
- .npmignore to control published files

### Fixed
- Missing const declaration in limiter.js

### Changed
- Enhanced package.json with better organization and metadata

## [1.1.0] - 2025-01-09

### Added
- OAuth2 helper utilities for authentication flows
  - `auth.js` - URL builders, PKCE support, auth code parsing
  - `token.js` - JWT parsing, expiry checking, token response parsing
  - `refresh.js` - Axios interceptor for automatic token refresh
  - `storage.js` - Token storage interface with memory and file implementations
- TypeScript declaration files for better IDE support
- Comprehensive test suite with 57 tests
- `.npmignore` file to exclude development files from npm package
- GitHub Actions workflows for CI/CD
- Enhanced npm scripts (test:watch, test:coverage, lint:fix, format, prepublishOnly)
- Package metadata (keywords, engines, files array)

### Changed
- Updated package description to include OAuth2 helpers and rate limiting
- Improved README with complete documentation and examples
- Updated CLAUDE.md with architecture details

### Fixed
- Missing `const` declaration in limiter.js

### Security
- Added `.npmignore` to prevent publishing sensitive files
- Token storage supports encryption for file-based storage

## [1.0.9] - Previous Release

### Added
- JWT update logic
- Configuration customization handling

## [1.0.8] - Previous Release

### Added
- Limiter reservoir refresh logic (cron)

[1.1.1]: https://github.com/albertogferrario/javascript-stockx-api/compare/v1.1.0...v1.1.1
[1.1.0]: https://github.com/albertogferrario/javascript-stockx-api/compare/v1.0.9...v1.1.0
[1.0.9]: https://github.com/albertogferrario/javascript-stockx-api/compare/v1.0.8...v1.0.9
[1.0.8]: https://github.com/albertogferrario/javascript-stockx-api/releases/tag/v1.0.8