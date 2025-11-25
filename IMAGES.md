# Image Creation Guide for Mini App

## Where to Place Images

All images must be placed in the **`public/`** folder at the project root.

In Next.js, files from the `public/` folder are automatically available at the root path:
- `public/icon.png` → available as `/icon.png`
- `public/splash.png` → available as `/splash.png`
- `public/og.png` → available as `/og.png`

## Required Images

### 1. `public/icon.png` (1024×1024px)
- **Size**: 1024×1024 pixels
- **Format**: PNG
- **Purpose**: App icon
- **Requirements**: 
  - Square image
  - Transparent background not recommended
  - Used in manifest as `iconUrl`

### 2. `public/splash.png` (recommended 200×200px)
- **Size**: Recommended 200×200 pixels
- **Format**: PNG
- **Purpose**: Loading screen image (splash screen)
- **Used in manifest as**: `splashImageUrl`

### 3. `public/og.png` (1200×630px)
- **Size**: 1200×630 pixels (1.91:1 ratio)
- **Format**: PNG or JPG
- **Purpose**: Open Graph image for social networks
- **Used in manifest as**: `heroImageUrl` and `ogImageUrl`

## Additional Images (Optional)

### 4. `public/icon-192.png` (192×192px)
- For PWA manifest (`manifest.json`)
- Used on mobile devices

### 5. `public/icon-512.png` (512×512px)
- For PWA manifest (`manifest.json`)
- Used on mobile devices

### 6. `public/screenshot1.png`, `public/screenshot2.png`, `public/screenshot3.png` (1284×2778px)
- **Size**: 1284×2778 pixels (portrait orientation)
- **Maximum**: 3 screenshots
- **Purpose**: Visual previews of the app
- Can be added to manifest in `screenshotUrls` field after creation

## Tools for Creating Images

### Online Generators:
- [Mini App Assets Generator](https://www.miniappassets.com/) - specifically for Base App and Farcaster Mini Apps
- [Favicon Generator](https://realfavicongenerator.net/) - for icons
- [Canva](https://www.canva.com/) - for design creation

### Design Requirements:
- Use brand colors (#1e293b - dark blue)
- Add "The Wall Base" name or logo
- For OG image, add app description

## After Creating Images

1. Place files in the `public/` folder:
   ```
   public/
   ├── icon.png
   ├── splash.png
   ├── og.png
   ├── icon-192.png (optional)
   ├── icon-512.png (optional)
   └── screenshot1.png (optional)
   ```

2. Ensure URLs in manifest are correct:
   - `https://basewall.vercel.app/icon.png`
   - `https://basewall.vercel.app/splash.png`
   - `https://basewall.vercel.app/og.png`

3. After deployment, check image availability:
   - `https://basewall.vercel.app/icon.png`
   - `https://basewall.vercel.app/splash.png`
   - `https://basewall.vercel.app/og.png`

## Verification

After creating images and deploying, verify:
1. All images are accessible at the specified URLs
2. Manifest passes validation in Base Build Preview Tool
3. Images display correctly in Base App
