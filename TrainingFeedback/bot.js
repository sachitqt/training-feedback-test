var builder = require('botbuilder');
var firebaseOperations = require('./firebase_operations.js');
var customOperations = require('./custom.js');
var questionGenerator   =   require('./questions.js');
let i18n = require("i18n");
var json2csv = require('json2csv');
var fs = require('fs');
var arraylist = require('arraylist');
var cron = require('node-cron');
var ls = require('local-storage');


i18n.configure({
    locales: ['en', 'de'],
    directory: __dirname + '/locales'
});

const connector = new builder.ChatConnector({
    appId: process.env.MICROSOFT_APP_ID,
    appPassword: process.env.MICROSOFT_APP_PASSWORD
    // appId: null,
    // appPassword: null
});

// Create bot and default message handler
const bot = new builder.UniversalBot(connector);

var question, answer;


bot.on('contactRelationUpdate', function (message) {
    if (message.action === 'add') {
        var username = message.user ? message.user.name : "Unknown";
        var userId = message.user.id.split(":")[1];
        ls.set(userId, message.timestamp);
        var firstName = username.split(" ")[0];
        var saveAddress = message.address;
        var greetingMessage = getDayTimings();
        var reply = new builder.Message()
            .address(message.address);
        firebaseOperations.getUserEmailId(username, function (emailId) {
            if (emailId === '') {
                reply.text("Hey **%s**, Your skype user name doesn't match in our database. We will highly recommend you to change your skype name to get " +
                    "all the notifications of the session or contact to TM team. ", firstName);
            } else {
                reply.text("Hey **%s**, *%s* and thanks for adding me (highfive).  I will guide you to provide feedback for the " +
                    "trainings here itself so that you don't have to fill a form on Zoho anymore", firstName || "there", greetingMessage);
            }
            firebaseOperations.addUserSession(saveAddress);
            bot.send(reply);
        });
    } else {
        console.log(i18n.__('delete_bot'))
    }

});

/**
 * This function will return the greeting message according to the current time
 * @returns {*}
 */
function getDayTimings() {
    var currentDate = new Date();
    var curHr = currentDate.getHours();
    if (curHr < 12) {
        return 'Good Morning';
    } else if (curHr < 18) {
        return 'Good Afternoon';
    } else {
        return 'Good Evening';
    }
}


//=========================================================
// Bots Middleware
//=========================================================

// Anytime the major version is incremented any existing conversations will be restarted.
bot.use(builder.Middleware.dialogVersion({version: 1.0, resetCommand: /^reset/i}));


const logUserConversation = (header, event) => {
    console.log(header + event.text + ', user: ' + event.address.user.name);
};

// Middleware for logging
bot.use({
    receive: function (event, next) {
        console.log("Type", event.type);
        if(event.type==='message') {
            var userId = event.user.id.split(":")[1];
            var currentSavedDate = event.timestamp;
            var currentTime = new Date(currentSavedDate).getSeconds();
            var lastSaveDate = ls.get(userId);
            if (lastSaveDate === null) {
                lastSaveDate = 0;
            }
            var lastSavedTime = new Date(lastSaveDate).getSeconds();
            var diff = (currentTime - lastSavedTime);
            var timeDifference = Math.abs(Math.round(diff));
            console.log("Time: ", diff);
            if (timeDifference > 2) {
                logUserConversation('user sent: ', event);
                next();
            } else {
                sendProactiveMessageToNotifyUserActivity(event.address, i18n.__('too_fast_msg'));
            }
            ls.set(userId, currentSavedDate);
        }else if(event.type==='contactRelationUpdate') {
            logUserConversation('user sent: ', event);
            next();
        }

    },
    send: function (event, next) {
        logUserConversation('bot sent: ', event);
        next();
    }
});


//==========================================================
// dialogs
//==========================================================

