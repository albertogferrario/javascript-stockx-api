# Release Process

This document describes the release process for the StockX API package.

## Automated Release Pipeline

This project uses a fully automated CI/CD pipeline for releases:

1. **Tag Push** → 2. **Create Release** → 3. **Publish to npm**

## Release Steps

### 1. Update Version

Update the version in `package.json`:
```bash
# For patch release (bug fixes)
npm version patch

# For minor release (new features)
npm version minor

# For major release (breaking changes)
npm version major
```

Or manually edit `package.json` to set the version.

### 2. Update CHANGELOG

Add a new section to `CHANGELOG.md`:
```markdown
## [1.1.1] - 2025-01-09

### Added
- List new features

### Changed
- List changes

### Fixed
- List bug fixes
```

### 3. Commit Changes

```bash
git add package.json CHANGELOG.md
git commit -m "Prepare release v1.1.1"
git push origin master
```

### 4. Create and Push Tag

```bash
git tag v1.1.1
git push origin v1.1.1
```

### 5. Automated Pipeline

Once the tag is pushed, GitHub Actions will automatically:

1. **Validate** that tag version matches `package.json`
2. **Create GitHub Release** with changelog notes
3. **Run tests** to ensure quality
4. **Publish to npm** if all tests pass

## Manual Release (Fallback)

If automation fails, you can release manually:

```bash
# Ensure you're logged in to npm
npm login

# Publish to npm
npm publish
```

## Pre-release Checklist

- [ ] All tests pass (`npm test`)
- [ ] Version updated in `package.json`
- [ ] CHANGELOG.md updated with version section
- [ ] No uncommitted changes (`git status`)
- [ ] On master/main branch (`git branch`)

## Post-release Verification

1. Check GitHub Releases page
2. Verify npm package: `npm view @albertogferrario/stockx-api@latest`
3. Test installation: `npm install @albertogferrario/stockx-api@latest`

## Troubleshooting

### Tag version mismatch
- Ensure `package.json` version matches the tag (without 'v' prefix)
- Example: tag `v1.1.1` should match `"version": "1.1.1"` in package.json

### NPM publish fails
- Check `NPM_TOKEN` is set in GitHub Secrets
- Verify npm account has publish access to the package

### Release creation fails
- Check CHANGELOG.md has a section for the version
- Ensure tag follows format `v*.*.*`