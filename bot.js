var builder = require('botbuilder');
var firebaseOperations = require('./firebase_operations.js');
var customOperations = require('./custom.js');
var json2csv = require('json2csv');
var fs = require('fs');
var arraylist = require('arraylist');
var cron = require('node-cron');
var LocalStorage = require('node-localstorage').LocalStorage;
localStorage = new LocalStorage('./scratch');
let i18n = require("i18n");


i18n.configure({
    locales: ['en', 'de'],
    directory: __dirname + '/locales'
});

const connector = new builder.ChatConnector({
    appId: process.env.MICROSOFT_APP_ID,
    appPassword: process.env.MICROSOFT_APP_PASSWORD
});

const bot = new builder.UniversalBot(connector);
var question, answer;

bot.on('contactRelationUpdate', function (message) {
    if (message.action === 'add') {
        addBotToUserSkypeContact(message);
    } else {
        console.log(i18n.__('delete_bot'))
    }
});


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
        if (event.type === 'message' && !(event.text.startsWith("Edited previous message:"))) {
            var timeDifference = calculateTimeDifferenceBetweenEvents(event);
            if (timeDifference > 3) {
                logUserConversation('user sent: ', event);
                next();
            } else {
                sendProactiveMessageToNotifyUserActivity(event.address, i18n.__('too_fast_msg'));
            }
        } else if (event.type === 'contactRelationUpdate') {
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
        session.sendTyping();
        if (userMessage != 'start') {
            session.endDialog(i18n.__('web_link'), "[Click here](https://www.google.com/search?q=" + userMessage + ")")
        } else {
            checkForPendingFeedback(username, session);
        }
    }
]);


