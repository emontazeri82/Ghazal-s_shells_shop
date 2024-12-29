const path = require('path');
const CopyPlugin = require('copy-webpack-plugin'); // Import CopyPlugin

module.exports = {
    entry: './script_folder/index.ts', // Entry point for your app
    output: {
        filename: 'bundle.js', // Name of the output file
        path: path.resolve(__dirname, 'dist'), // Output directory
        publicPath: '/', // Public path for serving assets
    },
    resolve: {
        alias: {
            '@components': path.resolve(__dirname, 'script_folder/components'), // Alias for components
            '@styles': path.resolve(__dirname, 'styles'), // Alias for styles
        },
        extensions: ['.ts', '.js'], // Extensions to resolve
        fallback: {
            path: require.resolve('path-browserify'), // Polyfill for Node.js `path`
        },
    },
    module: {
        rules: [
            {
                test: /\.ts$/, // Process TypeScript files
                use: 'ts-loader',
                exclude: /node_modules/, // Exclude node_modules
            },
            {
                test: /\.(png|jpg|jpeg|gif|svg)$/, // Handle image files
                type: 'asset/resource',
            },
            {
                test: /\.css$/, // Process CSS files
                use: ['style-loader', 'css-loader'], // Apply loaders for CSS
            },
        ],
    },
    plugins: [
        new CopyPlugin({
            patterns: [
                { from: 'styles', to: 'styles' }, // Copy styles folder into dist
            ],
        }),
    ],
    devtool: 'source-map', // Source maps for debugging
    mode: 'development', // Development mode
    devServer: {
        static: [
            {
                directory: path.resolve(__dirname, 'htmls_folder'), // Serve HTML files
            },
            {
                directory: path.resolve(__dirname, 'images'), // Serve images
            },
        ],
        port: 8080,
        open: true,
        historyApiFallback: true,
        proxy: [
            {
                context: ['/api'], // Specify paths to be proxied
                target: 'http://localhost:3000', // Proxy target
                changeOrigin: true,
            },
        ],
    },

};













