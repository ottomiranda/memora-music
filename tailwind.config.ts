import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
        screens: {
                '2xl': '1320px'
            }
		},
		extend: {
			colors: {
				// Memora Music Brand Colors
				memora: {
					primary: '#7B3FE4',    // Roxo primário
					secondary: '#FEC641',  // Dourado secundário
					coral: '#FF5A73',      // Coral de apoio
					turquoise: '#3ECFBB',  // Turquesa de apoio
					black: '#101010',      // Preto neutro
					gray: '#7A7A7A',       // Cinza médio
					'gray-light': '#F4F4F4' // Cinza claro
				},
				// Shadcn/ui colors
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))',
					glow: 'hsl(var(--primary-glow))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				accent: {
					coral: 'hsl(var(--accent-coral))',
					turquoise: 'hsl(var(--accent-turquoise))',
					'coral-foreground': 'hsl(var(--accent-coral-foreground))',
					'turquoise-foreground': 'hsl(var(--accent-turquoise-foreground))'
				},
				neutral: {
					dark: 'hsl(var(--neutral-dark))',
					gray: 'hsl(var(--neutral-gray))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				}
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			keyframes: {
				'accordion-down': {
					from: {
						height: '0'
					},
					to: {
						height: 'var(--radix-accordion-content-height)'
					}
				},
				'accordion-up': {
					from: {
						height: 'var(--radix-accordion-content-height)'
					},
					to: {
						height: '0'
					}
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out'
			},
			fontFamily: {
				'heading': ['Sora', 'sans-serif'],
				'body': ['Inter', 'sans-serif']
			}
		}
	},
	plugins: [tailwindcssAnimate],
} satisfies Config;
