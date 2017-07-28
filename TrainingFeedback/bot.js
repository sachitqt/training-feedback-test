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


var username = 'Unknown';
var firstName;
var saveAddress, question, answer;
var lastSentMessage;
var isUserStartFilling = false;
var trainingId;
var trainingName;
var taskForPendingFeedback, taskForIdealState;


// log any bot errors into the console
bot.on('error', function (e) {
    console.log('And error ocurred', e);
});

bot.on('contactRelationUpdate', function (message) {
    if (message.action === 'add') {
        taskForPendingFeedback.start();
        username = message.user ? message.user.name : "Unknown";
        firstName = username.split(" ")[0];
        saveAddress = message.address;
        var greetingMessage =   getDayTimings();
        var reply = new builder.Message()
            .address(message.address)
            .text("Hey **%s**, *%s* and thanks for adding me (highfive).  I will guide you to provide feedback for the " +
                "trainings here itself so that you don't have to fill a form on Zoho anymore", store.get('firstname') || "there", greetingMessage);
        bot.send(reply);

    } else {
        isUserStartFilling = false;
        taskForIdealState.stop();
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
        saveAddress = session.message.address;
        username = saveAddress.user.name;
        var userMessage = (session.message.text).toLowerCase();
        if (userMessage != 'go') {
            session.endDialog("Hey %s, what are you saying, Humka kuch samjh me nahi aa ra hai (shake). Please type **'go'** to start filling the feedback", firstName);
        } else {
            firebaseOperations.isFeedbackPendingForUser(username, function (isPendingFeedback) {
                if (isPendingFeedback) {
                    lastSentMessage = session.message.localTimestamp;
                    taskForIdealState.start();
                    isUserStartFilling = true;
                    session.send(i18n.__('welcome1_msg'));
                    session.send(i18n.__('welcome2_msg'));
                    builder.Prompts.choice(
                        session,
                        i18n.__('choose_start_option'),
                        i18n.__('dialogLabels'),
                        {
                            listStyle: builder.ListStyle.button,
                            retryPrompt: i18n.__('retry_prompt')
                        });
                } else {
                    session.endDialog("You have no pending feedback yet. Enjoy!!!  (whistle)")
                }
            })
        }
    },
    function (session, results) {
        if (results.response) {
            lastSentMessage = session.message.localTimestamp;
            var selectedOptionIndex = results.response.index;
            switch (selectedOptionIndex) {
                case 0:
                    session.send('Shabaash! (monkey) (joy)');
                    session.send(i18n.__('question_start_msg'));
                    session.beginDialog('startFeedbackQuestions');
                    break;

                case 1:
                    session.beginDialog('notFillingFeedback');
                    break;

                default:
                    session.send(i18n.__('no_option_found_error'));
                    break;
            }

        } else {
            session.send(i18n.__('error_msg'));
        }
    }
]);


/**
 * This method will start asking questions from user and will store the answer and pass to the next question
 * Here we are using waterfall model of bot builder SDK
 */
