// This loads the environment variables from the .env file
require('dotenv-extended').load();
const restify = require('restify');
const botify = require('./bot.js');
var cron = require('node-cron');
var firebaseOperations = require('./firebase_operations.js');

// Setup Restify Server
var server = restify.createServer();
var bot = botify.getUniversalBotInstance();
var builder = botify.getBuilderObject();
let i18n = require("i18n");

const LOCALHOST_DEV_PORT = 5000;

i18n.configure({
    locales: ['en', 'de'],
    directory: __dirname + '/locales'
});


server.post('/api/messages', bot.connector('*').listen());

server.listen(process.env.port || process.env.PORT || LOCALHOST_DEV_PORT, function startServer() {
    console.log(`${server.name} listening at: ${server.url}`);
    startCronToCheckPendingFeedback();
});

// configure a root status handler so we know our bot server is online
server.get('/', function (request, response, next) {
    let statusInfo = {
        name: 'chatterbot-azure-linux',
        status: 'online'
    }
    response.send(200, statusInfo);
    next();
});



// Do GET this endpoint to delivey a notification
server.get('/api/CustomWebApi', (req, res) => {
        getAddressToBroadCastMessage(req, res);
    }
);

//--------------------------------------------- Cron Work ------------------------------------------------------------//


/**
 * This cron service will iterate the user data from the sesison table and will check that if any pending feedback is
 * available for that user, send a proactive message to that user
 */
function startCronToCheckPendingFeedback() {
    var taskForPendingFeedback = cron.schedule('0 */1 * * * *', function () {
        console.log('Running a task to check pending feedback');
        checkForPendingFeedback();
    }, false);
    taskForPendingFeedback.start();
}

/**
 * This method will check the current logged in user has any pending feedback or not
 */
function checkForPendingFeedback() {
    firebaseOperations.getUserSession(function (totalSignedUserArray) {
        totalSignedUserArray.forEach(function (snapshot) {
            var address = snapshot.val().address;
            var username = address.user.name;
            firebaseOperations.isFeedbackPendingForUser(username, function (isPendingFeedback) {
                if (isPendingFeedback) {
                    var name, isStarted, lastSentMessage, trainingId, attendeeId;
                    firebaseOperations.getPendingFeedbackForUser(username, function (pendingFeedbackObject) {
                        var BreakException = {};
                        try {
                            pendingFeedbackObject.forEach(function (child) {
                                isStarted = child.val().isStarted;
                                name = child.val().trainingName;
                                if (isStarted) {
                                    name = child.val().trainingName;
                                    lastSentMessage = child.val().lastSentMessage;
                                    trainingId = child.val().trainingId;
                                    attendeeId = child.val().attendeeId;
                                    checkForIdealCondition(address, lastSentMessage, trainingId, attendeeId, name);
                                    throw BreakException;
                                }
                            });
                        } catch (e) {
                            if (e !== BreakException) throw e;
                        }
                        if (!isStarted) {
                            var msg = new builder.Message().address(address);
                            msg.text(i18n.__('just_attended_notification'), name);
                            bot.send(msg);
                        }
                    });
                }
            })
        })
    })
}

/**
 * This method will check the time difference between the last sent message time and current time and send user a
 * message accordingly
 */
function checkForIdealCondition(address, lastSentMessage, trainingId, attendeeId, trainingName) {
    var currentDate = new Date();
    var diff = (currentDate.getTime() - lastSentMessage) / 1000;
    diff /= 60;
    console.log(Math.abs(Math.round(diff)));
    var timeDifference = Math.abs(Math.round(diff));
    if (timeDifference >= 10) {
        sendProactiveMessage(address, trainingName);
        lastSentMessage = new Date().getTime();
        firebaseOperations.updateLastSentMessageOfPendingFeedback(lastSentMessage, attendeeId, trainingId);
    }
}

/**
 * This method will send a reminder to user to fill the feedback in case if user is in ideal state
 * @param address
 * @param trainingName
 */
function sendProactiveMessage(address, trainingName) {
    try {
        var name = address.user.name;
        var firstName = name.split(" ")[0];
        var msg = new builder.Message().address(address);
        msg.text(i18n.__('inactive_msg'), firstName, trainingName);
        bot.send(msg);

    } catch (err) {
        console.log(err.message);
    }
}

/**
 * this method will get the address from the database and will send a message.
 * @param res
 */
function getAddressToBroadCastMessage(req, res) {
    var url = req.url;
    var message = decodeURI(url.split("?")[1]);
    firebaseOperations.getUserSession(function (sessionArray) {
        sessionArray.forEach(function (snapshot) {
            var username = snapshot.val().address.user.name;
            var firstName = username.split(" ")[0];
            var address = snapshot.val().address;
            sendBroadcastToAllMembers(firstName, address, message);
        });
    });
    res.send('triggered');
}

/**
 * This method will broadcast a message to all the member connected with bot
 * @param username
 * @param address
 * @param message
 */
function sendBroadcastToAllMembers(username, address, message) {
    try {
        var msg = new builder.Message().address(address);
        var message = "Hey **%s**, " + message;
        msg.text(message, username);
        msg.textLocale('en-US');
        bot.send(msg);

    } catch (err) {
        console.log(err.message);
    }
}



