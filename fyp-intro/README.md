# NutriTrack - Landing Page

A beautiful, Apple-style landing page for the NutriTrack app. This page showcases the app's features and provides download options via QR code and direct APK download.

## Features

- 🎨 Modern, Apple-inspired design
- 📱 Responsive layout for all devices
- 🔲 QR code for easy mobile download
- 📥 Direct APK download button
- ✨ Smooth animations and transitions
- 🌙 Dark theme optimized
- 📸 App screenshot showcase section

## Getting Started

### Installation

```bash
npm install
```

### Development

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the landing page.

### Build

Build for production:

```bash
npm run build
npm start
```

## Adding App Screenshots

To add your actual app screenshots:

1. Place your screenshot images in the `public/` folder:

   - `screenshot-hero.png` - Main hero section screenshot
   - `screenshot-ai.png` - AI Assistant screenshot
   - `screenshot-leaderboard.png` - Leaderboard screenshot
   - `screenshot-meal.png` - Add Meal screenshot

2. Update `app/page.tsx` to use the images:
   - Uncomment the `<img>` tags in the screenshot sections
   - Or replace the placeholder divs with actual images

Example:

```tsx
<img
  src="/screenshot-hero.png"
  alt="NutriTrack App"
  className="w-full h-full object-cover"
/>
```

## Configuration

### APK Download URL

To set the APK download URL, create a `.env.local` file:

```env
NEXT_PUBLIC_APK_URL=https://your-domain.com/path/to/app.apk
```

Or update the `apkUrl` state in `app/page.tsx` directly.

### QR Code

The QR code automatically uses the APK URL. If no URL is set, it will use the current page URL.

## Customization

- Update app name: Search for "NutriTrack" in `app/page.tsx` and `app/layout.tsx`
- Modify features: Edit the Features section in `app/page.tsx`
- Change colors: Update Tailwind classes (emerald/teal gradients)
- Add more sections: Follow the existing pattern

## Tech Stack

- Next.js 16
- React 19
- Tailwind CSS 4
- QRCode library for QR code generation

## Project Structure

```
fyp-intro/
├── app/
│   ├── layout.tsx      # Root layout with metadata
│   ├── page.tsx         # Main landing page
│   └── globals.css      # Global styles
├── public/              # Static assets (add screenshots here)
└── package.json         # Dependencies
```
