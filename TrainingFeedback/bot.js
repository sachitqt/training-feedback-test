var builder = require('botbuilder');
var nodemailer = require('nodemailer');
var firebaseOperations = require('./firebase_operations.js');
let i18n = require("i18n");
var json2csv = require('json2csv');
var fs = require('fs');
var arraylist = require('arraylist');
var cron = require('node-cron');


i18n.configure({
    locales: ['en', 'de'],
    directory: __dirname + '/locales'
});

const connector = new builder.ChatConnector({
    appId: process.env.MICROSOFT_APP_ID,
    appPassword: process.env.MICROSOFT_APP_PASSWORD
});

// // Create bot and default message handler
const bot = new builder.UniversalBot(connector);


var question, answer;
var taskForPendingFeedback;


// log any bot errors into the console
bot.on('error', function (e) {
    console.log('And error ocurred', e);
});

bot.on('contactRelationUpdate', function (message) {
    if (message.action === 'add') {
        taskForPendingFeedback.start();
        var username = message.user ? message.user.name : "Unknown";
        var firstName = username.split(" ")[0];
        var saveAddress = message.address;
        var greetingMessage = getDayTimings();
        var reply = new builder.Message()
            .address(message.address)
            .text("Hey **%s**, *%s* and thanks for adding me (highfive).  I will guide you to provide feedback for the " +
                "trainings here itself so that you don't have to fill a form on Zoho anymore", firstName || "there", greetingMessage);
        bot.send(reply);
        firebaseOperations.addUserSession(username, saveAddress);

    } else {
        taskForPendingFeedback.stop();
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


//==========================================================
// dialogs
//==========================================================

bot.dialog("/", [
    function (session) {
        session.sendTyping();
        var username = session.message.user.name;
        if (username == undefined) {
            username = "there";
        }
        var firstName = username.split(" ")[0];
        session.userData.firstName = firstName;
        var userMessage = (session.message.text).toLowerCase();
        if (userMessage != 'start') {
            session.endDialog("Hey **%s**, what are you saying, Humka kuch samjh me nahi aa ra hai (shake). Please type **'Start'** to start filling the feedback", session.userData.firstName);
        } else {
            firebaseOperations.isFeedbackPendingForUser(username, function (isPendingFeedback) {
                if (isPendingFeedback) {
                    var trainingId, trainingName, attendeeId;
                    firebaseOperations.getPendingFeedbackForUser(username, function (pendingFeedbackArray) {
                        pendingFeedbackArray.forEach(function (child) {
                            trainingId = child.val().trainingId;
                            trainingName = child.val().trainingName;
                            attendeeId = child.val().attendeeId;
                        });
                        session.userData.trainingId = trainingId;
                        session.userData.trainingName = trainingName;
                        session.userData.attendeeId = attendeeId;

                        firebaseOperations.updateStartedStatusOfPendingFeedback(true, attendeeId, trainingId);
                        firebaseOperations.updateLastSentMessageOfPendingFeedback(new Date().getTime(), attendeeId, trainingId);
                        console.log(username + " -> " + session.userData.trainingName + ", " + session.userData.trainingId);

                        session.send('Shabaash! (monkey) (joy)');
                        session.send(i18n.__('welcome1_msg'));
                        // session.send(i18n.__('welcome2_msg'));
                        // session.send(i18n.__('question_start_msg'));
                        session.beginDialog('startFeedbackQuestions');

                        // builder.Prompts.choice(
                        //     session,
                        //     i18n.__('choose_start_option'),
                        //     i18n.__('dialogLabels'),
                        //     {
                        //         listStyle: builder.ListStyle.button,
                        //         retryPrompt: i18n.__('retry_prompt')
                        //     });
                    });
                } else {
                    session.endDialog("You have no pending feedback yet. Enjoy!!!  (whistle)")
                }
            })
        }
    }
    // function (session, results) {
    //     if (results.response) {
    //         firebaseOperations.updateLastSentMessageOfPendingFeedback(new Date().getTime(), session.userData.attendeeId,
    //             session.userData.trainingId);
    //         var selectedOptionIndex = results.response.index;
    //         switch (selectedOptionIndex) {
    //             case 0:
    //                 session.send('Shabaash! (monkey) (joy)');
    //                 session.send(i18n.__('question_start_msg'));
    //                 session.beginDialog('startFeedbackQuestions');
    //                 break;
    //
    //             case 1:
    //                 session.beginDialog('notFillingFeedback');
    //                 break;
    //
    //             default:
    //                 session.send(i18n.__('no_option_found_error'));
    //                 break;
    //         }
    //
    //     } else {
    //         session.send(i18n.__('error_msg'));
    //     }
    // }
]);


/**
 * This method will start asking questions from user and will store the answer and pass to the next question
 * Here we are using waterfall model of bot builder SDK
 */
bot.dialog('startFeedbackQuestions', [
    function (session) {
        firebaseOperations.updateLastSentMessageOfPendingFeedback(new Date().getTime(), session.userData.attendeeId,
            session.userData.trainingId);
        session.userData['questionArray'] = new arraylist();
        session.userData.questionArray.add(i18n.__("questions"));
        session.send("**Tip :** *Please select or type the option*");
        buildQuestionsAndOptions(session, session.userData.questionArray[0]);
    },
    function (session, results) {

        firebaseOperations.updateLastSentMessageOfPendingFeedback(new Date().getTime(), session.userData.attendeeId,
            session.userData.trainingId);
        var userAnswer = results.response.entity;
        var questionObject = session.userData.questionArray[0];
        questionObject.answer = userAnswer;
        buildQuestionsAndOptions(session, session.userData.questionArray[1]);
    },
    function (session, results) {
        firebaseOperations.updateLastSentMessageOfPendingFeedback(new Date().getTime(), session.userData.attendeeId,
            session.userData.trainingId);
        var userAnswer = results.response.entity;
        var questionObject = session.userData.questionArray[1];
        questionObject.answer = userAnswer;
        buildQuestionsAndOptions(session, session.userData.questionArray[2]);
    },
    function (session, results) {
        firebaseOperations.updateLastSentMessageOfPendingFeedback(new Date().getTime(), session.userData.attendeeId,
            session.userData.trainingId);
        var userAnswer = results.response.entity;
        var questionObject = session.userData.questionArray[2];
        questionObject.answer = userAnswer;
        buildQuestionsAndOptions(session, session.userData.questionArray[3]);
    },
    function (session, results) {
        firebaseOperations.updateLastSentMessageOfPendingFeedback(new Date().getTime(), session.userData.attendeeId,
            session.userData.trainingId);
        var userAnswer = results.response.entity;
        var questionObject = session.userData.questionArray[3];
        questionObject.answer = userAnswer;
        buildQuestionsAndOptions(session, session.userData.questionArray[4]);
    },
    function (session, results) {
        firebaseOperations.updateLastSentMessageOfPendingFeedback(new Date().getTime(), session.userData.attendeeId,
            session.userData.trainingId);
        var userAnswer = results.response.entity;
        var questionObject = session.userData.questionArray[4];
        questionObject.answer = userAnswer;
        buildQuestionsAndOptions(session, session.userData.questionArray[5]);
    },
    function (session, results) {
        firebaseOperations.updateLastSentMessageOfPendingFeedback(new Date().getTime(), session.userData.attendeeId,
            session.userData.trainingId);
        var userAnswer = results.response.entity;
        var questionObject = session.userData.questionArray[5];
        questionObject.answer = userAnswer;
        buildQuestionsAndOptions(session, session.userData.questionArray[6]);
    },
    function (session, results) {
        session.sendTyping();
        firebaseOperations.updateLastSentMessageOfPendingFeedback(new Date().getTime(), session.userData.attendeeId,
            session.userData.trainingId);
        var userAnswer = results.response.entity;
        var questionObject = session.userData.questionArray[6];
        questionObject.answer = userAnswer;
        session.send(i18n.__('half_attempt_msg'));
        session.send("Next question");
        buildQuestionsAndOptions(session, session.userData.questionArray[7]);
    },
    function (session, results) {
        firebaseOperations.updateLastSentMessageOfPendingFeedback(new Date().getTime(), session.userData.attendeeId,
            session.userData.trainingId);
        var userAnswer = results.response.entity;
        var questionObject = session.userData.questionArray[7];
        questionObject.answer = userAnswer;
        buildQuestionsAndOptions(session, session.userData.questionArray[8]);
    },
    function (session, results) {
        firebaseOperations.updateLastSentMessageOfPendingFeedback(new Date().getTime(), session.userData.attendeeId,
            session.userData.trainingId);
        var userAnswer = results.response.entity;
        var questionObject = session.userData.questionArray[8];
        questionObject.answer = userAnswer;
        session.send("**Tip :** *Please type the answer*");
        buildQuestionsAndOptions(session, session.userData.questionArray[9]);
    },
    function (session, results) {
        firebaseOperations.updateLastSentMessageOfPendingFeedback(new Date().getTime(), session.userData.attendeeId,
            session.userData.trainingId);
        var userAnswer = results.response;
        var questionObject = session.userData.questionArray[9];
        questionObject.answer = userAnswer;
        buildQuestionsAndOptions(session, session.userData.questionArray[10]);
    },
    function (session, results) {
        firebaseOperations.updateLastSentMessageOfPendingFeedback(new Date().getTime(), session.userData.attendeeId,
            session.userData.trainingId);
        var userAnswer = results.response;
        var questionObject = session.userData.questionArray[10];
        questionObject.answer = userAnswer;
        buildQuestionsAndOptions(session, session.userData.questionArray[11]);
    },
    function (session, results) {
        session.sendTyping();
        firebaseOperations.updateLastSentMessageOfPendingFeedback(new Date().getTime(), session.userData.attendeeId,
            session.userData.trainingId);
        var userAnswer = results.response;
        var questionObject = session.userData.questionArray[11];
        questionObject.answer = userAnswer;
        session.send("You are almost there, one more to go.");
        session.send("(bhangra) (fireworks)");
        session.send("Here is the final question ");
        buildQuestionsAndOptions(session, session.userData.questionArray[12]);
    },
    function (session, results) {
        firebaseOperations.updateLastSentMessageOfPendingFeedback(new Date().getTime(), session.userData.attendeeId,
            session.userData.trainingId);
        var userAnswer = results.response.entity;
        var questionObject = session.userData.questionArray[12];
        questionObject.answer = userAnswer;
        builder.Prompts.choice(
            session,
            i18n.__('complete_all_ques_msg'),
            i18n.__('submitDialogLabels'),
            {
                listStyle: builder.ListStyle.button,
                retryPrompt: i18n.__('retry_prompt')
            });
    },
    function (session, results) {
        selectOptionAfterCompletingAnswer(session, results);
    }
]);


// Dialog that will ask user the reason of not filling the feedback
bot.dialog('notFillingFeedback', [
    function (session) {
        firebaseOperations.updateLastSentMessageOfPendingFeedback(new Date().getTime(), session.userData.attendeeId,
            session.userData.trainingId);
        session.send("(kya) :^)");
        builder.Prompts.text(session, session.userData.firstName + ", " + i18n.__('reason_msg'));
    },
    function (session, results) {
        var username = session.message.user.name;
        session.dialogData.notFillingFeedbackReason = results.response;
        var response = session.dialogData.notFillingFeedbackReason;
        firebaseOperations.deleteUserPendingFeedback(session.userData.trainingId, username);
        console(username + " -> Delete" + session.userData.trainingId);
        session.send("Submitting response, Please wait...");
        session.sendTyping();
        sendEmail(session, username + "- " + i18n.__('notSubmitting'), "Here is the reason-: " + response, false);
    }
]);


bot.dialog('submitResponse', [
    function (session) {
        submitAllResponse(session);
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
            i18n.__('edit_options'),
            {
                listStyle: builder.ListStyle.none,
                retryPrompt: i18n.__('retry_command_edit')
            });
        session.send("Please type 'edit (question number)' to edit the response. For example- **edit 1** or **'submit'** to submit all responses");
        firebaseOperations.updateLastSentMessageOfPendingFeedback(new Date().getTime(), session.userData.attendeeId,
            session.userData.trainingId);
    },
    function (session, results) {
        if (results.response.entity == "submit") {
            submitAllResponse(session);
            return;
        }
        var selectOption = results.response.entity.split(" ");
        var qNumber = selectOption[1];
        qNumber = --qNumber;
        session.userData.editQuestionNumber = qNumber;
        buildQuestionsAndOptions(session, session.userData.questionArray[qNumber]);
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
            i18n.__('submitDialogLabels'),
            {
                listStyle: builder.ListStyle.button,
                retryPrompt: i18n.__('retry_command_prompt')
            });
        firebaseOperations.updateLastSentMessageOfPendingFeedback(new Date().getTime(), session.userData.attendeeId,
            session.userData.trainingId);

    },
    function (session, results) {
        selectOptionAfterCompletingAnswer(session, results);
    }
]);

// The dialog stack is cleared and this dialog is invoked when the user enters 'help'.
// bot.dialog('help', function (session, args, next) {
//     session.endDialog('Global commands that are available anytime: %s', i18n.__('help_msg'));
// })
//     .triggerAction({
//         matches: /^help$/i,
//         onSelectAction: (session, args, next) => {
//             // Add the help dialog to the dialog stack
//             // (override the default behavior of replacing the stack)
//             session.beginDialog(args.action, args);
//         }
//     });


// The dialog stack is cleared and this dialog is invoked when the user enters 'help'.
bot.dialog('submit', function (session, args, next) {
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
        submitAllResponse(session);
    }
})
    .triggerAction({
        matches: /^submit/i,
        onSelectAction: (session, args, next) => {
            // Add the help dialog to the dialog stack
            // (override the default behavior of replacing the stack)
            session.beginDialog(args.action, args);
        }
    });