bot.dialog("/", [
    function (session) {
        var username = session.message.user.name;
        session.userData.firstName = username.split(" ")[0];
        var userMessage = (session.message.text).toLowerCase();
        if (userMessage != 'start') {
            session.sendTyping();
            session.endDialog("Hey **%s**, what are you saying, Humka kuch samjh me nahi aa ra hai (shake). Please type **'Start'** to start filling the feedback", session.userData.firstName);
        } else {
            session.sendTyping();
            firebaseOperations.isFeedbackPendingForUser(username, function (isPendingFeedback) {
                if (isPendingFeedback) {
                    var trainingId, trainingName, attendeeId, isStarted = false;
                    firebaseOperations.getPendingFeedbackForUser(username, function (pendingFeedbackArray) {
                        var BreakException = {};
                        try {
                            pendingFeedbackArray.forEach(function (child) {
                                isStarted = child.val().isStarted;
                                trainingId = child.val().trainingId;
                                trainingName = child.val().trainingName;
                                attendeeId = child.val().attendeeId;
                                if (isStarted) {
                                    throw BreakException;
                                }
                            });
                        } catch (e) {
                            if (e !== BreakException) throw e;
                        }

                        session.userData.trainingId = trainingId;
                        session.userData.trainingName = trainingName;
                        session.userData.attendeeId = attendeeId;
                        session.sendTyping();

                        session.send("Shabaash! (monkey) (joy)" + "<br />" + i18n.__('welcome1_msg') + "<br /> <br />" + "Here are the questions for the session **'%s'**", trainingName);
                        session.send(i18n.__('tip_restart'));

                        questionGenerator.showTrainingFeedbackQuestions(bot, builder, session);
                        // session.beginDialog('startFeedbackQuestions');

                        firebaseOperations.updateStartedStatusOfPendingFeedback(true, attendeeId, trainingId);
                        firebaseOperations.updateLastSentMessageOfPendingFeedback(new Date().getTime(), attendeeId, trainingId);
                        console.log(username + " -> " + session.userData.trainingName + ", " + session.userData.trainingId);
                    });
                } else {
                    session.endDialog("You have no pending feedback yet. Enjoy!!!  (whistle)")
                }
            });
        }
    }

]);


