var restify = require('restify');
var builder = require('botbuilder');
var nodemailer = require('nodemailer');
var firebase = require('firebase')
let i18n = require("i18n");

i18n.configure({
    locales: ['en', 'de'],
    directory: __dirname + '/locales'
});

//========================================================
//Initialize Firebase
//========================================================
var config = {
    apiKey: "AIzaSyBU4p6ZhtVa1pijJXv4jxzHqb3vqa23tZ4",
    authDomain: "trainingfeedback-37dcb.firebaseapp.com",
    databaseURL: "https://trainingfeedback-37dcb.firebaseio.com",
    projectId: "trainingfeedback-37dcb",
    storageBucket: "",
    messagingSenderId: "499900088369"
};
firebase.initializeApp(config);


//=========================================================
// Bot Setup
//=========================================================
// Setup Restify Server
var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 6000, function () {
    console.log('%s listening to %s', server.name, server.url);
});
// Create chat bot
var connector = new builder.ChatConnector({
    appId: "1e080c33-9bf0-4b50-bf0e-3570b001bb8e",
    appPassword: "UeLfbd7hwBOLY4dEcWOe31Y"
});

// Create bot and default message handler
var bot = new builder.UniversalBot(connector);

server.post('/api/messages', connector.listen());


//Bot on
bot.on('contactRelationUpdate', function (message) {
    if (message.action === 'add') {
        var name = message.user ? message.user.name : null;
        var reply = new builder.Message()
            .address(message.address)
            .text("Hello %s, Thanks for adding me. I am a training feedback bot that will ask you for the " +
                "feedback form for your attended sessions", name || 'there');
        bot.send(reply);
    } else {
        console.log("User ask for deleting data")
        // delete their data
    }
});
bot.on('typing', function (message) {
    console.log("User is typing" + message);
    // User is typing
});
bot.on('deleteUserData', function (message) {
    console.log("User has asked for deleting data" + message);
    // User asked to delete their data
});

//=========================================================
// Bots Middleware
//=========================================================

// Anytime the major version is incremented any existing conversations will be restarted.
bot.use(builder.Middleware.dialogVersion({version: 1.0, resetCommand: /^reset/i}));

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

var ConfirmationDialogLabels = {
    Yes: "Yes",
    No: "No"
}

var bot = new builder.UniversalBot(connector, [
    function (session) {
        session.sendTyping();
        setTimeout(function () {
            session.send(i18n.__('Welcome'));
            session.send("You have just attended the session. We request you to fill the feedback form ASAP. ");
            builder.Prompts.choice(
                session,
                'What would you like to do?',
                [DialogLabels.Yes, DialogLabels.Later, DialogLabels.No],
                {
                    listStyle: builder.ListStyle.button,
                    maxRetries: 1,
                    retryPrompt: ["Please choose one option", "I would request you to please select one of these options"]
                });
        }, 3000);
    },
    function (session, results) {
        if (results.response) {
            var selectedOptionIndex = results.response.index;
            switch (selectedOptionIndex) {
                case 0:
                    session.send("Here are the questions-:");
                    session.beginDialog('startFeedbackQuestions');
                    break;

                case 1:
                    builder.Prompts.time(session, "Can you please enter the time so that I can remind you at that time? (e.g.: June 6th at 5pm)");
                    break;

                case 2:
                    session.beginDialog('notFillingFeedback');
                    break;

                default:
                    session.send("Sorry I couldn't get you. It seems you have entered something else. " +
                        "Can you please try 'Help' for how to proceed and then type 'Start' again");
                    break;

            }

        } else {
            session.send("There is some problem, please try after some time");
        }
    }
]);

