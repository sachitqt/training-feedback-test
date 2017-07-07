var restify = require('restify');
var builder = require('botbuilder');
// var nodemailer = require('nodemailer');
let i18n = require("i18n");

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

var bot = new builder.UniversalBot(connector);

server.post('/api/messages', connector.listen());
//Bot on
bot.on('contactRelationUpdate', function (message) {
    if (message.action === 'add') {
        var name = message.user ? message.user.name : null;
        var reply = new builder.Message()
            .address(message.address)
            .text("Hello %s... Thanks for adding me. I am a training feedback bot that will ask you for the " +
                "feedback form for your attended sessions", name || 'there');
        bot.send(reply);
    } else {
        // delete their data
    }
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


var bot = new builder.UniversalBot(connector, [
    function (session) {
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
            'The trainer seemed knowledgeable of the training area.',
            [RatingDialogLabels.One, RatingDialogLabels.Two, RatingDialogLabels.Three, RatingDialogLabels.Four, RatingDialogLabels.Five],
            {
                listStyle: builder.ListStyle.button,
                maxRetries: 1,
                retryPrompt: ["Please choose one option", "I would request you to please select one of these options"]
            });
    },
    function (session, results) {
        session.dialogData.oneQuestion = results.response;
        builder.Prompts.choice(
            session,
            'The trainer presented the contents well.',
            [RatingDialogLabels.One, RatingDialogLabels.Two, RatingDialogLabels.Three, RatingDialogLabels.Four, RatingDialogLabels.Five],
            {
                listStyle: builder.ListStyle.button,
                maxRetries: 1,
                retryPrompt: ["Please choose one option", "I would request you to please select one of these options"]
            });
    },
    function (session, results) {
        session.dialogData.twoQuestion = results.response;
        builder.Prompts.choice(
            session,
            'The trainer was able to engage with the participants to make the session interactive and interesting',
            [RatingDialogLabels.One, RatingDialogLabels.Two, RatingDialogLabels.Three, RatingDialogLabels.Four, RatingDialogLabels.Five],
            {
                listStyle: builder.ListStyle.button,
                maxRetries: 1,
                retryPrompt: ["Please choose one option", "I would request you to please select one of these options"]
            });
    },
    function (session, results) {
        session.dialogData.threeQuestion = results.response;
        builder.Prompts.choice(
            session,
            'The training has enabled me to put my learning into practice now or will be able to use my learning in the future',
            [RatingDialogLabels.One, RatingDialogLabels.Two, RatingDialogLabels.Three, RatingDialogLabels.Four, RatingDialogLabels.Five],
            {
                listStyle: builder.ListStyle.button,
                maxRetries: 1,
                retryPrompt: ["Please choose one option", "I would request you to please select one of these options"]
            });
    },
    function (session, results) {
        session.dialogData.fourQuestion = results.response;
        builder.Prompts.choice(
            session,
            'Content was easy to understand and inline with my expectations from the session.',
            [RatingDialogLabels.One, RatingDialogLabels.Two, RatingDialogLabels.Three, RatingDialogLabels.Four, RatingDialogLabels.Five],
            {
                listStyle: builder.ListStyle.button,
                maxRetries: 1,
                retryPrompt: ["Please choose one option", "I would request you to please select one of these options"]
            });
    },
    function (session, results) {
        session.dialogData.fiveQuestion = results.response;
        builder.Prompts.choice(
            session,
            'I would recommend this course to other team members',
            [RatingDialogLabels.One, RatingDialogLabels.Two, RatingDialogLabels.Three, RatingDialogLabels.Four, RatingDialogLabels.Five],
            {
                listStyle: builder.ListStyle.button,
                maxRetries: 1,
                retryPrompt: ["Please choose one option", "I would request you to please select one of these options"]
            });
    },
    function (session, results) {
        session.dialogData.sixQuestion = results.response;
        builder.Prompts.confirm(
            session,
            'The training started at the scheduled time.',
            {
                listStyle: builder.ListStyle.button,
                maxRetries: 1,
                retryPrompt: ["Please choose one option", "I would request you to please select one of these options"]
            });
    },
    function (session, results) {
        session.dialogData.sevenQuestion = results.response;
        builder.Prompts.confirm(
            session,
            'I was given enough notification for the training to plan my product tasks accordingly.',
            {
                listStyle: builder.ListStyle.button,
                maxRetries: 1,
                retryPrompt: ["Please choose one option", "I would request you to please select one of these options"]
            });
    },
    function (session, results) {
        session.dialogData.eightQuestion = results.response;
        builder.Prompts.confirm(
            session,
            'The training was conducted in a conducive and well-equipped environment.',
            {
                listStyle: builder.ListStyle.button,
                maxRetries: 1,
                retryPrompt: ["Please choose one option", "I would request you to please select one of these options"]
            });
    },
    function (session, results) {
        session.dialogData.nineQuestion = results.response;
        builder.Prompts.text(session, 'What is at least one learning that you can take from this session?')
    },
    function (session, results) {
        session.dialogData.tenQuestion = results.response;
        builder.Prompts.text(session, 'How can this training be further improved for better results – give at least 1 recommendation')
    },
    function (session, results) {
        session.dialogData.elevenQuestion = results.response;
        builder.Prompts.text(session, 'Do you have any other feedback for improvement.')
    },
    function (session, results) {
        session.dialogData.twelveQuestion = results.response;
        builder.Prompts.choice(
            session,
            'Overall Rating',
            [RatingDialogLabels.One, RatingDialogLabels.Two, RatingDialogLabels.Three, RatingDialogLabels.Four, RatingDialogLabels.Five],
            {
                listStyle: builder.ListStyle.button,
                maxRetries: 1,
                retryPrompt: ["Please choose one option", "I would request you to please select one of these options"]
            });
    },
    function (session, results) {
        session.dialogData.thirteenQuestion = results.response;
        session.send("Training Session Feedback details: <br/>1- %s <br/>2- %s <br/>3- %s",
            session.dialogData.oneQuestion.entity, session.dialogData.twoQuestion.entity, session.dialogData.threeQuestion.entity);
        session.send("Thanks for filling your feedback (bow)");
        session.endDialog();

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


bot.dialog('help', function (session, args, next) {
    session.endDialog("This is a help section. <br/>Please say 'next' to continue");
})
    .triggerAction({
        matches: /^help$/i,
        onSelectAction: (session, args, next) => {
            // Add the help dialog to the dialog stack
            // (override the default behavior of replacing the stack)
            session.beginDialog(args.action, args);
        }
    });




