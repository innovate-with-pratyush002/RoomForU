# Contributing to StudentRoomHub

Thanks for contributing to StudentRoomHub. This project is open to improvements in features, bug fixes, documentation, UI polish, code quality, accessibility, and developer experience.

## Ways to Contribute

Open contributions are welcome in areas such as:

- Bug fixes
- UI and UX improvements
- Better validation and error handling
- Search and filtering improvements
- Performance improvements
- Test coverage
- Documentation updates
- Security and configuration cleanup
- Refactoring for maintainability

## Before You Start

Please review the current codebase before making changes so your work matches the existing project structure and behavior.

Important context for this repository:

- The app uses Express with server-rendered EJS templates
- MongoDB is expected locally at `mongodb://127.0.0.1:27017/RoomForU`
- Image uploads use Cloudinary
- Authentication supports both local login and Google OAuth
- There is currently no automated test suite configured

## Development Setup

1. Fork the repository.
2. Clone your fork locally.
3. Install dependencies with `npm install`.
4. Create a `.env` file with the required Cloudinary and Google OAuth credentials.
5. Start MongoDB locally.
6. Run the app with `node app.js` or `npx nodemon app.js`.

## Contribution Workflow

1. Create a new branch from your working base.
2. Keep the branch focused on a single issue or improvement.
3. Make your changes with clear, readable commits.
4. Test the affected flow manually.
5. Update documentation if behavior, setup, or routes changed.
6. Open a pull request with a clear explanation of what changed and why.

## Pull Request Guidelines

A good pull request should include:

- A short summary of the problem
- A concise explanation of the solution
- Notes about any setup or migration changes
- Screenshots or screen recordings for UI updates
- Manual testing steps

Try to keep pull requests reviewable. Smaller PRs are easier to validate and merge.

## Code Guidelines

Please follow these standards when contributing:

- Preserve the existing Express, route, controller, and model structure unless the refactor is intentional
- Prefer small, focused changes over broad rewrites
- Reuse existing middleware and controller patterns where possible
- Keep naming consistent with the rest of the codebase
- Avoid introducing unused dependencies
- Do not commit secrets, `.env` files, or personal credentials

## Documentation Guidelines

Documentation contributions are useful and encouraged. If you change setup steps, routes, environment variables, or expected behavior, update the relevant docs in the same pull request.

## Reporting Bugs

When opening a bug report, include:

- What you expected to happen
- What actually happened
- Steps to reproduce the issue
- Screenshots or logs if relevant
- Your environment details if the issue is setup-specific

## Feature Requests

Feature requests are welcome. Please describe:

- The problem the feature solves
- The proposed behavior
- Any UI or data model impact
- Whether you want to implement it yourself

## Areas That Need Contribution

Useful contribution targets for this project include:

- Add automated tests
- Add an `.env.example` file
- Move hardcoded secrets and config values to environment variables
- Improve validation for forms and file uploads
- Add stronger error pages and empty states
- Improve mobile responsiveness and accessibility
- Add deployment documentation

## Review Expectations

Maintainers may request changes if a PR:

- breaks existing flows
- lacks enough context to review safely
- introduces unrelated changes in the same branch
- adds configuration or dependency overhead without a clear need

## Questions

If something in the codebase is unclear, open an issue before making a large change. That is the fastest way to align on scope before you invest time in implementation.