bot.dialog('startFeedbackQuestions', [
    function (session) {
        lastSentMessage = session.message.localTimestamp;
        session.userData['questionArray'] = new arraylist();
        session.userData.questionArray.add(i18n.__("questions"));
        session.send("**Tip :** *Please select or type the option*");
        buildQuestionsAndOptions(session, session.userData.questionArray[0]);
    },
    function (session, results) {

        lastSentMessage = session.message.localTimestamp;
        var userAnswer = results.response.entity;
        var questionObject = session.userData.questionArray[0];
        questionObject.answer = userAnswer;
        buildQuestionsAndOptions(session, session.userData.questionArray[1]);
    },
    function (session, results) {
        lastSentMessage = session.message.localTimestamp;
        var userAnswer = results.response.entity;
        var questionObject = session.userData.questionArray[1];
        questionObject.answer = userAnswer;
        buildQuestionsAndOptions(session, session.userData.questionArray[2]);
    },
    function (session, results) {
        lastSentMessage = session.message.localTimestamp;
        var userAnswer = results.response.entity;
        var questionObject = session.userData.questionArray[2];
        questionObject.answer = userAnswer;
        buildQuestionsAndOptions(session, session.userData.questionArray[3]);
    },
    function (session, results) {
        lastSentMessage = session.message.localTimestamp;
        var userAnswer = results.response.entity;
        var questionObject = session.userData.questionArray[3];
        questionObject.answer = userAnswer;
        buildQuestionsAndOptions(session, session.userData.questionArray[4]);
    },
    function (session, results) {
        lastSentMessage = session.message.localTimestamp;
        var userAnswer = results.response.entity;
        var questionObject = session.userData.questionArray[4];
        questionObject.answer = userAnswer;
        buildQuestionsAndOptions(session, session.userData.questionArray[5]);
    },
    function (session, results) {
        lastSentMessage = session.message.localTimestamp;
        var userAnswer = results.response.entity;
        var questionObject = session.userData.questionArray[5];
        questionObject.answer = userAnswer;
        buildQuestionsAndOptions(session, session.userData.questionArray[6]);
    },
    function (session, results) {
        session.sendTyping();
        lastSentMessage = session.message.localTimestamp;
        var userAnswer = results.response.entity;
        var questionObject = session.userData.questionArray[6];
        questionObject.answer = userAnswer;
        session.send(i18n.__('half_attempt_msg'));
        session.send("Next question")
        buildQuestionsAndOptions(session, session.userData.questionArray[7]);
    },
    function (session, results) {
        lastSentMessage = session.message.localTimestamp;
        var userAnswer = results.response.entity;
        var questionObject = session.userData.questionArray[7];
        questionObject.answer = userAnswer;
        buildQuestionsAndOptions(session, session.userData.questionArray[8]);
    },
    function (session, results) {
        lastSentMessage = session.message.localTimestamp;
        var userAnswer = results.response.entity;
        var questionObject = session.userData.questionArray[8];
        questionObject.answer = userAnswer;
        session.send("**Tip :** *Please type the answer*");
        buildQuestionsAndOptions(session, session.userData.questionArray[9]);
    },
    function (session, results) {
        lastSentMessage = session.message.localTimestamp;
        var userAnswer = results.response;
        var questionObject = session.userData.questionArray[9];
        questionObject.answer = userAnswer;
        buildQuestionsAndOptions(session, session.userData.questionArray[10]);
    },
    function (session, results) {
        lastSentMessage = session.message.localTimestamp;
        var userAnswer = results.response;
        var questionObject = session.userData.questionArray[10];
        questionObject.answer = userAnswer;
        buildQuestionsAndOptions(session, session.userData.questionArray[11]);
    },
    function (session, results) {
        session.sendTyping();
        lastSentMessage = session.message.localTimestamp;
        var userAnswer = results.response;
        var questionObject = session.userData.questionArray[11];
        questionObject.answer = userAnswer;
        session.send("You are almost there, one more to go.");
        session.send("(bhangra) (fireworks)");
        session.send("Here is the final question ");
        buildQuestionsAndOptions(session, session.userData.questionArray[12]);
    },
    function (session, results) {
        lastSentMessage = session.message.localTimestamp;
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


// Dialog that will ask user the reason of not filling the feedback form
bot.dialog('notFillingFeedback', [
    function (session) {
        saveAddress = session.message.address;
        username = saveAddress.user.name;
        firstName = username.split(" ")[0];

        lastSentMessage = session.message.localTimestamp;
        session.send("(kya) :^)");
        builder.Prompts.text(session, firstName + ", " + i18n.__('reason_msg'));
    },
    function (session, results) {
        session.dialogData.notFillingFeedbackReason = results.response;
        var response = session.dialogData.notFillingFeedbackReason;
        firebaseOperations.deleteUserPendingFeedback(trainingId, username);
        session.send("Submitting response, Please wait...");
        session.sendTyping();
        saveAddress = session.message.address;
        username = saveAddress.user.name;
        firstName = username.split(" ")[0];

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
        var responseAttachments = [];
        var response;
        for (var index = 0; index < session.userData.questionArray.length; index++) {
            var question = session.userData.questionArray[index].question;
            var answer = session.userData.questionArray[index].answer;
            var id = session.userData.questionArray[index].id;

            var heroCard = new builder.HeroCard(session)
                .title(id + ". " + question)
                .text(answer)
            responseAttachments.push(heroCard);
        }

        var msg = new builder.Message(session)
            .textFormat(builder.TextFormat.plain)
            .attachments(responseAttachments);

        builder.Prompts.choice(session,
            msg,
            ["edit 1", "edit 2", "edit 3", "edit 4", "edit 5", "edit 6", "edit 7", "edit 8",
                "edit 9", "edit 10", "edit 11", "edit 12", "edit 13"], {
                retryPrompt: i18n.__('retry_command_prompt')
            });
        session.send("Please type 'edit (question number)' to edit the response for ex- **edit 1** or **'submit'** to submit all responses");
        lastSentMessage = session.message.localTimestamp;
    },
    function (session, results) {
        var selectOption = results.response.entity.split(' ');
        var qNumber = selectOption[1];
        qNumber = --qNumber;
        session.userData.editQuestionNumber = qNumber;
        buildQuestionsAndOptions(session, session.userData.questionArray[qNumber]);
    },
    function (session, results) {
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
        lastSentMessage = session.message.localTimestamp;

    },
    function (session, results) {
        selectOptionAfterCompletingAnswer(session, results);
    }
]);

// The dialog stack is cleared and this dialog is invoked when the user enters 'help'.
bot.dialog('help', function (session, args, next) {
    session.endDialog('Global commands that are available anytime: %s', i18n.__('help_msg'));
})
    .triggerAction({
        matches: /^help$/i,
        onSelectAction: (session, args, next) => {
            // Add the help dialog to the dialog stack
            // (override the default behavior of replacing the stack)
            session.beginDialog(args.action, args);
        }
    });


// The dialog stack is cleared and this dialog is invoked when the user enters 'help'.
bot.dialog('submit', function (session, args, next) {
    if (!(session.userData.questionArray)) {
        session.endDialog(i18n.__('not_started_msg'))
    } else {
        var length = session.userData.questionArray.length;
        for (var index = 0; index < length; index++) {
            var answer = session.userData.questionArray[index].answer;
            var id = session.userData.questionArray[index].id;
            if (answer == '') {
                session.endDialog(i18n.__("wait"), id)
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
                filename: username + '.csv',
                path: 'response/session_feedback.csv'
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
            session.send(i18n.__('mail_not_sent_msg'))
        } else {
            console.log('Email sent: ' + info.response);
            session.send(i18n.__('mail_sent_msg'))
            session.send("Thanks **%s** for filling your feedback (bow)", firstName);
            // fs.unlinkSync('response/session_feedback.csv');
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
    saveAddress = session.message.address;
    username = saveAddress.user.name;

    firstName = username.split(" ")[0];
    isUserStartFilling = false;

    session.send("Submitting feedback, Please wait...");
    session.sendTyping();
    var totalResponse = session.userData.questionArray;
    firebaseOperations.saveFeedbackToDB(trainingId, username, session.userData.questionArray);
    var fields = ['id', 'question', 'answer'];
    var csv = json2csv({data: totalResponse, fields: fields});
    fs.writeFile('response/session_feedback.csv', csv, function (err) {
        if (err) throw err;
        console.log('file saved');
    });
    sendEmail(session, username + "- " + i18n.__('subject'), "Please check the response in attached file-: ", true);
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
    isUserStartFilling = false;
    session.userData = {};
    session.dialogData = {};
    taskForIdealState.stop();
}

/**
 * This method will check the time difference between the last sent message time and current time and send user a
 * message accordingly
 */
function checkLastSentMessageTime() {
    if (isUserStartFilling) {
        var currentDate = new Date();
        var lastMessageSentDate = new Date(lastSentMessage);
        var diff = (currentDate.getTime() - lastMessageSentDate.getTime()) / 1000;
        diff /= 60;
        console.log(Math.abs(Math.round(diff)));
        var timeDifference = Math.abs(Math.round(diff));
        if (timeDifference >= 1) {
            sendProactiveMessage();
        }
    }
}


/**
 * This method will check the current logged in user has any pending feedback or not
 */
function checkForPendingFeedback() {
    firebaseOperations.isFeedbackPendingForUser(username, function (isPendingFeedback) {
        if (isPendingFeedback && !isUserStartFilling) {
            firebaseOperations.getPendingFeedbackForUser(username, function (feedbackArray) {
                feedbackArray.forEach(function (child) {
                    trainingId = child.val().trainingId;
                    trainingName = child.val().trainingName;
                });

                var msg = new builder.Message().address(saveAddress);
                msg.text("You have just attended the **'%s'** session. We request you to fill the feedback form ASAP. " +
                    "Please type **'go'** to start filling the feedback.", trainingName);
                bot.send(msg);
            })
        }
    })
}


/**
 * This method will send a reminder to user to fill the feedback form in case if user is in ideal state
 */
function sendProactiveMessage() {
    try {
        var msg = new builder.Message().address(saveAddress);
        firstName = username.split(" ")[0];
        msg.text(i18n.__('inactive_msg'), firstName);
        bot.send(msg);
        lastSentMessage = new Date();
    } catch (err) {
        console.log(err.message);
    }
}

function startCronToCheckIdealState() {
    taskForIdealState = cron.schedule('*/2 * * * *', function () {
        console.log('running a task every two minutes');
        checkLastSentMessageTime();
    }, false);
    taskForIdealState.start();
}


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
        startCronToCheckIdealState();
        startCronToCheckPendingFeedback();
    }
}