bot.dialog('/delete', (session) => {
    deleteAllData(session);
    session.endDialog(i18n.__('session_reset_msg'));

})
    .triggerAction({
        matches: /restart/i,
        confirmPrompt: "This will wipe everything out. Are you sure?"
    });

bot.dialog('/done', (session) => {
    session.endDialog('You are done with editing');
})
    .triggerAction({
        matches: /done/i
    });


//==========================================================
// helper functions
//==========================================================


/**
 * This method will send an email with the response as CSV file
 * @param session
 * @param subject
 * @param text
 * @param feedback
 */
function sendEmail(session, subject, text, feedback) {

    var transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: 'grubscrub22@gmail.com',
            pass: 'grubscrub@22'
        }
    });

    var mailOptions;

    if (feedback) {
        mailOptions = {
            from: 'grubscrub22@gmail.com',
            to: 'sachit.wadhawan@quovantis.com',
            subject: subject,
            text: text,
            attachments: [{
                filename: session.message.user.name + '.csv',
                path: "response/" + session.message.user.name + ".csv"
            }]
        };
    } else {
        mailOptions = {
            from: 'grubscrub22@gmail.com',
            to: 'sachit.wadhawan@quovantis.com',
            subject: subject,
            text: text
        };
    }
    transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
            console.log(error);
            session.send(i18n.__('mail_not_sent_msg'));
        } else {
            console.log('Email sent: ' + info.response);
            session.send(i18n.__('mail_sent_msg'));
            session.send("Thanks **%s** for filling your feedback (bow)", session.userData.firstName);
            // fs.unlinkSync("response/" + session.message.user.name + ".csv");
        }
        transporter.close();
        deleteAllData(session);
        session.endDialog();
    });
}


