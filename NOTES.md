# Development Notes & TODOs

## Important Configuration Steps

### 1. Supabase Setup
- [ ] Create Supabase project
- [ ] Run `supabase/schema.sql` in SQL Editor
- [ ] Copy project URL and keys to `.env.local`
- [ ] Test connection with seed script

### 2. Contract Deployment
- [ ] Get Base Sepolia testnet ETH from faucet
- [ ] Deploy contract: `npm run deploy:contract`
- [ ] Copy contract address to `.env.local`
- [ ] (Optional) Verify contract on BaseScan

### 3. Mini App Configuration
- [ ] Deploy to Vercel
- [ ] Update `NEXT_PUBLIC_MINIAPP_URL` in Vercel env vars
- [ ] Update `homeUrl` in `app/.well-known/farcaster.json`
- [ ] Create account association in Base Build
- [ ] Sign manifest with Farcaster account

### 4. Quick Auth (Optional)
- [ ] Set up Quick Auth secret
- [ ] Update `QUICK_AUTH_SECRET` in `.env.local`
- [ ] Test JWT verification in API routes

## Future Enhancements

- [ ] Add OG image generation for NFT metadata
- [ ] Implement proper Farcaster Mini App connector when SDK is updated
- [ ] Add rate limiting for API endpoints
- [ ] Add webhook support for real-time updates
- [ ] Implement post search/filtering
- [ ] Add post sharing functionality
- [ ] Create admin dashboard for moderation
- [ ] Add analytics tracking

## Testing Checklist

- [ ] Create post and verify minting
- [ ] Edit post as owner
- [ ] Delete post as owner
- [ ] Try editing/deleting as non-owner (should fail)
- [ ] Transfer NFT and verify ownership change
- [ ] Test likes/dislikes
- [ ] Test infinite scroll
- [ ] Test scroll buttons
- [ ] Verify profile display with OnchainKit
- [ ] Test in Base App environment

## Known Issues

1. **Wallet Connection**: In local dev, may need manual wallet connection. Base App handles this automatically.

2. **TokenId Extraction**: Currently uses event parsing with fallback. The contract returns tokenId, but we extract from events for reliability.

3. **Quick Auth**: JWT verification is optional. Full implementation requires proper secret setup.

4. **Metadata Images**: Currently placeholders. Consider adding dynamic OG image generation.

## Security Considerations

- Never commit `.env.local` or private keys
- Always verify ownership on-chain before allowing edits/deletes
- Implement rate limiting in production
- Validate all user inputs
- Use HTTPS in production
- Consider adding CORS restrictions for API endpoints

