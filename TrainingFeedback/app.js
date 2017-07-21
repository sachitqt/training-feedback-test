// This loads the environment variables from the .env file
require('dotenv-extended').load();
const restify = require('restify');
const bot = require('./bot.js');

// Setup Restify Server
var server = restify.createServer();

server.post('/api/messages', bot.connector('*').listen());

server.listen(process.env.port || process.env.PORT || 5000, function () {
    console.log('%s listening to %s', server.name, server.url);
});








