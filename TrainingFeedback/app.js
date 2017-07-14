var restify = require('restify');
var builder = require('botbuilder');
var nodemailer = require('nodemailer');
var firebaseOperations = require('./firebase_operations.js');
let i18n = require("i18n");
var json2csv = require('json2csv');
var fs = require('fs');

i18n.configure({
    locales: ['en', 'de'],
    directory: __dirname + '/locales'
});

//=========================================================
// Bot Setup
//=========================================================

// Setup Restify Server
var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 5000, function () {
    console.log('%s listening to %s', server.name, server.url);
});
// Create chat bot
var connector = new builder.ChatConnector({
    appId: "1e080c33-9bf0-4b50-bf0e-3570b001bb8e",
    appPassword: "UeLfbd7hwBOLY4dEcWOe31Y"
});

var DialogLabels = {
    Yes: 'Start',
    Later: 'Later',
    No: 'Not Filling'
};

var RatingDialogLabels = {
    One: '1',
    Two: '2',
    Three: '3',
    Four: '4',
    Five: '5'
};

var SubmitDialogLabels = {
    Submit: 'Submit',
    Review: 'Review'
}

var TimeDialogLabels = {
    One: '1 Hour',
    Two: '2 Hours',
    Four: '4 Hours'
}


var ConfirmationDialogLabels = {
    Yes: "Yes",
    No: "No"
}

// Create bot and default message handler
const bot = new builder.UniversalBot(connector);

server.post('/api/messages', connector.listen());

//=========================================================
// Activity Events
//=========================================================

var username = 'Unknown';

//Bot on
bot.on('contactRelationUpdate', function (message) {
    if (message.action === 'add') {
        username = message.user ? message.user.name : null;
        var reply = new builder.Message()
            .address(message.address)
            .text("Hello %s, Thanks for adding me.", username || 'there');
        bot.send(reply);
    } else {
        // delete their data
    }
});


//=========================================================
// Bots Middleware
//=========================================================

// // Anytime the major version is incremented any existing conversations will be restarted.
// bot.use(builder.Middleware.dialogVersion({version: 1.1, resetCommand: /^reset/i}));
//

bot.dialog("/", [
    function (session) {
        firebaseOperations.saveQuestionsToDB(i18n.__('questions'));
        session.sendTyping();
        setTimeout(function () {
            session.send("You will be presented with a list of questions. Your answer to those questions can help the trainer identify his strengths and improvement areas to serve you better.")
            session.send("You can type '**help**' anytime to see all available commands that I can respond to.")
            session.send(i18n.__('Welcome'));
            session.send("You have just attended the session. We request you to fill the feedback form ASAP. ");
            builder.Prompts.choice(
                session,
                'What would you like to do? (** Tip :** *Please select or type the option*)',
                [DialogLabels.Yes, DialogLabels.Later, DialogLabels.No],
                {
                    listStyle: builder.ListStyle.button,
                    retryPrompt: ["Please choose one option for the above question", "I would request you to please select an option for the above question"]
                });
        }, 3000);
    }
    ,
    function (session, results) {
        if (results.response) {
            var selectedOptionIndex = results.response.index;
            switch (selectedOptionIndex) {
                case 0:
                    session.send("Here are the questions-:");
                    session.beginDialog('startFeedbackQuestions');
                    break;

                case 1:
                    session.beginDialog('later');
                    break;

                case 2:
                    session.beginDialog('notFillingFeedback');
                    break;

                default:
                    session.send("Sorry I couldn't get you. It seems you have entered something else. " +
                        "Can you please try 'help' for how to proceed.");
                    break;

            }

        } else {
            session.send("There is some problem, please try after some time");
        }
    }
]);


//=========================================================
// Bots Dialogs
//=========================================================

