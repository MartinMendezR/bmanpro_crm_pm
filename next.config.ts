import type { NextConfig } from 'next';

const isTurbopack = process.env.TURBOPACK === '1';

const nextConfig: NextConfig = {
	reactStrictMode: false,

	experimental: {
		serverComponentsExternalPackages: ['sequelize', 'mysql2']
	},

	eslint: {
		ignoreDuringBuilds: process.env.NODE_ENV === 'production'
	},

	typescript: {},

	turbopack: {
		rules: {}
	},

	// Only apply webpack when NOT using turbopack
	...(!isTurbopack && {
		webpack: (config) => {
			config.module.rules.push({
				test: /\.(json|js|ts|tsx|jsx)$/,
				resourceQuery: /raw/,
				use: 'raw-loader'
			});

			return config;
		}
	})
};

export default nextConfig;
