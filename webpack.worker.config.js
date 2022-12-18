const path = require('path');

module.exports = {
    mode: 'development',
    entry: './worker.ts',
    target: 'webworker',

    devtool: 'inline-source-map',

    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: /node_modules/,
            },
        ],
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.js'],
    },
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'worker.js',
    },
};
