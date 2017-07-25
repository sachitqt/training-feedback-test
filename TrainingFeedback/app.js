// This loads the environment variables from the .env file
require('dotenv-extended').load();
const restify = require('restify');
const botify = require('./bot.js');

// Setup Restify Server
var server = restify.createServer();
var bot =   botify.getUniversalBotInstance();

server.post('/api/messages', bot.connector('*').listen());

server.listen(process.env.port || process.env.PORT || 5000, function () {
    // var pendingFeedbackTaskVariable =   botify.getPendingFeedbackTaskVariable();
    // pendingFeedbackTaskVariable.start();
    botify.taskForPendingFeedback.start();
    botify.taskForIdealState.start();
    console.log('%s listening to %s', server.name, server.url);

});








