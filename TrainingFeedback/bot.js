/**
 * Created by sachit on 15/07/17.
 */

var builder = require('botbuilder');
var nodemailer = require('nodemailer');
var firebaseOperations = require('./firebase_operations.js');
let i18n = require("i18n");
var json2csv = require('json2csv');
var fs = require('fs');
var ArrayList = require('ArrayList');


i18n.configure({
    locales: ['en', 'de'],
    directory: __dirname + '/locales'
});

const connector = new builder.ChatConnector({
    appId: process.env.MICROSOFT_APP_ID,
    appPassword: process.env.MICROSOFT_APP_PASSWORD
});

// Create bot and default message handler
const bot = module.exports = new builder.UniversalBot(connector);

var username = 'Unknown';
var saveAddress, question, answer, sno;

// log any bot errors into the console
bot.on('error', function (e) {
    console.log('And error ocurred', e);
});

bot.on('contactRelationUpdate', function (message) {
    if (message.action === 'add') {
        username = message.user ? message.user.name : null;
        var reply = new builder.Message()
            .address(message.address)
            .text('Hello %s, Thanks for adding me.', username || 'there');
        bot.send(reply);
    } else {
        console.log(i18n.__('delete_bot'))
    }
});


//=========================================================
// Bots Middleware
//=========================================================

// Anytime the major version is incremented any existing conversations will be restarted.
// bot.use(builder.Middleware.dialogVersion({version: 1.0, resetCommand: /^reset/i}));