/**
 * This method will submit all response to the server, also will make a CSV file and send it to the TM team
 * @param session
 */
function submitAllResponse(session) {
    var username = session.message.user.name;
    session.send("Submitting feedback, Please wait...");
    session.sendTyping();
    var totalResponse = session.userData.questionArray;

    // firebaseOperations.saveFeedbackToDB(session.userData.trainingId, username, session.userData.questionArray,
    //     session.userData.trainingName);
    console.log(username + "-> Submit" + session.userData.questionArray);

    var fields = ['id', 'question', 'answer'];
    var csv = json2csv({data: totalResponse, fields: fields});
    fs.writeFile("response/" + session.message.user.name + ".csv", csv, function (err) {
        if (err) throw err;
        console.log('file saved');
    });
    sendEmail(session, username + "- " + i18n.__('subject_feedback'), "Please check the response in attached file-: ", true);
}


/**
 * this method is used to build the questions with an options
 * @param session
 * @param questionObject
 */
function buildQuestionsAndOptions(session, questionObject) {
    var question = questionObject.question;
    var options = questionObject.options;
    var questionsType = questionObject.question_type;
    var id = questionObject.id;
    if (questionsType === 'choice') {
        builder.Prompts.choice(
            session,
            id + ". " + question,
            options,
            {
                listStyle: builder.ListStyle.button,
                retryPrompt: i18n.__('retry_prompt')
            });
    } else if (questionsType === 'text') {
        builder.Prompts.text(session, id + ". " + question);
    }
}


