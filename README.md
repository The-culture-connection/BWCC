# Black Women Cultivating Change Website

A modern, dynamic Next.js website for Black Women Cultivating Change (BWCC), a 501(c)(3) organization that advocates, educates, and provides platforms to eliminate mental health stigmas in the Black Community.

## Features

- 🎨 Modern, responsive design with smooth animations
- ⚡ Built with Next.js 14+ and React 18
- 🎭 Animations powered by Framer Motion
- 🎨 Styled with Tailwind CSS
- 📱 Fully responsive for all devices
- ♿ Accessible and semantic HTML

## Getting Started

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager

### Installation

1. Install dependencies:
```bash
npm install
```

2. Run the development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
├── app/
│   ├── globals.css          # Global styles
│   ├── layout.tsx           # Root layout with header/footer
│   └── page.tsx             # Home page
├── components/
│   ├── Header.tsx           # Navigation header
│   ├── Footer.tsx           # Footer with social links
│   ├── Hero.tsx             # Hero section with mailing list
│   ├── MissionVision.tsx    # Mission and vision cards
│   ├── Values.tsx           # Core values grid
│   ├── Partners.tsx         # Partners section
│   └── Donate.tsx           # Donation form
└── public/                  # Static assets
```

## Customization

### Colors
Edit `tailwind.config.ts` to customize the color scheme:
- `primary`: Primary brand colors (blues)
- `accent`: Accent colors (purples)

### Content
- Update text content in component files
- Replace placeholder images in the `public/` directory
- Update social media links in `components/Footer.tsx`

## Build for Production

```bash
npm run build
npm start
```

## Technologies Used

- **Next.js 14+** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first CSS
- **Framer Motion** - Animation library
- **Lucide React** - Icon library

## License

This project is for Black Women Cultivating Change organization.

# BWCC