// /**
//  * This method will start asking questions from user and will store the answer and pass to the next question
//  * Here we are using waterfall model of bot builder SDK
//  */
// bot.dialog('startFeedbackQuestions', [
//     function (session) {
//         session.userData['questionArray'] = new arraylist();
//         session.userData.questionArray.add(i18n.__("training_questions"));
//
//         customOperations.buildQuestionForFeedback(session, session.userData.questionArray[0], builder);
//         firebaseOperations.updateLastSentMessageOfPendingFeedback(new Date().getTime(), session.userData.attendeeId,
//             session.userData.trainingId);
//     },
//     function (session, results) {
//         session.sendTyping();
//         session.userData.questionArray[0].answer = results.response.entity;
//         customOperations.buildQuestionForFeedback(session, session.userData.questionArray[1], builder);
//         firebaseOperations.updateLastSentMessageOfPendingFeedback(new Date().getTime(), session.userData.attendeeId,
//             session.userData.trainingId);
//     },
//     function (session, results) {
//         session.sendTyping();
//         session.userData.questionArray[1].answer = results.response.entity;
//         customOperations.buildQuestionForFeedback(session, session.userData.questionArray[2], builder);
//         firebaseOperations.updateLastSentMessageOfPendingFeedback(new Date().getTime(), session.userData.attendeeId,
//             session.userData.trainingId);
//     },
//     function (session, results) {
//         session.userData.questionArray[2].answer = results.response.entity;
//         customOperations.buildQuestionForFeedback(session, session.userData.questionArray[3], builder);
//         firebaseOperations.updateLastSentMessageOfPendingFeedback(new Date().getTime(), session.userData.attendeeId,
//             session.userData.trainingId);
//
//     },
//     function (session, results) {
//         session.sendTyping();
//         session.userData.questionArray[3].answer = results.response.entity;
//         customOperations.buildQuestionForFeedback(session, session.userData.questionArray[4], builder);
//         firebaseOperations.updateLastSentMessageOfPendingFeedback(new Date().getTime(), session.userData.attendeeId,
//             session.userData.trainingId);
//     },
//     function (session, results) {
//         session.userData.questionArray[4].answer = results.response.entity;
//         customOperations.buildQuestionForFeedback(session, session.userData.questionArray[5], builder);
//         firebaseOperations.updateLastSentMessageOfPendingFeedback(new Date().getTime(), session.userData.attendeeId,
//             session.userData.trainingId);
//     },
//     function (session, results) {
//         session.userData.questionArray[5].answer = results.response.entity;
//         customOperations.buildQuestionForFeedback(session, session.userData.questionArray[6], builder);
//         firebaseOperations.updateLastSentMessageOfPendingFeedback(new Date().getTime(), session.userData.attendeeId,
//             session.userData.trainingId);
//
//     },
//     function (session, results) {
//         session.sendTyping();
//         session.userData.questionArray[6].answer = results.response.entity;
//         session.send(i18n.__('half_attempt_msg') + " Let's move to the next question");
//         customOperations.buildQuestionForFeedback(session, session.userData.questionArray[7], builder);
//         firebaseOperations.updateLastSentMessageOfPendingFeedback(new Date().getTime(), session.userData.attendeeId,
//             session.userData.trainingId);
//
//     },
//     function (session, results) {
//         session.userData.questionArray[7].answer = results.response.entity;
//         customOperations.buildQuestionForFeedback(session, session.userData.questionArray[8], builder);
//         firebaseOperations.updateLastSentMessageOfPendingFeedback(new Date().getTime(), session.userData.attendeeId,
//             session.userData.trainingId);
//
//     },
//     function (session, results) {
//         session.sendTyping();
//         session.userData.questionArray[8].answer = results.response.entity;
//         session.send("**Tip :** *Please type the answer*");
//         customOperations.buildQuestionForFeedback(session, session.userData.questionArray[9], builder);
//         firebaseOperations.updateLastSentMessageOfPendingFeedback(new Date().getTime(), session.userData.attendeeId,
//             session.userData.trainingId);
//
//     },
//     function (session, results) {
//         session.userData.questionArray[9].answer = results.response;
//         customOperations.buildQuestionForFeedback(session, session.userData.questionArray[10], builder);
//         firebaseOperations.updateLastSentMessageOfPendingFeedback(new Date().getTime(), session.userData.attendeeId,
//             session.userData.trainingId);
//
//     },
//     function (session, results) {
//         session.sendTyping();
//         session.userData.questionArray[10].answer = results.response;
//         customOperations.buildQuestionForFeedback(session, session.userData.questionArray[11], builder);
//         firebaseOperations.updateLastSentMessageOfPendingFeedback(new Date().getTime(), session.userData.attendeeId,
//             session.userData.trainingId);
//
//     },
//     function (session, results) {
//         session.userData.questionArray[11].answer = results.response;
//         session.send("You are almost there, one more to go." + "<br />" + "(bhangra) (fireworks)" + "<br />" + "Here is the final question");
//         customOperations.buildQuestionForFeedback(session, session.userData.questionArray[12], builder);
//         firebaseOperations.updateLastSentMessageOfPendingFeedback(new Date().getTime(), session.userData.attendeeId,
//             session.userData.trainingId);
//
//     },
//     function (session, results) {
//         session.sendTyping();
//         session.userData.questionArray[12].answer = results.response.entity;
//         builder.Prompts.choice(
//             session,
//             i18n.__('complete_all_ques_msg'),
//             i18n.__('submitDialogLabels'),
//             {
//                 listStyle: builder.ListStyle.button,
//                 retryPrompt: i18n.__('retry_prompt')
//             });
//         firebaseOperations.updateLastSentMessageOfPendingFeedback(new Date().getTime(), session.userData.attendeeId,
//             session.userData.trainingId);
//
//     },
//     function (session, results) {
//         customOperations.optionAfterCompletingFeedback(session, results);
//     }
// ]);


bot.dialog('submitResponse', [
    function (session) {
        submitFeedback(session);
    }
]);

