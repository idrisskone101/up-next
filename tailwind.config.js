import { fontFamily } from "tailwindcss/defaultTheme";

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
  	container: {
  		center: true,
  		padding: {
  			DEFAULT: '1.75rem',
  			sm: '1.75rem',
  			lg: '2.5rem',
  			xl: '3rem'
  		},
  		screens: {
  			'2xl': '1200px'
  		}
  	},
  	extend: {
  		colors: {
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			success: {
  				DEFAULT: 'hsl(var(--success))',
  				foreground: 'hsl(var(--success-foreground))'
  			},
  			warning: {
  				DEFAULT: 'hsl(var(--warning))',
  				foreground: 'hsl(var(--warning-foreground))'
  			},
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			match: {
  				excellent: 'hsl(var(--match-excellent))',
  				good: 'hsl(var(--match-good))',
  				fair: 'hsl(var(--match-fair))'
  			},
  			amber: {
  				'50': '#FFFBEB',
  				'100': '#FEF3C7',
  				'200': '#FDE68A',
  				'300': '#FCD34D',
  				'400': '#FBBF24',
  				'500': '#F59E0B',
  				'600': '#D97706',
  				'700': '#B45309',
  				'800': '#92400E',
  				'900': '#78350F',
  				DEFAULT: '#F59E0B'
  			},
  			gold: {
  				DEFAULT: '#FBBF24',
  				light: '#FCD34D',
  				dark: '#D97706'
  			},
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			}
  		},
  		borderRadius: {
  			xl: 'calc(var(--radius) + 4px)',
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		fontFamily: {
  			sans: [
  				'Nunito',
  				'sans-serif'
  			],
  			heading: [
  				'Outfit',
  				'sans-serif'
  			],
  			display: [
  				'Pacifico',
  				'cursive'
  			],
  			serif: [
  				'Pacifico',
  				'cursive'
  			],
  			playful: [
  				'Outfit',
  				'sans-serif'
  			]
  		},
  		boxShadow: {
  			soft: '0 20px 60px -35px hsl(var(--shadow) / 0.4)',
  			'inner-glow': '0 0 0 1px hsl(var(--border)) inset, 0 20px 45px -35px hsl(var(--shadow) / 0.6)'
  		},
  		backgroundImage: {
  			'grid-lg': 'radial-gradient(circle at 1px 1px, hsl(var(--border) / 0.35) 1px, transparent 0)'
  		},
  		animation: {
  			'fade-in': 'fadeIn 0.5s ease-in-out',
  			'slide-up': 'slideUp 0.4s ease-out',
  			'scale-in': 'scaleIn 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
  			'slide-in': 'slideIn 0.3s ease-out',
  			'bounce-in': 'bounceIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
  			'bounce-out': 'bounceOut 0.3s ease-in forwards',
  			'wiggle': 'wiggle 0.3s ease-in-out',
  			'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
  			'pop': 'pop 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
  			'shimmer': 'shimmer 2s infinite'
  		},
  		keyframes: {
  			fadeIn: {
  				'0%': {
  					opacity: '0'
  				},
  				'100%': {
  					opacity: '1'
  				}
  			},
  			slideUp: {
  				'0%': {
  					transform: 'translateY(20px)',
  					opacity: '0'
  				},
  				'100%': {
  					transform: 'translateY(0)',
  					opacity: '1'
  				}
  			},
  			scaleIn: {
  				'0%': {
  					opacity: '0',
  					transform: 'scale(0.96)'
  				},
  				'100%': {
  					opacity: '1',
  					transform: 'scale(1)'
  				}
  			},
  			slideIn: {
  				'0%': {
  					transform: 'translateX(-100%)',
  					opacity: '0'
  				},
  				'100%': {
  					transform: 'translateX(0)',
  					opacity: '1'
  				}
  			},
  			bounceIn: {
  				'0%': {
  					transform: 'scale(0.8)',
  					opacity: '0'
  				},
  				'50%': {
  					transform: 'scale(1.08)'
  				},
  				'75%': {
  					transform: 'scale(0.98)'
  				},
  				'100%': {
  					transform: 'scale(1)',
  					opacity: '1'
  				}
  			},
  			bounceOut: {
  				'0%': {
  					transform: 'scale(1)',
  					opacity: '1'
  				},
  				'100%': {
  					transform: 'scale(0.8)',
  					opacity: '0'
  				}
  			},
  			wiggle: {
  				'0%, 100%': {
  					transform: 'rotate(-3deg)'
  				},
  				'50%': {
  					transform: 'rotate(3deg)'
  				}
  			},
  			pulseGlow: {
  				'0%, 100%': {
  					boxShadow: '0 0 20px rgba(245, 158, 11, 0.2)'
  				},
  				'50%': {
  					boxShadow: '0 0 35px rgba(245, 158, 11, 0.45)'
  				}
  			},
  			pulseGlowGold: {
  				'0%, 100%': {
  					boxShadow: '0 0 15px rgba(251, 191, 36, 0.2)'
  				},
  				'50%': {
  					boxShadow: '0 0 30px rgba(251, 191, 36, 0.5)'
  				}
  			},
  			countUp: {
  				'0%': {
  					opacity: '0',
  					transform: 'translateY(10px)'
  				},
  				'100%': {
  					opacity: '1',
  					transform: 'translateY(0)'
  				}
  			},
  			pop: {
  				'0%': {
  					transform: 'scale(0.95)',
  					opacity: '0.8'
  				},
  				'50%': {
  					transform: 'scale(1.05)'
  				},
  				'100%': {
  					transform: 'scale(1)',
  					opacity: '1'
  				}
  			},
  			shimmer: {
  				'0%': {
  					transform: 'translateX(-100%)'
  				},
  				'100%': {
  					transform: 'translateX(100%)'
  				}
  			}
  		},
  		spacing: {
  			'safe-top': 'env(safe-area-inset-top)',
  			'safe-bottom': 'env(safe-area-inset-bottom)',
  			'safe-left': 'env(safe-area-inset-left)',
  			'safe-right': 'env(safe-area-inset-right)'
  		},
  		height: {
  			'screen-safe': 'calc(100vh - env(safe-area-inset-top) - env(safe-area-inset-bottom))',
  			dvh: '100dvh'
  		},
  		minHeight: {
  			'screen-safe': 'calc(100vh - env(safe-area-inset-top) - env(safe-area-inset-bottom))',
  			dvh: '100dvh'
  		},
  		maxHeight: {
  			'screen-safe': 'calc(100vh - env(safe-area-inset-top) - env(safe-area-inset-bottom))',
  			dvh: '100dvh'
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
};
