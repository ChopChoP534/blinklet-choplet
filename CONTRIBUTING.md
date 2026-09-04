# Contributing to Blinklet

Thank you for your interest in contributing! This document provides guidelines and instructions for contributing to the project.

## Development Setup

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/your-username/blinklet.git
   cd blinklet
   ```
3. Install dependencies:
   ```bash
   npm run install:all
   ```
4. Set up environment variables (see [README.md](README.md#configuration))
5. Start both development servers:
   ```bash
   npm run dev
   ```

## Code Style Guidelines

### TypeScript

- **Strict Mode**: All TypeScript must compile with strict mode enabled
- **No `any` Types**: Use proper types or `unknown` instead
- **No `@ts-ignore`**: Fix type issues properly
- **Type Safety**: Export and reuse types across modules

### Code Quality

- **No Console Statements**: Use structured logging (Winston logger in backend)
- **No Comments**: Write self-documenting code instead; name things so the comment is unnecessary
- **Formatting**: Run `npm run format` before committing; Prettier config lives in `.prettierrc`
- **Extract Constants**: No hardcoded values; use environment variables or constants
- **Error Handling**: Always handle errors gracefully with proper error types

### Naming Conventions

- **Files**: PascalCase for components/classes, camelCase for utilities
- **Variables**: camelCase for variables and functions
- **Constants**: UPPER_SNAKE_CASE for true constants
- **Interfaces**: PascalCase with descriptive names

### Frontend Guidelines

- **Components**: Use functional components with TypeScript
- **Hooks**: Follow React hooks rules and best practices
- **Styling**: Use Tailwind CSS utility classes
- **State Management**: Use React hooks for local state
- **Accessibility**: Ensure components are accessible (ARIA labels, keyboard navigation)

### Backend Guidelines

- **Service Layer**: Keep business logic in service classes
- **Validation**: Validate all inputs in middleware
- **Logging**: Use structured logging with appropriate log levels
- **Error Handling**: Use AppError class for operational errors
- **Database**: Use Mongoose models with proper types

## Pull Request Process

1. Create a feature branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make your changes following the code style guidelines

3. Check your changes from the repository root:
   ```bash
   npm run format
   npm run lint
   npm run type-check
   npm run build
   ```

4. Commit with clear, descriptive messages:
   ```bash
   git commit -m "Add feature: description of what you added"
   ```

5. Push to your fork:
   ```bash
   git push origin feature/your-feature-name
   ```

6. Open a Pull Request with:
   - Clear description of changes
   - Screenshots for UI changes
   - Test results if applicable

## Commit Message Guidelines

- Use present tense ("Add feature" not "Added feature")
- Use imperative mood ("Move cursor to..." not "Moves cursor to...")
- Start with a capital letter
- No period at the end
- Be concise but descriptive

Examples:
- `Add raffle participant export feature`
- `Fix transaction signing error for swap actions`
- `Update dashboard layout for mobile devices`
- `Refactor BlinkService to use async/await`

## Testing

Before submitting a PR:

1. **Types**: `npm run type-check` passes for both packages
2. **Lint**: `npm run lint` reports no errors
3. **Build**: `npm run build` succeeds
4. **Manual testing**: Exercise the change in the browser, including error paths

## Code Review Process

All submissions require review. We will:

1. Check code style compliance
2. Verify functionality
3. Test for regressions
4. Ensure type safety
5. Review for security issues

## Areas for Contribution

We welcome contributions in:

- Bug fixes
- New Blink types
- UI/UX improvements
- Performance optimizations
- Documentation improvements
- Test coverage
- Accessibility enhancements

## Questions or Issues?

- Open an issue for bugs or feature requests
- Provide detailed reproduction steps for bugs
- Include screenshots for visual issues
- Check existing issues before creating new ones

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