// Dialog will show all the responded answer to the user before submitting, user can edit each answer from here.
bot.dialog('showFeedbackReview', [
    function (session) {
        session.send(i18n.__('response_header'));
        session.sendTyping();
        var response = "";
        for (var index = 0; index < session.userData.questionArray.length; index++) {
            var question = session.userData.questionArray[index].question;
            var answer = session.userData.questionArray[index].answer;
            var id = session.userData.questionArray[index].id;
            response = response + ' \n' + ('**' + id + '.** ' + question + ' <br />' + '**Your Feedback:** ' + answer + '<br />' + ' \n');
        }
        builder.Prompts.choice(
            session,
            response,
            i18n.__('optionDialogLabels'),
            {
                listStyle: builder.ListStyle.button,
                retryPrompt: i18n.__('retry_command_prompt')
            });
        firebaseOperations.updateLastSentMessageOfPendingFeedback(new Date().getTime(), session.userData.attendeeId,
            session.userData.trainingId);
    },
    function (session, results) {
        customOperations.doOperation(session, results);
    }
]);


bot.dialog('editing', [
    function (session, args) {
        if (args && args.reprompt) {
            builder.Prompts.text(session, "Please type 'edit (question number)' to edit the feedback. For example- **edit 1**")
        } else {
            builder.Prompts.text(session, "Please type 'edit (question number)' to edit the feedback. For example- **edit 1**");
        }
    },
    function (session, results) {
        try {
            var prefixCommand = results.response.split(" ")[0];
            prefixCommand = prefixCommand.toLowerCase();
            var selectOption = results.response.split(" ")[1];
            if (prefixCommand != "edit" || selectOption < 1 || selectOption > 13) {
                session.send(i18n.__("retry_command_edit")[0]);
                session.replaceDialog('editing', {reprompt: true});
            } else {
                var qNumber = selectOption;
                qNumber = --qNumber;
                session.userData.editQuestionNumber = qNumber;
                customOperations.buildQuestionForFeedback(session, session.userData.questionArray[qNumber], builder);
            }
        } catch (e) {
            session.send(i18n.__("retry_command_edit")[0]);
            session.replaceDialog('editing', {reprompt: true});
            console.log("Question not found");
        }
    },
    function (session, results) {
        var userAnswer;
        var editQuestionNumber = session.userData.editQuestionNumber;
        var questionObject = session.userData.questionArray[editQuestionNumber];
        var questionType = questionObject.question_type;
        if (questionType === 'choice') {
            userAnswer = results.response.entity;
        } else if (questionType === 'text') {
            userAnswer = results.response;
        }
        questionObject.answer = userAnswer;
        session.send(i18n.__('answer_update'), (++editQuestionNumber));
        builder.Prompts.choice(
            session,
            'What would you like to do next?',
            i18n.__('optionDialogLabels'),
            {
                listStyle: builder.ListStyle.button,
                retryPrompt: i18n.__('retry_command_prompt')
            });
        firebaseOperations.updateLastSentMessageOfPendingFeedback(new Date().getTime(), session.userData.attendeeId,
            session.userData.trainingId);

    },
    function (session, results) {
        customOperations.doOperation(session, results);
    }
]);


// feedback is started submit when this dialog gets invoke
bot.dialog('submit', function (session, args, next) {
    firebaseOperations.isFeedbackPendingForUser(session.message.user.name, function (isPendingFeedback) {
        if (isPendingFeedback) {
            submitFeedback(session);
        } else {
            session.endDialog("You have no pending feedback yet. Enjoy!!!  (whistle)")
        }
    });

})
    .triggerAction({
        matches: /^submit/i,
        onSelectAction: (session, args) => {
            // Add the help dialog to the dialog stack
            // (override the default behavior of replacing the stack)
            session.beginDialog(args.action, args);
        }
    });


