# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Essential Commands

### Setup and Installation
```bash
# Initial setup (required after cloning)
npm run bootstrap

# Build all packages
npm run build:all

# Clean all node_modules and start fresh
npm run clean
npm run bootstrap
```

### Development Workflows

#### Starting Development Servers
Most packages require `core` to be running first:

```bash
# For core development
npm run serve core

# For other packages (run in separate terminals)
npm run serve trader
npm run serve bot-web-ui
npm run serve cashier
npm run serve appstore
npm run serve cfd
# etc.
```

#### Building
```bash
# Build specific package
npm run build:one <package-name>

# Build all packages
npm run build:all

# Build only changed packages (uses NX)
npm run build:since
```

### Testing

#### Run All Tests
```bash
# Full test suite (stylelint + eslint + jest)
npm run test

# Jest tests only
npm run test:jest

# ESLint only
npm run test:eslint-all

# Stylelint only  
npm run test:stylelint
```

#### Run Tests for Specific Package
```bash
# ESLint for specific package
npm run test:eslint-one <package-name>

# Navigate to package directory and run jest
cd packages/<package-name>
jest
```

#### Run Single Test File
```bash
# From package directory
npx jest path/to/specific-test.spec.js

# Or from root with pattern matching
npm run test:jest -- --testPathPattern="<pattern>"
```

### Code Quality
```bash
# Format code with Prettier
npm run prettify

# Fix stylelint issues
npm run stylelint:fix

# Check for circular dependencies and import issues
npm run check-imports
```

## Architecture Overview

### Monorepo Structure
This is a Lerna-based monorepo using NX for task orchestration and caching. The repository contains multiple interconnected packages representing different parts of the Deriv trading platform.

### Package Architecture

#### Core Packages
- **`@deriv/core`**: Main application shell that orchestrates all other packages. Contains routing, layout, and application-wide configuration.
- **`@deriv/shared`**: Common utilities, constants, and helper functions used across packages.
- **`@deriv/components`**: Reusable UI components library with Storybook integration.
- **`@deriv/api`** & **`@deriv/api-v2`**: API clients for backend communication.
- **`@deriv/stores`**: Centralized state management using MobX (legacy) and React Query (V2).
- **`@deriv/hooks`**: Custom React hooks for data fetching and state management.

#### Feature Packages
- **`@deriv/trader`**: Options and multipliers trading interface
- **`@deriv/bot-web-ui`**: Automated trading bot interface
- **`@deriv/cashier`**: Deposit/withdrawal and payment methods
- **`@deriv/account`**: User account management and settings
- **`@deriv/appstore`**: Trading platform selection and onboarding
- **`@deriv/cfd`**: CFD trading (MT5, Synthetic indices)
- **`@deriv/reports`**: Trading history and analytics
- **`@deriv/wallets`**: Multi-currency wallet management

#### Support Packages
- **`@deriv/translations`**: Internationalization and localization
- **`@deriv/utils`**: Package-specific utilities
- **`@deriv/indicators`**: Trading indicators and charting tools
- **`@deriv/publisher`**: Trading signals and social features

### Technology Migration (V1 → V2)

The codebase is undergoing a significant architectural migration:

#### Legacy (V1) Architecture
- MobX for state management (being phased out)
- Large, monolithic stores
- Tight coupling between components and stores

#### Modern (V2) Architecture  
- React hooks for data handling
- React Query for server state management
- Loose coupling with isolated components
- Domain-driven design principles
- BEM CSS methodology

**Key Migration Principles:**
- No MobX in new code
- No Redux stores
- Use hooks for all data operations
- Implement loose coupling between packages
- Follow SOLID principles and domain-driven design

### Build System
- **Webpack 5** for bundling
- **Babel** for JavaScript/TypeScript transpilation
- **NX** for task running and caching
- **Lerna** for package management
- **Jest** with React Testing Library for testing

### Testing Strategy
- **Unit Tests**: Jest + React Testing Library (default approach)
- **Component Tests**: For isolated component behavior
- **E2E Tests**: Separate repository with actual backend integration
- All new features require test coverage

### CSS Architecture
Uses BEM (Block Element Modifier) methodology:
- Components must be CSS-isolated
- No shared classes between components
- Single level nesting only
- Parent sets size/margins for children

## Development Guidelines

### Package Dependencies
- `core` package imports and orchestrates all feature packages
- `shared` and `components` are foundational dependencies
- Feature packages should minimize cross-dependencies
- Use `@deriv/hooks` for shared data logic

### Working with Packages
```bash
# Install package to specific workspace
lerna exec --scope=@deriv/<package> -- npm i <dependency>

# Remove package dependency
lerna exec --scope=@deriv/<package> -- npm uninstall <dependency>
```

### Environment Requirements
- Node.js 20.x
- npm 9.x+
- Git (for contribution)

### Common Troubleshooting
For `node-sass` binding issues:
```bash
npx lerna exec -- npm rebuild node-sass
# If that fails:
npm cache clean --force
npm run clean
npm run bootstrap
```

## Release Process

### Staging Release
```bash
git tag staging_v$(date +%Y%m%d) -m 'release staging'
git push origin staging_v$(date +%Y%m%d)
```

### Production Release  
```bash
git tag production_v$(date +%Y%m%d) -m 'release production'
git push origin production_v$(date +%Y%m%d)
```