# Toone

Repeatable workflows. Specialised agents. Results you can review.

Toone is a macOS workspace for recurring work, focused AI assistance, and useful outputs. Explore product screenshots and examples at [trytoone.com](https://trytoone.com).

[Request Early Access](https://trytoone.com/en/request-access) · [Existing user sign-in](https://trytoone.com/en/signin) · [Redeem an invitation](https://trytoone.com/en/invite)

Public registration and public installer distribution are closed. Existing account holders can keep using their installed applications and obtain installers after signing in. Each personal invitation is labelled with the recipient’s name. They enter their code and their own email to create an account and download Toone; the signup is recorded against that invitation.

This repository contains the public website and product introductions. The desktop application is proprietary; its implementation and installers are maintained separately.

## Website development

Use Node.js 24. Run `npm ci`, `npm run dev`, and `npm run build`. `npm test` validates product content, Explore behavior, and types; `npm run content:check-routes` checks the built routes.

Explore pages use the server-only `EXPLORE_API_BASE_URL` and signed cache revalidation. See [Explore verification](tests/explore/README.md) for the fixture API, production HTTP tests, and manual UI edge cases.

Questions and support: [hello@trytoone.com](mailto:hello@trytoone.com).