/**
 * This method will call once user has submitted all the response, there will be two options, submit and review.
 * The selection will navigate user to the corresponding dialog
 * @param session
 * @param results
 */
function selectOptionAfterCompletingAnswer(session, results) {
    if (results.response) {
        var selectedOptionIndex = results.response.index;
        switch (selectedOptionIndex) {
            case 0:
                session.beginDialog("submitResponse");
                break;

            case 1:
                session.beginDialog("showFeedbackReview");
                break;

            default:
                break;

        }

    }
}

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
            var username = snapshot.val().username;
            var address = snapshot.val().address;
            firebaseOperations.isFeedbackPendingForUser(username, function (isPendingFeedback) {
                if (isPendingFeedback) {
                    var name, isStarted, lastSentMessage, trainingId, attendeeId, trainerName;
                    firebaseOperations.getPendingFeedbackForUser(username, function (pendingFeedbackArray) {
                        pendingFeedbackArray.forEach(function (child) {
                            name = child.val().trainingName;
                            isStarted = child.val().isStarted;
                            lastSentMessage = child.val().lastSentMessage;
                            trainingId = child.val().trainingId;
                            attendeeId = child.val().attendeeId;
                        });
                        if (!isStarted) {
                            var msg = new builder.Message().address(address);
                            msg.text("You have just attended the **'%s'** session. We request you to fill the feedback ASAP. " +
                                "Please type **'Start'** to start filling the feedback. :)", name);
                            bot.send(msg);
                        } else {
                            checkForIdealCondition(address, lastSentMessage, trainingId, attendeeId, name);
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
 * this method will get the address from the database and will send a message.
 * @param res
 * @param next
 */
function getAddressAndBroadcastMessage(res, next) {
    firebaseOperations.getUserSession(function (sessionArray) {
        sessionArray.forEach(function (snapshot) {
            var username = snapshot.val().username;
            var firstName = username.split(" ")[0];
            var address = snapshot.val().address;
            sendBroadcastToAllMembers(firstName, address);
        });
    });
    res.send('triggered');
    next();
}


/**
 * This method will broadcast a message to all the member connected with bot
 * @param username
 * @param address
 */
function sendBroadcastToAllMembers(username, address) {
    try {
        var msg = new builder.Message().address(address);
        var message = "Hey **%s**, How was your experience so far. If you got any issue, please contact Sachit or Lipika."
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
    taskForPendingFeedback = cron.schedule('*/1 * * * *', function () {
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
    sendBroadcast: function (res, next) {
        getAddressAndBroadcastMessage(res, next);
    }
}