bot.dialog('submitResponse', [
    function (session) {
        validateResponse(session);
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
            response = response + ' \n' + ('**' + id + '.** ' + question + ' <br />' + '**Your Response:** ' + answer + '<br />' + ' \n');
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
            builder.Prompts.text(session, i18n.__('edit_command_hint'))
        } else {
            builder.Prompts.text(session, i18n.__('edit_command_hint'));
        }
    },
    function (session, results) {
        try {
            var editCommand = results.response;
            if (editCommand < 1 || editCommand > 13) {
                session.send(i18n.__("retry_command_edit")[0]);
                session.replaceDialog('editing', {reprompt: true});
            } else {
                var qNumber = editCommand;
                qNumber = --qNumber;
                session.userData.editQuestionNumber = qNumber;
                customOperations.buildQuestionForFeedback(session, session.userData.questionArray[qNumber], builder);
            }
        } catch (e) {
            session.send(i18n.__("retry_command_edit")[0]);
            session.replaceDialog('editing', {reprompt: true});
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
            i18n.__('what_next'),
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
            validateResponse(session);
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


/**
 * this function will submit the response to the TM team
 * @param session      session of the current user
 */
function submitUserResponse(session) {
    session.sendTyping();
    var username = session.message.user.name;
    session.send(i18n.__('sub_wait'));
    var totalResponse = session.userData.questionArray;
    firebaseOperations.saveFeedbackToDB(session.userData.trainingId, username, session.userData.questionArray,
        session.userData.trainingName);
    var fields = ['id', 'question', 'answer'];
    var csv = json2csv({data: totalResponse, fields: fields});
    fs.writeFile("response/" + session.userData.firstName + ".csv", csv, function (err) {
        if (err) throw err;
        console.log('file saved');
    });
    customOperations.sendEmailToTMTeam(session, username, i18n.__('subject_email'), true, fs);
}

/**
 * this function will validate the response that user has submitted
 * @param session     session of the current user
 */
function validateResponse(session) {
    if (!(session.userData.questionArray)) {
        session.endDialog(i18n.__('not_started_msg'))
    } else {
        var length = session.userData.questionArray.length;
        for (var index = 0; index < length; index++) {
            var answer = session.userData.questionArray[index].answer;
            var id = session.userData.questionArray[index].id;
            if (answer === "") {
                session.endDialog(i18n.__("wait"), index, length);
                return;
            }
        }
        submitUserResponse(session);
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


// bot.customAction({
//     matches: /okay|k|ok/gi,
//     onSelectAction: (session, args, next) => {
//         // Set reminder...
//         session.send("Cool, Have a great day. :)");
//     }
// })


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
 * This function will first check if skype name matched in our database or not and then send a respective message. If not
 * found then send a message to contact with support team else send a welcome message
 * @param message
 */
function addBotToUserSkypeContact(message) {
    var username = message.user ? message.user.name : "Unknown"
    var userId = message.user.id.split(":")[1]

    console.log("UserId", userId)
    localStorage.setItem(userId, message.timestamp)
    console.log("UserId", localStorage.getItem(userId))

    var firstName = username.split(" ")[0]
    var saveAddress = message.address
    var localTimeStamp = message.timeStamp
    // var greetingMessage = getDayTimings(localTimeStamp)
    var reply = new builder.Message()
        .address(message.address);
    firebaseOperations.getUserName(username, function (name) {
        if (name === '') {
            reply.text(i18n.__('user_not_found'), firstName);
        } else {
            reply.text(i18n.__('user_found'), name || "there");
        }
        firebaseOperations.addUserSession(saveAddress);
        bot.send(reply);
    });
}


/**
 * This function will check the type of training session and then will start accordingly.
 * @param session           user session
 * @param trainingName      name of the training
 * @param trainingType      type of the training
 * @param attendeeId        id of the attendeed
 * @param trainingId        id of the training
 * @param username          current user name
 */
function startTrainingBasedOnType(session, trainingName, trainingType, attendeeId, trainingId, username) {
    session.send(i18n.__("well_done") + "<br />" + i18n.__('welcome1_msg') + "<br /> <br />" + "Here are the questions for the session **'%s'**", trainingName);
    session.send(i18n.__('tip_restart'));

    switch (trainingType) {
        case 1: // for trainings
            session.beginDialog('startTrainingFeedback');
            break;
        case 2: // round table
            session.beginDialog('startRoundTableFeedback');
            break;
        case 3: // workshop
            session.beginDialog('startWorkshopFeedback');
            break;
    }

    firebaseOperations.updateStartedStatusOfPendingFeedback(true, attendeeId, trainingId);
    firebaseOperations.updateLastSentMessageOfPendingFeedback(new Date().getTime(), attendeeId, trainingId);
    console.log(username + " -> " + session.userData.trainingName + ", " + session.userData.trainingId);
}

/**
 * This function will get the pending training from the database and will show the user along with the questions
 * @param username    name of the current user
 * @param session     session of the current user
 */
function assignTrainingFeedbackToUser(username, session) {
    var trainingId, trainingName, attendeeId, isStarted = false, trainingType;
    firebaseOperations.getPendingFeedbackForUser(username, function (pendingFeedbackArray) {
        var BreakException = {};
        try {
            pendingFeedbackArray.forEach(function (child) {
                isStarted = child.val().isStarted;
                trainingId = child.val().trainingId;
                trainingName = child.val().trainingName;
                trainingType = child.val().trainingType;
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
        session.userData.trainingType = trainingType;

        startTrainingBasedOnType(session, trainingName, trainingType, attendeeId, trainingId, username);
    });
}
/**
 * This function will check for any pending feedback for the current user
 * @param username     name of the current user
 * @param session      session of the current user
 */
function checkForPendingFeedback(username, session) {
    session.sendTyping();
    firebaseOperations.isFeedbackPendingForUser(username, function (isPendingFeedback) {
        if (isPendingFeedback) {
            assignTrainingFeedbackToUser(username, session);
        } else {
            session.endDialog(i18n.__('no_pending_feedback'))
        }
    });
}

/**
 * This function will return the greeting message according to the current time
 * @returns {*}
 */
function getDayTimings(timeStamp) {
    var currentDate = new Date(timeStamp);
    var curHr = currentDate.getHours();
    if (curHr < 12) {
        return 'Good Morning';
    } else if (curHr < 18) {
        return 'Good Afternoon';
    } else {
        return 'Good Evening';
    }
}

/**
 * this function will calculate the time between two events and save in local storage
 * @param event
 * @returns {{diff: number, timeDifference: number}}
 */
function calculateTimeDifferenceBetweenEvents(event) {
    var userId = event.user.id.split(":")[1];
    console.log("Timestamp", event.timestamp)
    var currentSavedDate = event.timestamp;
    console.log("currentSaveDate", currentSavedDate)
    var currentTime = new Date(currentSavedDate);
    console.log("currentTime", currentTime)
    var lastSaveDate = localStorage.getItem(userId);
    console.log("LastSaveDate", lastSaveDate)
    if (lastSaveDate === null) {
        lastSaveDate = 0;
    }
    var lastSavedTime = new Date(lastSaveDate);
    console.log("LastSaveTime", lastSavedTime)

    var diff = (currentTime - lastSavedTime);
    var timeDifferenceInMillis = Math.abs(Math.round(diff));
    console.log("Millis: ", timeDifferenceInMillis);

    var seconds = timeDifferenceInMillis / 1000
    console.log("Seconds: ", seconds);

    localStorage.setItem(userId, currentSavedDate);
    console.log("newTime", currentSavedDate)
    return seconds;
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

//---------------------------------------- questions -------------------------------------------------------------------//

/**
 * This method will start asking questions from user and will store the answer and pass to the next question
 * Here we are using waterfall model of bot builder SDK
 */
bot.dialog('startTrainingFeedback', [
    function (session) {
        // session.send(i18n.__('tip_subjective'));
        session.userData['questionArray'] = new arraylist();
        session.userData.questionArray.add(i18n.__("training_questions"));
        customOperations.buildQuestionForFeedback(session, session.userData.questionArray[0], builder);
        firebaseOperations.updateLastSentMessageOfPendingFeedback(new Date().getTime(), session.userData.attendeeId,
            session.userData.trainingId);
    },
    function (session, results) {
        session.sendTyping();
        processUserResponse(session, results, 0, 0);
    },
    function (session, results) {
        session.sendTyping();
        // session.send(i18n.__('half_attempt_msg'));
        processUserResponse(session, results, 1, 0);
    },
    function (session, results) {
        session.sendTyping();
        processUserResponse(session, results, 2, 0);
    },
    function (session, results) {
        session.sendTyping();
        session.send(i18n.__('final_question_message'));
        processUserResponse(session, results, 3, 1);
    },
    function (session, results) {
        session.sendTyping();
        session.sendTyping();
        session.userData.questionArray[4].answer = results.response;
        builder.Prompts.choice(
            session,
            i18n.__('complete_all_ques_msg'),
            i18n.__('submitDialogLabels'),
            {
                listStyle: builder.ListStyle.button,
                retryPrompt: i18n.__('retry_prompt')
            });
        firebaseOperations.updateLastSentMessageOfPendingFeedback(new Date().getTime(), session.userData.attendeeId,
            session.userData.trainingId);
    },
    function (session, results) {
        customOperations.optionAfterCompletingFeedback(session, results);
    }
]);


/**
 * This method will start asking workshop questions from user and will store the answer and pass to the next question
 * Here we are using waterfall model of bot builder SDK
 */
bot.dialog('startWorkshopFeedback', [
    function (session) {
        session.userData['questionArray'] = new arraylist();
        session.userData.questionArray.add(i18n.__("workshop_questions"));
        customOperations.buildQuestionForFeedback(session, session.userData.questionArray[0], builder);
        firebaseOperations.updateLastSentMessageOfPendingFeedback(new Date().getTime(), session.userData.attendeeId,
            session.userData.trainingId);
    },
    function (session, results) {
        session.sendTyping();
        processUserResponse(session, results, 0, 0);
    },
    function (session, results) {
        session.sendTyping();
        processUserResponse(session, results, 1, 0);
    },
    function (session, results) {
        session.sendTyping();
        session.send(i18n.__('final_question_message'));
        processUserResponse(session, results, 2, 0);
    },
    function (session, results) {
        session.sendTyping();
        session.userData.questionArray[3].answer = results.response;
        builder.Prompts.choice(
            session,
            i18n.__('complete_all_ques_msg'),
            i18n.__('submitDialogLabels'),
            {
                listStyle: builder.ListStyle.button,
                retryPrompt: i18n.__('retry_prompt')
            });
        firebaseOperations.updateLastSentMessageOfPendingFeedback(new Date().getTime(), session.userData.attendeeId,
            session.userData.trainingId);

    },
    function (session, results) {
        customOperations.optionAfterCompletingFeedback(session, results);
    }
]);


/**
 * this function will process the response and will show the next question to the user
 * @param session    session of the current user
 * @param results    response of the previous request
 * @param index      index of the question
 * @param type       type of the question
 */
function processUserResponse(session, results, index, type) {
    if (type === 1) {
        session.userData.questionArray[index].answer = results.response.entity;
    } else {
        session.userData.questionArray[index].answer = results.response;
    }
    customOperations.buildQuestionForFeedback(session, session.userData.questionArray[index + 1], builder);
    firebaseOperations.updateLastSentMessageOfPendingFeedback(new Date().getTime(), session.userData.attendeeId,
        session.userData.trainingId);
}


//------------------------------------------------------- export modules -----------------------------------------------//
module.exports = {
    getUniversalBotInstance: function () {
        return bot;
    },
    getBuilderObject: function () {
        return builder;
    },
    getFirebaseObject: function () {
        return firebaseOperations;
    }

};