// Dialog that will start asking questions to user
bot.dialog('startFeedbackQuestions', [
    function (session) {
        builder.Prompts.choice(
            session,
            i18n.__('questions')[0],
            [RatingDialogLabels.One, RatingDialogLabels.Two, RatingDialogLabels.Three, RatingDialogLabels.Four, RatingDialogLabels.Five],
            {
                listStyle: builder.ListStyle.button,
                maxRetries: 1,
                retryPrompt: ["Please choose one option", "I would request you to please select one of these options"]
            });
    },
    function (session, results) {
        session.userData["answer"] = [];
        session.userData.answer.push(results.response);
        builder.Prompts.choice(
            session,
            i18n.__('questions')[1],
            [RatingDialogLabels.One, RatingDialogLabels.Two, RatingDialogLabels.Three, RatingDialogLabels.Four, RatingDialogLabels.Five],
            {
                listStyle: builder.ListStyle.button,
                maxRetries: 1,
                retryPrompt: ["Please choose one option", "I would request you to please select one of these options"]
            });
    },
    function (session, results) {
        session.userData.answer.push(results.response);
        builder.Prompts.choice(
            session,
            i18n.__('questions')[2],
            [RatingDialogLabels.One, RatingDialogLabels.Two, RatingDialogLabels.Three, RatingDialogLabels.Four, RatingDialogLabels.Five],
            {
                listStyle: builder.ListStyle.button,
                maxRetries: 1,
                retryPrompt: ["Please choose one option", "I would request you to please select one of these options"]
            });
    },
    function (session, results) {
        session.userData.answer.push(results.response);
        builder.Prompts.choice(
            session,
            i18n.__('questions')[3],
            [RatingDialogLabels.One, RatingDialogLabels.Two, RatingDialogLabels.Three, RatingDialogLabels.Four, RatingDialogLabels.Five],
            {
                listStyle: builder.ListStyle.button,
                maxRetries: 1,
                retryPrompt: ["Please choose one option", "I would request you to please select one of these options"]
            });
    },
    function (session, results) {
        session.userData.answer.push(results.response);
        builder.Prompts.choice(
            session,
            i18n.__('questions')[4],
            [RatingDialogLabels.One, RatingDialogLabels.Two, RatingDialogLabels.Three, RatingDialogLabels.Four, RatingDialogLabels.Five],
            {
                listStyle: builder.ListStyle.button,
                maxRetries: 1,
                retryPrompt: ["Please choose one option", "I would request you to please select one of these options"]
            });
    },
    function (session, results) {
        session.userData.answer.push(results.response);
        builder.Prompts.choice(
            session,
            i18n.__('questions')[5],
            [RatingDialogLabels.One, RatingDialogLabels.Two, RatingDialogLabels.Three, RatingDialogLabels.Four, RatingDialogLabels.Five],
            {
                listStyle: builder.ListStyle.button,
                maxRetries: 1,
                retryPrompt: ["Please choose one option", "I would request you to please select one of these options"]
            });
    },
    function (session, results) {
        session.userData.answer.push(results.response);
        builder.Prompts.choice(
            session,
            i18n.__('questions')[6],
            [ConfirmationDialogLabels.Yes, ConfirmationDialogLabels.No],
            {
                listStyle: builder.ListStyle.button,
                maxRetries: 1,
                retryPrompt: ["Please choose one option", "I would request you to please select one of these options"]
            });
    },
    function (session, results) {
        session.userData.answer.push(results.response);
        builder.Prompts.choice(
            session,
            i18n.__('questions')[7],
            [ConfirmationDialogLabels.Yes, ConfirmationDialogLabels.No],
            {
                listStyle: builder.ListStyle.button,
                maxRetries: 1,
                retryPrompt: ["Please choose one option", "I would request you to please select one of these options"]
            });
    },
    function (session, results) {
        session.userData.answer.push(results.response);
        builder.Prompts.choice(
            session,
            i18n.__('questions')[8],
            [ConfirmationDialogLabels.Yes, ConfirmationDialogLabels.No],
            {
                listStyle: builder.ListStyle.button,
                maxRetries: 1,
                retryPrompt: ["Please choose one option", "I would request you to please select one of these options"]
            });
    },
    function (session, results) {
        session.userData.answer.push(results.response);
        builder.Prompts.text(session, i18n.__('questions')[9])
    },
    function (session, results) {
        session.userData.answer.push(results.response);
        builder.Prompts.text(session, i18n.__('questions')[10])
    },
    function (session, results) {
        session.userData.answer.push(results.response);
        builder.Prompts.text(session, i18n.__('questions')[11])
    },
    function (session, results) {
        session.userData.answer.push(results.response);
        builder.Prompts.choice(
            session,
            i18n.__('questions')[12],
            [RatingDialogLabels.One, RatingDialogLabels.Two, RatingDialogLabels.Three, RatingDialogLabels.Four, RatingDialogLabels.Five],
            {
                listStyle: builder.ListStyle.button,
                maxRetries: 1,
                retryPrompt: ["Please choose one option", "I would request you to please select one of these options"]
            });
    },
    function (session, results) {
        session.userData.answer.push(results.response);
        builder.Prompts.choice(
            session,
            'Great Job! (clap) You have submitted all the responses successfully and we appreciate this. (y) What would you like to do now?',
            [SubmitDialogLabels.Submit, SubmitDialogLabels.Review],
            {
                listStyle: builder.ListStyle.button,
                maxRetries: 1,
                retryPrompt: ["Please choose one option", "I would request you to please select one of these options"]
            });
    },
    function (session, results) {
        session.userData.answer.push(results.response);

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
        builder.Prompts.text(session, "Can you please write the reason why you don't want to fill the feedback form?");
    },
    function (session, results) {
        session.dialogData.notFillingFeedbackReason = results.response;
        session.send("The reason is: " + session.dialogData.notFillingFeedbackReason);
        session.endDialog();
    }
]);


// Dialog will show all the responded answer to the user before submitting, user can edit each answer from here.
bot.dialog('submitResponse', [
    function (session) {
        session.send("Thanks for filling your feedback (bow)");
        session.send("Submitting Response, Please wait...");
        session.sendTyping();
        setTimeout(function () {
            sendEmail();
            session.endDialog();
        }, 3000);
    }
]);

// Dialog will show all the responded answer to the user before submitting, user can edit each answer from here.
bot.dialog('showFeedbackReview', [
    function (session) {
        session.send("Here is the list of responses that you have submitted, you can edit any response before submitting it.");
        session.sendTyping();
        var responseAttachments = [];

        for (var index = 0; index < 10; index++) {
            var response = session.userData.answer[index].entity;
            var herocard = new builder.HeroCard(session)
                .title(i18n.__('questions')[index])
                .text(response)
                .buttons([
                    builder.CardAction.imBack(session, index, "Edit Response")
                ]);
            responseAttachments.push(herocard);
        }

        var msg = new builder.Message(session)
            .textFormat(builder.TextFormat.plain)
            .attachmentLayout(builder.AttachmentLayout.carousel)
            .attachments(responseAttachments);

        session.send(msg).endDialog();
    },
    function (session, results) {
        session.endDialog();
    }
]);


function sendEmail() {

    var transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: 'grubscrub22@gmail.com',
            pass: 'grubscrub@22'
        }
    });

    var mailOptions = {
        from: 'grubscrub22@gmail.com',
        to: 'sachit.wadhawan@quovantis.com',
        subject: 'Sending Email using Node.js',
        text: 'That was easy!'
    };

    transporter.sendMail(mailOptions, function(error, info){
        if (error) {
            console.log(error);
        } else {
            console.log('Email sent: ' + info.response);
        }
    });
}










