node_modules/.bin/http-server --port 8095 &
node_modules/.bin/webpack --watch &
node_modules/.bin/webpack --config webpack.worker.config.js --watch &