bot.dialog("/", [
    function (session) {

        saveAddress = session.message.address;
        username = saveAddress.user.name;

        // firebaseOperations.saveQuestionsToDB(i18n.__('questions'));
        session.sendTyping();
        setTimeout(function () {
            session.send(i18n.__('welcome1_msg'));
            session.send(i18n.__('welcome2_msg'));
            session.send(i18n.__('welcome3_msg'));
            session.send(i18n.__('feedback_fill_msg'));
            builder.Prompts.choice(
                session,
                i18n.__('choose_start_option'),
                i18n.__('dialogLabels'),
                {
                    listStyle: builder.ListStyle.button,
                    retryPrompt: i18n.__('retry_prompt')
                });
        }, 3000);
    },
    function (session, results) {
        if (results.response) {
            var selectedOptionIndex = results.response.index;
            switch (selectedOptionIndex) {
                case 0:
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
 * this method is used to build the questions with an options
 * @param session
 * @param questionObject
 */
function buildQuestionsAndOptions(session, questionObject) {
    var question = questionObject.question;
    var options = questionObject.options;
    var questionsType = questionObject.question_type;
    if (questionsType === 'choice') {
        builder.Prompts.choice(
            session,
            question,
            options,
            {
                listStyle: builder.ListStyle.button,
                retryPrompt: i18n.__('retry_prompt')
            });
    } else if (questionsType === 'text') {
        builder.Prompts.text(session, question)
    }
}


/**
 * This method will start asking questions from user and will store the answer and pass to the next question
 * Here we are using waterfall model of bot builder SDK
 */
bot.dialog('startFeedbackQuestions', [
    function (session) {
        session.sendTyping();
        session.userData['questionArray'] = new ArrayList;
        session.userData.questionArray.add(i18n.__("questions"));
        session.send("**Tip :** *Please select or type the option*");
        // var questionObject = i18n.__("questions")[0];
        // session.userData.questionArray.push(questionObject);
        buildQuestionsAndOptions(session, session.userData.questionArray.get(0));
    },
    function (session, results) {
        session.sendTyping();
        var userAnswer = results.response.entity;
        var questionObject = session.userData.questionArray[0];
        questionObject.answer = userAnswer;
        // var questionData = new questionModel(1, questionObject.question, userAnswer);
        // session.userData.questionArray.add(0, questionObject);
        // var questionObject = i18n.__("questions")[1];
        buildQuestionsAndOptions(session, session.userData.questionArray[1]);
    },
    function (session, results) {
        session.sendTyping();
        var userAnswer = results.response.entity;
        var questionObject = session.userData.questionArray[1];
        questionObject.answer = userAnswer;
        // var questionData = new questionModel(2, (session.userData.questionArray.get(1)).question, userAnswer);
        // session.userData.questionArray.push(questionData);
        // var questionObject = i18n.__("questions")[2];
        buildQuestionsAndOptions(session, session.userData.questionArray[2]);
    },
    function (session, results) {
        session.sendTyping();
        var userAnswer = results.response.entity;
        var questionObject = session.userData.questionArray[2];
        questionObject.answer = userAnswer;

        // var questionData = new questionModel(3, (session.userData.questionArray.get(2)).question, userAnswer);
        // session.userData.questionArray.push(questionData);
        // var questionObject = i18n.__("questions")[3];
        buildQuestionsAndOptions(session, session.userData.questionArray[3]);
    },
    function (session, results) {
        session.sendTyping();
        var userAnswer = results.response.entity;
        var questionObject = session.userData.questionArray[3];
        questionObject.answer = userAnswer;

        // var questionData = new questionModel(4, (session.userData.questionArray.get(3)).question, userAnswer);
        // session.userData.questionArray.push(questionData);
        // var questionObject = i18n.__("questions")[4];
        buildQuestionsAndOptions(session, session.userData.questionArray[4]);
    },
    function (session, results) {
        session.sendTyping();
        var userAnswer = results.response.entity;
        var questionObject = session.userData.questionArray[4];
        questionObject.answer = userAnswer;

        // var questionData = new questionModel(5, (session.userData.questionArray.get(4)).question, userAnswer);
        // session.userData.questionArray.push(questionData);
        // var questionObject = i18n.__("questions")[5];
        buildQuestionsAndOptions(session, session.userData.questionArray[5]);
    },
    function (session, results) {
        session.sendTyping();
        var userAnswer = results.response.entity;
        var questionObject = session.userData.questionArray[5];
        questionObject.answer = userAnswer;

        // var questionData = new questionModel(6, (session.userData.questionArray.get(5)).question, userAnswer);
        // session.userData.questionArray.push(questionData);
        // var questionObject = i18n.__("questions")[6];
        buildQuestionsAndOptions(session, session.userData.questionArray[6]);
    },
    function (session, results) {
        session.sendTyping();
        var userAnswer = results.response.entity;
        var questionObject = session.userData.questionArray[6];
        questionObject.answer = userAnswer;

        // var questionData = new questionModel(7, (session.userData.questionArray.get(6)).question, userAnswer);
        // session.userData.questionArray.push(questionData);
        session.send(i18n.__('half_attempt_msg'));
        setTimeout(function () {
            session.send("Here is next question")
            // var questionObject = i18n.__("questions")[7];
            buildQuestionsAndOptions(session, session.userData.questionArray[7]);
        }, 4000)
    },
    function (session, results) {
        session.sendTyping();
        var userAnswer = results.response.entity;
        var questionObject = session.userData.questionArray[7];
        questionObject.answer = userAnswer;

        // var questionData = new questionModel(8, (session.userData.questionArray.get(7)).question, userAnswer);
        // session.userData.questionArray.push(questionData);
        // var questionObject = i18n.__("questions")[8];
        buildQuestionsAndOptions(session, session.userData.questionArray[8]);
    },
    function (session, results) {
        session.sendTyping();
        var userAnswer = results.response.entity;
        var questionObject = session.userData.questionArray[8];
        questionObject.answer = userAnswer;

        // var questionData = new questionModel(9, (session.userData.questionArray.get(8)).question, userAnswer);
        // session.userData.questionArray.push(questionData);
        // var questionObject = i18n.__("questions")[9];
        session.send("**Tip :** *Please type the answer*");
        buildQuestionsAndOptions(session, session.userData.questionArray[9]);
    },
    function (session, results) {
        session.sendTyping();
        var userAnswer = results.response;
        var questionObject = session.userData.questionArray[9];
        questionObject.answer = userAnswer;

        // var questionData = new questionModel(10, (session.userData.questionArray.get(9)).question, userAnswer);
        // session.userData.questionArray.push(questionData);
        // var questionObject = i18n.__("questions")[10];
        buildQuestionsAndOptions(session, session.userData.questionArray[10]);
    },
    function (session, results) {
        session.sendTyping();
        var userAnswer = results.response;
        var questionObject = session.userData.questionArray[10];
        questionObject.answer = userAnswer;

        // var questionData = new questionModel(11, (session.userData.questionArray.get(10)).question, userAnswer);
        // session.userData.questionArray.push(questionData);
        // var questionObject = i18n.__("questions")[11];
        buildQuestionsAndOptions(session, session.userData.questionArray[11]);
    },
    function (session, results) {
        session.sendTyping();
        var userAnswer = results.response;
        var questionObject = session.userData.questionArray[11];
        questionObject.answer = userAnswer;

        // var questionData = new questionModel(12, (session.userData.questionArray.get(11)).question, userAnswer);
        // session.userData.questionArray.push(questionData);

        session.send("You are almost there, one more to go.");
        session.send("(bhangra)");
        setTimeout(function () {
            session.send("Here is the final question, ")
            // var questionObject = i18n.__("questions")[12];
            buildQuestionsAndOptions(session, session.userData.questionArray[12]);
        }, 3000)
    },
    function (session, results) {
        session.sendTyping();
        var userAnswer = results.response.entity;
        var questionObject = session.userData.questionArray[12];
        questionObject.answer = userAnswer;

        // var questionData = new questionModel(13, (session.userData.questionArray.get(12)).question, userAnswer);
        // session.userData.questionArray.push(questionData);

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
]);

// Dialog that will ask user the reason of not filling the feedback form
bot.dialog('notFillingFeedback', [
    function (session) {
        saveAddress = session.message.address;
        username = saveAddress.user.name;
        session.sendTyping();
        session.send("(kya) :^)");
        session.sendTyping();
        builder.Prompts.text(session, username + ", " + i18n.__('reason_msg'));
    },
    function (session, results) {
        session.dialogData.notFillingFeedbackReason = results.response;
        var response = session.dialogData.notFillingFeedbackReason;
        session.send("Submitting Response, Please wait...");
        session.sendTyping();
        setTimeout(function () {
            sendEmail(session, username + "- " + i18n.__('notSubmitting'), "Here is the reason-: " + response, false);
        }, 3000);
    }
]);


bot.dialog('submitResponse', [
    function (session) {
        submitAllResponse(session);
    }
]);


/**
 * This method will submit all response to the server, also will make a CSV file and send it to the TM team
 * @param session
 */
function submitAllResponse(session) {
    saveAddress = session.message.address;
    username = saveAddress.user.name;

    session.send("Submitting Response, Please wait...");
    session.sendTyping();
    var totalResponse = session.userData.questionArray;
    // firebaseOperations.saveFeedbackToDB(0, username, session.userData.questionArray);
    var fields = ['sno', 'question', 'answer'];
    var csv = json2csv({data: totalResponse, fields: fields});
    fs.writeFile('response/session_feedback.csv', csv, function (err) {
        if (err) throw err;
        console.log('file saved');
    });
    sendEmail(session, username + "- " + i18n.__('subject'), "Please check the response in attached file-: ", true);
}


// Dialog will show all the responded answer to the user before submitting, user can edit each answer from here.
bot.dialog('showFeedbackReview', [
    function (session) {
        session.send(i18n.__('response_header'));
        session.sendTyping();
        var responseAttachments = [];
        for (var index = 0; index < session.userData.questionArray.length; index++) {
            var question = session.userData.questionArray[index].question;
            var answer = session.userData.questionArray[index].answer;
            var heroCard = new builder.HeroCard(session)
                .title(question)
                .text(answer)
            responseAttachments.push(heroCard);
        }

        var msg = new builder.Message(session)
            .textFormat(builder.TextFormat.plain)
            .attachments(responseAttachments);

        builder.Prompts.choice(session, msg,
            ["edit_1", "edit_2", "edit_3", "edit_4", "edit_5", "edit_6", "edit_7", "edit_8",
                "edit_9", "edit_10", "edit_11", "edit_12", "edit_13"]);
        session.send("Enter 'edit_(question number)' to edit the response. Ex- **edit_1**");
    },
    function (session, results) {
        var selectOption = results.response.entity.split('_');
        var qNumber = selectOption[1];
        if (qNumber >= 1 && qNumber <= 13) {
            var editQuestionNumber = --(qNumber);
            builder.Prompts.choice(
                session,
                i18n.__('questions')[editQuestionNumber],
                i18n.__('confirmationDialogLabels'),
                {
                    listStyle: builder.ListStyle.button,
                    maxRetries: 0,
                    retryPrompt: i18n.__('retry_prompt')
                });
        } else {
            session.send("Please choose valid command. Ex- **edit_1**");
        }

    }
]);


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
            session.send("Thanks **%s** for filling your feedback (bow)", username);
            fs.unlinkSync('response/session_feedback.csv');
        }
        transporter.close();
        deleteAllData(session)
        session.endDialog();
    });
}

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
        var attempedQuestions = session.userData.questionArray.length;
        if (attempedQuestions === 0) {
            session.endDialog(i18n.__('not_started_msg'))
        } else if (attempedQuestions < 13) {
            session.endDialog(i18n.__("wait"), attempedQuestions)
        } else {
            submitAllResponse(session);
        }
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
        matches: /reset/i,
        confirmPrompt: "This will wipe everything out. Are you sure?"
    });

bot.dialog('/done', (session) => {
    session.endDialog('You are done with editing');
})
    .triggerAction({
        matches: /done/i
    });


function deleteAllData(session) {
    session.userData = {};
    session.dialogData = {};
}


function questionModel(sno, question, answer) {
    this.sno = sno;
    this.question = question;
    this.answer = answer;
}