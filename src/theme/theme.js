// South Indian Silk Saree Inspired Theme - Vibrant & Bold
// Colors: Golds, Bronzes, Jewel Tones
// Feel: Handmade, Woven Textile, Storytelling

export const theme = {
  // Color Palette - South Indian Silk Saree Inspired
  colors: {
    // Primary Colors (Jewel Tones)
    primary: {
      sapphire: '#0d3b66',      // Deep sapphire blue
      emerald: '#2d6a4f',       // Rich emerald green
      amethyst: '#5a189a',      // Deep amethyst purple
    },
    // Secondary Colors (Golds & Bronzes)
    secondary: {
      gold: '#d4af37',          // Luxe gold
      bronze: '#b8860b',        // Dark bronze
      copper: '#d2691e',        // Warm copper
      saffron: '#ff9933',       // Vibrant saffron
    },
    // Accent Colors (Vibrant & Bold)
    accent: {
      crimson: '#c41e3a',       // Rich crimson red
      magenta: '#d946a6',       // Bold magenta
      coral: '#ff6b6b',         // Vibrant coral
      ivory: '#fef9f3',         // Warm ivory/cream
      charcoal: '#2c2c2c',      // Warm charcoal
    },
    // Neutral Colors
    neutral: {
      cream: '#faf8f3',         // Warm cream (handmade feel)
      white: '#ffffff',
      gray: '#757575',
      grayLight: '#f0ede5',     // Warm light gray
      grayDark: '#424242',
      black: '#1a1a1a',
    },
  },

  // Typography
  typography: {
    fontFamily: {
      primary: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif',
      accent: '"Georgia", "Times New Roman", serif', // Traditional feel
      handmade: '"Caveat", "Comic Sans MS", cursive', // Playful handmade
    },
    fontSize: {
      xs: '12px',
      sm: '14px',
      base: '16px',
      lg: '18px',
      xl: '24px',
      xxl: '32px',
      xxxl: '48px',
    },
    fontWeight: {
      light: 300,
      regular: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
  },

  // Spacing System (8px base)
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
    xxl: '48px',
  },

  // Border Radius (less modern, more organic)
  borderRadius: {
    sm: '6px',
    md: '10px',
    lg: '16px',
    full: '50%',
  },

  // Shadows (softer, more handmade)
  shadows: {
    sm: '2px 3px 6px rgba(0, 0, 0, 0.12)',
    md: '4px 6px 12px rgba(0, 0, 0, 0.15)',
    lg: '8px 12px 20px rgba(0, 0, 0, 0.18)',
    xl: '12px 18px 30px rgba(0, 0, 0, 0.2)',
  },

  // Breakpoints for responsive design
  breakpoints: {
    mobile: '480px',
    tablet: '768px',
    desktop: '1024px',
    wide: '1440px',
  },

  // Gradients (using silk saree colors)
  gradients: {
    primary: 'linear-gradient(135deg, #0d3b66 0%, #d4af37 100%)',
    jewel: 'linear-gradient(135deg, #5a189a 0%, #2d6a4f 100%)',
    warmGold: 'linear-gradient(135deg, #d4af37 0%, #d2691e 100%)',
    vibrant: 'linear-gradient(135deg, #c41e3a 0%, #ff9933 100%)',
    subtle: 'linear-gradient(135deg, #fef9f3 0%, #f0ede5 100%)',
  },

  // Transitions
  transitions: {
    fast: '150ms ease-in-out',
    base: '300ms ease-in-out',
    slow: '500ms ease-in-out',
  },
};

export default theme;

