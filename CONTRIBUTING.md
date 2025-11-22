# Contributing to OneStream

Thank you for your interest in contributing! This document provides guidelines for contributing to the project.

## Development Setup

1. Fork and clone the repository
2. Run `npm install`
3. Copy `.env.local.example` to `.env.local` and fill in your credentials
4. Set up Supabase database using `supabase/schema.sql`
5. Deploy the contract to Base Sepolia
6. Run `npm run dev`

## Code Style

- Use TypeScript for all new code
- Follow the existing code style (Prettier + ESLint)
- Use functional components with hooks
- Keep components small and focused

## Testing

- Test locally with Base Sepolia testnet
- Verify NFT minting works correctly
- Test ownership verification for edit/delete
- Check infinite scroll and lazy loading

## Pull Request Process

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Update documentation if needed
5. Submit a pull request with a clear description

## Questions?

Open an issue for any questions or suggestions!

