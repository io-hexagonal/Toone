# Contributing to Toone

Thanks for your interest in contributing! Here's how you can help.

## Reporting Issues

- Use [GitHub Issues](https://github.com/io-hexagonal/Toone/issues) for bug reports and feature requests
- Check existing issues before creating a new one
- Include reproduction steps, expected behavior, and your environment (OS, app version)

## Open Source Projects

Certain parts of Toone are open source and accept contributions:

- **Animation** (`animation/`) — the pixel-field splash animation
- **Assets** (`assets/`) — design tokens and brand resources

## Development

### Animation

The animation is a standalone HTML Canvas app. To develop:

```bash
cd animation
npx serve ..
# open http://localhost:3000/animation
```

The animation is a 1:1 port of the native Swift `SplashPixelField` from the mobile app. Changes should maintain visual parity.

## Code of Conduct

Be respectful, constructive, and inclusive. We're building something cool together.
