# Contributing to tripero-node

First off, thank you for considering contributing to tripero-node! It's people like you that make this project better for everyone.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How Can I Contribute?](#how-can-i-contribute)
  - [Reporting Bugs](#reporting-bugs)
  - [Suggesting Features](#suggesting-features)
  - [Pull Requests](#pull-requests)
- [Development Setup](#development-setup)
- [Style Guidelines](#style-guidelines)
- [Commit Messages](#commit-messages)

## Code of Conduct

This project and everyone participating in it is governed by our Code of Conduct. By participating, you are expected to uphold this code. Please be respectful and constructive in all interactions.

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check existing issues to avoid duplicates. When you create a bug report, include as many details as possible:

- **Use a clear and descriptive title**
- **Describe the exact steps to reproduce the problem**
- **Provide specific examples** (code snippets, configuration)
- **Describe the behavior you observed and what you expected**
- **Include your environment** (Node.js version, OS, package version)

### Suggesting Features

Feature suggestions are welcome! Please provide:

- **A clear and descriptive title**
- **Detailed explanation of the feature**
- **Why this feature would be useful** to most users
- **Possible implementation approach** (if you have ideas)

### Pull Requests

1. **Fork** the repository
2. **Create** a feature branch from `main`:
   ```bash
   git checkout -b feature/my-amazing-feature
   ```
3. **Make** your changes
4. **Test** your changes:
   ```bash
   npm run build
   npm test
   npm run lint
   ```
5. **Commit** your changes following our [commit message guidelines](#commit-messages)
6. **Push** to your fork:
   ```bash
   git push origin feature/my-amazing-feature
   ```
7. **Open** a Pull Request

## Development Setup

### Prerequisites

- Node.js 18+
- npm or yarn
- Redis (for integration testing)

### Setup

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/tripero-node.git
cd tripero-node

# Install dependencies
npm install

# Build the project
npm run build

# Run tests
npm test

# Check linting
npm run lint

# Format code
npm run format
```

### Project Structure

```
tripero-node/
├── src/
│   ├── client/              # Core client implementation
│   │   ├── TriperoClient.ts # Main client class
│   │   ├── TriperoHttpClient.ts # HTTP API client
│   │   ├── constants.ts     # Constants and defaults
│   │   └── logger.ts        # Default logger
│   ├── interfaces/          # TypeScript interfaces
│   │   ├── config.interface.ts
│   │   └── events.interface.ts
│   ├── nestjs/              # NestJS integration
│   │   ├── tripero.module.ts
│   │   └── decorators.ts
│   └── index.ts             # Public exports
├── dist/                    # Compiled output
├── examples/                # Usage examples
└── tests/                   # Test files
```

## Style Guidelines

### TypeScript

- Use TypeScript strict mode
- Prefer `interface` over `type` for object shapes
- Use explicit return types for public methods
- Add JSDoc comments for public APIs

### Code Style

- Use 2 spaces for indentation
- Use single quotes for strings
- No semicolons (enforced by Prettier)
- Maximum line length: 100 characters

### Naming Conventions

- **Classes**: PascalCase (`TriperoClient`)
- **Interfaces**: PascalCase with `I` prefix optional (`TriperoOptions` or `ITriperoOptions`)
- **Functions/Methods**: camelCase (`publishPosition`)
- **Constants**: UPPER_SNAKE_CASE (`REDIS_HOST`)
- **Files**: kebab-case or PascalCase for classes (`TriperoClient.ts`)

## Commit Messages

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, semicolons, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

### Examples

```
feat(client): add batch position publishing

Add publishPositions() method that uses Redis pipeline
for improved performance when publishing multiple positions.

fix(http): handle timeout errors gracefully

Previously, timeout errors would crash the application.
Now they are caught and logged appropriately.

docs: update README with NestJS examples
```

## Questions?

Feel free to open an issue or start a discussion if you have any questions!

---

Thank you for contributing! 🎉