function submitFeedback(session) {
    if (!(session.userData.questionArray)) {
        session.endDialog(i18n.__('not_started_msg'))
    } else {
        var length = session.userData.questionArray.length;
        for (var index = 0; index < length; index++) {
            var answer = session.userData.questionArray[index].answer;
            var id = session.userData.questionArray[index].id;
            if (answer === "") {
                session.endDialog(i18n.__("wait"), index);
                return;
            }
        }
        var username = session.message.user.name;
        session.send("Submitting feedback, Please wait...");
        session.sendTyping();
        var totalResponse = session.userData.questionArray;
        firebaseOperations.saveFeedbackToDB(session.userData.trainingId, username, session.userData.questionArray,
            session.userData.trainingName);
        console.log(username + "-> Submit" + session.userData.questionArray);

        var fields = ['id', 'question', 'answer'];
        var csv = json2csv({data: totalResponse, fields: fields});
        fs.writeFile("response/" + session.userData.firstName + ".csv", csv, function (err) {
            if (err) throw err;
            console.log('file saved');
        });
        customOperations.sendEmailToTMTeam(session, username, "Please check the feedback in attached file-: ", true, fs);
    }
}


bot.dialog('/delete', (session) => {
    session.sendTyping();
    deleteAllData(session);
    session.endDialog(i18n.__('session_reset_msg'));

})
    .triggerAction({
        matches: /restart/i,
        confirmPrompt: "This will wipe everything out. Are you sure?"
    });


//==========================================================
// helper functions
//==========================================================


/**
 * This method will clear the current session of the user or will delete local data
 * @param session
 */
function deleteAllData(session) {
    session.userData = {};
    session.dialogData = {};
}

/**
 * This method will check the time difference between the last sent message time and current time and send user a
 * message accordingly
 */
function checkForIdealCondition(address, lastSentMessage, trainingId, attendeeId, trainingName) {
    var currentDate = new Date();
    // var lastMessageSentDate = new Date(lastSentMessage);
    var diff = (currentDate.getTime() - lastSentMessage) / 1000;
    diff /= 60;
    console.log(Math.abs(Math.round(diff)));
    var timeDifference = Math.abs(Math.round(diff));
    if (timeDifference >= 4) {
        sendProactiveMessage(address, trainingName);
        lastSentMessage = new Date().getTime();
        firebaseOperations.updateLastSentMessageOfPendingFeedback(lastSentMessage, attendeeId, trainingId);
    }
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
                            msg.text("You have just attended the **'%s'** session. We request you to fill the feedback ASAP. " +
                                "Please type **'Start'** to start filling the feedback. :)", name);
                            bot.send(msg);
                        }
                    });
                }
            })
        })
    })
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
 * This method will send a warning message if user is typing too fast and want to break our BOT :)
 * @param address
 * @param message
 */
function sendProactiveMessageToNotifyUserActivity(address, message) {
    try {
        var name = address.user.name;
        var firstName = name.split(" ")[0];
        var msg = new builder.Message().address(address);
        msg.text(message, firstName);
        bot.send(msg);

    } catch (err) {
        console.log(err.message);
    }
}

/**
 * this method will get the address from the database and will send a message.
 * @param res
 */
function getAddressAndBroadcastMessage(req, res) {
    var url         =   req.url;
    var message     =   decodeURI(url.split("?")[1]);
    firebaseOperations.getUserSession(function (sessionArray) {
        sessionArray.forEach(function (snapshot) {
            var username    =   snapshot.val().address.user.name;
            var firstName   =   username.split(" ")[0];
            var address     =   snapshot.val().address;
            sendBroadcastToAllMembers(firstName, address, message);
        });
    });
    res.send('triggered');
    // next();
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
        var message =   "Hey **%s**, "+message;
        msg.text(message, username);
        msg.textLocale('en-US');
        bot.send(msg);

    } catch (err) {
        console.log(err.message);
    }
}


/**
 * This cron service will iterate the user data from the sesison table and will check that if any pending feedback is
 * available for that user, send a proactive message to that user
 */
function startCronToCheckPendingFeedback() {
    var taskForPendingFeedback = cron.schedule('0 */30 * * * *', function () {
        console.log('Running a task to check pending feedback');
        checkForPendingFeedback();
    }, false);
    taskForPendingFeedback.start();
}


module.exports = {

    getUniversalBotInstance: function () {
        return bot;
    },
    startCron: function () {
        startCronToCheckPendingFeedback();
    },
    getFirebaseObject: function () {
        return firebaseOperations;
    },
    sendBroadcast: function (req, res) {
        getAddressAndBroadcastMessage(req, res);
    }
};