// Dialog that will start asking questions to user
bot.dialog('startFeedbackQuestions', [
    function (session) {
        session.sendTyping();
        session.userData["questionArray"] = [];
        builder.Prompts.choice(
            session,
            i18n.__('questions')[0] + " (**Tip :** *Please select or type the option*)",
            [RatingDialogLabels.One, RatingDialogLabels.Two, RatingDialogLabels.Three, RatingDialogLabels.Four, RatingDialogLabels.Five],
            {
                listStyle: builder.ListStyle.button,
                retryPrompt: ["Please choose one option for the above question", "I would request you to please select an option for the above question"]
            });
    },
    function (session, results) {
        session.sendTyping();
        var userAnswer = results.response.entity;
        var questionData = new questionModel(i18n.__('questions')[0], userAnswer);
        session.userData.questionArray.push(questionData);
        builder.Prompts.choice(
            session,
            i18n.__('questions')[1],
            [RatingDialogLabels.One, RatingDialogLabels.Two, RatingDialogLabels.Three, RatingDialogLabels.Four, RatingDialogLabels.Five],
            {
                listStyle: builder.ListStyle.button,
                retryPrompt: ["Please choose one option for the above question", "I would request you to please select an option for the above question"]
            });
    },
    function (session, results) {
        session.sendTyping();
        var userAnswer = results.response.entity;
        var questionData = new questionModel(i18n.__('questions')[1], userAnswer);
        session.userData.questionArray.push(questionData);
        builder.Prompts.choice(
            session,
            i18n.__('questions')[2],
            [RatingDialogLabels.One, RatingDialogLabels.Two, RatingDialogLabels.Three, RatingDialogLabels.Four, RatingDialogLabels.Five],
            {
                listStyle: builder.ListStyle.button,
                retryPrompt: ["Please choose one option for the above question", "I would request you to please select an option for the above question"]
            });
    },
    function (session, results) {
        session.sendTyping();
        var userAnswer = results.response.entity;
        var questionData = new questionModel(i18n.__('questions')[2], userAnswer);
        session.userData.questionArray.push(questionData);

        builder.Prompts.choice(
            session,
            i18n.__('questions')[3],
            [RatingDialogLabels.One, RatingDialogLabels.Two, RatingDialogLabels.Three, RatingDialogLabels.Four, RatingDialogLabels.Five],
            {
                listStyle: builder.ListStyle.button,
                retryPrompt: ["Please choose one option for the above question", "I would request you to please select an option for the above question"]
            });
    },
    function (session, results) {
        session.sendTyping();
        var userAnswer = results.response.entity;
        var questionData = new questionModel(i18n.__('questions')[3], userAnswer);
        session.userData.questionArray.push(questionData);

        builder.Prompts.choice(
            session,
            i18n.__('questions')[4],
            [RatingDialogLabels.One, RatingDialogLabels.Two, RatingDialogLabels.Three, RatingDialogLabels.Four, RatingDialogLabels.Five],
            {
                listStyle: builder.ListStyle.button,
                retryPrompt: ["Please choose one option for the above question", "I would request you to please select an option for the above question"]
            });
    },
    function (session, results) {
        session.sendTyping();
        var userAnswer = results.response.entity;
        var questionData = new questionModel(i18n.__('questions')[4], userAnswer);
        session.userData.questionArray.push(questionData);

        builder.Prompts.choice(
            session,
            i18n.__('questions')[5],
            [RatingDialogLabels.One, RatingDialogLabels.Two, RatingDialogLabels.Three, RatingDialogLabels.Four, RatingDialogLabels.Five],
            {
                listStyle: builder.ListStyle.button,
                retryPrompt: ["Please choose one option for the above question", "I would request you to please select an option for the above question"]
            });
    },
    function (session, results) {
        session.sendTyping();
        var userAnswer = results.response.entity;
        var questionData = new questionModel(i18n.__('questions')[5], userAnswer);
        session.userData.questionArray.push(questionData);

        builder.Prompts.choice(
            session,
            i18n.__('questions')[6],
            [ConfirmationDialogLabels.Yes, ConfirmationDialogLabels.No],
            {
                listStyle: builder.ListStyle.button,
                retryPrompt: ["Please choose one option for the above question", "I would request you to please select an option for the above question"]
            });
    },
    function (session, results) {
        session.sendTyping();
        var userAnswer = results.response.entity;
        var questionData = new questionModel(i18n.__('questions')[6], userAnswer);
        session.userData.questionArray.push(questionData);

        session.send("You have completed almost half of the questions. (kya) baat hai. Here is a (trophy) for you.");
        setTimeout(function () {
            session.send("Here is next questions, ")
            builder.Prompts.choice(
                session,
                i18n.__('questions')[7],
                [ConfirmationDialogLabels.Yes, ConfirmationDialogLabels.No],
                {
                    listStyle: builder.ListStyle.button,
                    retryPrompt: ["Please choose one option for the above question", "I would request you to please select an option for the above question"]
                });
        }, 4000)
    },
    function (session, results) {
        session.sendTyping();
        var userAnswer = results.response.entity;
        var questionData = new questionModel(i18n.__('questions')[7], userAnswer);
        session.userData.questionArray.push(questionData);

        builder.Prompts.choice(
            session,
            i18n.__('questions')[8],
            [ConfirmationDialogLabels.Yes, ConfirmationDialogLabels.No],
            {
                listStyle: builder.ListStyle.button,
                retryPrompt: ["Please choose one option for the above question", "I would request you to please select an option for the above question"]
            });
    },
    function (session, results) {
        session.sendTyping();
        var userAnswer = results.response.entity;
        var questionData = new questionModel(i18n.__('questions')[8], userAnswer);
        session.userData.questionArray.push(questionData);

        builder.Prompts.text(session, i18n.__('questions')[9] + " " + "(**Tip :** *Please type the answer*)");
    },
    function (session, results) {
        session.sendTyping();
        var userAnswer = results.response;
        var questionData = new questionModel(i18n.__('questions')[9], userAnswer);
        session.userData.questionArray.push(questionData);

        builder.Prompts.text(session, i18n.__('questions')[10])
    },
    function (session, results) {
        session.sendTyping();
        var userAnswer = results.response;
        var questionData = new questionModel(i18n.__('questions')[10], userAnswer);
        session.userData.questionArray.push(questionData);

        builder.Prompts.text(session, i18n.__('questions')[11])
    },
    function (session, results) {
        session.sendTyping();
        var userAnswer = results.response;
        var questionData = new questionModel(i18n.__('questions')[11], userAnswer);
        session.userData.questionArray.push(questionData);

        session.send("You are almost there, one more to go.");
        session.send("(bhangra)");
        setTimeout(function () {
            session.send("Here is the final question, ")
            builder.Prompts.choice(
                session,
                i18n.__('questions')[12],
                [RatingDialogLabels.One, RatingDialogLabels.Two, RatingDialogLabels.Three, RatingDialogLabels.Four, RatingDialogLabels.Five],
                {
                    listStyle: builder.ListStyle.button,
                    retryPrompt: ["Please choose one option for the above question", "I would request you to please select an option for the above question"]
                });
        }, 3000)
    },
    function (session, results) {
        session.sendTyping();
        var userAnswer = results.response.entity;
        var questionData = new questionModel(i18n.__('questions')[12], userAnswer);
        session.userData.questionArray.push(questionData);

        builder.Prompts.choice(
            session,
            'Great Job! (clap) You have submitted all the responses successfully and we appreciate this. (y) What would you like to do now?',
            [SubmitDialogLabels.Submit, SubmitDialogLabels.Review],
            {
                listStyle: builder.ListStyle.button,
                retryPrompt: ["Please choose one option", "I would request you to please select one of these options"]
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
        session.sendTyping();
        session.send("(kya) :^)");
        session.sendTyping();
        builder.Prompts.text(session, "Can you please write the reason why you don't want to fill the feedback form?");
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

// Dialog that will ask user to select time
bot.dialog('later', [
    function (session) {
        session.sendTyping();
        builder.Prompts.choice(
            session,
            'Please select the time, I will remind you after that time.',
            [TimeDialogLabels.One, TimeDialogLabels.Two, TimeDialogLabels.Four],
            {
                listStyle: builder.ListStyle.button,
                retryPrompt: ["Please choose one option for the above question", "I would request you to please select an option for the above question"]
            });
    },
    function (session, results) {
        session.dialogData.time = results.response;
        var response = session.dialogData.time.entity;
        session.send("Sure buddy, I will remind you after "+response+". Keep working (computerrage)");
        session.endDialog();
    }
]);


// Dialog will show all the responded answer to the user before submitting, user can edit each answer from here.
bot.dialog('submitResponse', [
    function (session) {
        submitAllResponse(session);
    }
]);


function submitAllResponse(session) {
    session.send("Submitting Response, Please wait...");
    session.sendTyping();
    var totalResponse = session.userData.questionArray;
    firebaseOperations.saveFeedbackToDB(0, 1, session.userData.questionArray);
    var fields = ['Question', 'Answer'];
    var csv = json2csv({data: totalResponse, fields: fields});
    fs.writeFile('response/session_feedback.csv', csv, function (err) {
        if (err) throw err;
        console.log('file saved');
    });
    setTimeout(function () {
        sendEmail(session, username + "- " + i18n.__('subject'), "Please check the response in attached file-: ", true);
    }, 3000);
}


// Dialog will show all the responded answer to the user before submitting, user can edit each answer from here.
bot.dialog('showFeedbackReview', [
    function (session) {
        session.send("Here is the list of responses that you have submitted, you can edit any response before submitting it.");
        session.sendTyping();
        var responseAttachments = [];
        for (var index = 0; index < session.userData.questionArray.length; index++) {
            var question = session.userData.questionArray[index].Question;
            var answer = session.userData.questionArray[index].Answer;
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
                [ConfirmationDialogLabels.Yes, ConfirmationDialogLabels.No],
                {
                    listStyle: builder.ListStyle.button,
                    maxRetries: 0,
                    retryPrompt: ["Please choose one option for the above question", "I would request you to please select an option for the above question"]
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
                filename: 'name.csv',
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
            session.send("We are not able to send your response to TM team. Please contact to support.")
        } else {
            console.log('Email sent: ' + info.response);
            session.send("We have sent your response to TM team. Thanks for your time.")
            session.send("Thanks for filling your feedback (bow)");
            fs.unlinkSync('response/session_feedback.csv');
        }
        transporter.close();
        deleteAllData(session)
        session.endDialog();
    });
}

// The dialog stack is cleared and this dialog is invoked when the user enters 'help'.
bot.dialog('help', function (session, args, next) {
    session.endDialog("Global commands that are available anytime:\n\n\n * **edit_(question number)** - You can edit any question any time by typing for example- *edit_1*" +
        "\n * **submit** - You can submit all the response by typing *submit*" +
        "\n * **reset** - You can reset all the response by typing *reset*" +
        "\n * **help** - You can check all available commands that bot can do by typing *help*");
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
        session.endDialog("Hey (wait)! You have not started filling the feedback yet. Please give all responses before submitting the feedback.")
    } else {
        var attempedQuestions = session.userData.questionArray.length;
        if (attempedQuestions == 0) {
            session.endDialog("Hey (wait)! You have not started filling the feedback yet. Please give all responses before submitting the feedback.")
        } else if (attempedQuestions < 13) {
            session.endDialog("Hey (wait)! You have only attempted " + attempedQuestions + "/13" + " questions. Please give all responses before submitting the feedback.")
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
    session.endDialog("Your session has been reset, type '**Start**' to start the feedback again");
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

//--------------------------------------------------------------------------------------------------------------------//

function questionModel(question, answer) {
    this.Question = question;
    this.Answer = answer;
}






