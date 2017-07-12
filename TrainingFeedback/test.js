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


// //Bot on
// bot.on('contactRelationUpdate', function (message) {
//     if (message.action === 'add') {
//         var name = message.user ? message.user.name : null;
//         var reply = new builder.Message()
//             .address(message.address)
//             .text("Hello %s, Thanks for adding me. I am a training feedback bot that will ask you for the " +
//                 "feedback form for your attended sessions", name || 'there');
//         bot.send(reply);
//     } else {
//         console.log("User ask for deleting data")
//         // delete their data
//     }
// });
// bot.on('typing', function (message) {
//     console.log("User is typing" + message);
//     // User is typing
// });
// bot.on('deleteUserData', function (message) {
//     console.log("User has asked for deleting data" + message);
//     // User asked to delete their data
// });
//
//
// var DialogLabels = {
//     Yes: 'Start',
//     Later: 'Later',
//     No: 'Not Filling'
// };
//
// var RatingDialogLabels = {
//     One: '1',
//     Two: '2',
//     Three: '3',
//     Four: '4',
//     Five: '5'
// };
//
// var ConfirmDialogLabels = {
//     Yes: 'Yes',
//     No: 'No'
// }
//
//
// var bot = new builder.UniversalBot(connector, [
//     function (session) {
//         session.sendTyping();
//         setTimeout(function () {
//             session.send(i18n.__('Welcome'));
//             session.send("You have just attended the session. We request you to fill the feedback form ASAP. ");
//             builder.Prompts.choice(
//                 session,
//                 'What would you like to do?',
//                 [DialogLabels.Yes, DialogLabels.Later, DialogLabels.No],
//                 {
//                     listStyle: builder.ListStyle.button,
//                     maxRetries: 1,
//                     retryPrompt: ["Please choose one option", "I would request you to please select one of these options"]
//                 });
//         }, 3000);
//     },
//     function (session, results) {
//         if (results.response) {
//             var selectedOptionIndex = results.response.index;
//             switch (selectedOptionIndex) {
//                 case 0:
//                     session.send("Here are the questions-:");
//                     session.beginDialog('startFeedbackQuestions');
//                     break;
//
//                 case 1:
//                     builder.Prompts.time(session, "Can you please enter the time so that I can remind you at that time? (e.g.: June 6th at 5pm)");
//                     break;
//
//                 case 2:
//                     session.beginDialog('notFillingFeedback');
//                     break;
//
//                 default:
//                     session.send("Sorry I couldn't get you. It seems you have entered something else. " +
//                         "Can you please try 'Help' for how to proceed and then type 'Start' again");
//                     break;
//
//             }
//
//         } else {
//             session.send("There is some problem, please try after some time");
//         }
//     }
// ]);
//
// // Dialog that will start asking questions to user
// bot.dialog('startFeedbackQuestions', [
//     function (session) {
//         builder.Prompts.choice(
//             session,
//             'The trainer seemed knowledgeable of the training area.',
//             [RatingDialogLabels.One, RatingDialogLabels.Two, RatingDialogLabels.Three, RatingDialogLabels.Four, RatingDialogLabels.Five],
//             {
//                 listStyle: builder.ListStyle.button,
//                 maxRetries: 1,
//                 retryPrompt: ["Please choose one option", "I would request you to please select one of these options"]
//             });
//     },
//     function (session, results) {
//         session.dialogData.oneQuestion = results.response;
//         builder.Prompts.choice(
//             session,
//             'The trainer presented the contents well.',
//             [RatingDialogLabels.One, RatingDialogLabels.Two, RatingDialogLabels.Three, RatingDialogLabels.Four, RatingDialogLabels.Five],
//             {
//                 listStyle: builder.ListStyle.button,
//                 maxRetries: 1,
//                 retryPrompt: ["Please choose one option", "I would request you to please select one of these options"]
//             });
//     },
//     function (session, results) {
//         session.dialogData.twoQuestion = results.response;
//         builder.Prompts.choice(
//             session,
//             'The trainer was able to engage with the participants to make the session interactive and interesting',
//             [RatingDialogLabels.One, RatingDialogLabels.Two, RatingDialogLabels.Three, RatingDialogLabels.Four, RatingDialogLabels.Five],
//             {
//                 listStyle: builder.ListStyle.button,
//                 maxRetries: 1,
//                 retryPrompt: ["Please choose one option", "I would request you to please select one of these options"]
//             });
//     },
//     function (session, results) {
//         session.dialogData.threeQuestion = results.response;
//         builder.Prompts.choice(
//             session,
//             'The training has enabled me to put my learning into practice now or will be able to use my learning in the future',
//             [RatingDialogLabels.One, RatingDialogLabels.Two, RatingDialogLabels.Three, RatingDialogLabels.Four, RatingDialogLabels.Five],
//             {
//                 listStyle: builder.ListStyle.button,
//                 maxRetries: 1,
//                 retryPrompt: ["Please choose one option", "I would request you to please select one of these options"]
//             });
//     },
//     function (session, results) {
//         session.dialogData.fourQuestion = results.response;
//         builder.Prompts.choice(
//             session,
//             'Content was easy to understand and inline with my expectations from the session.',
//             [RatingDialogLabels.One, RatingDialogLabels.Two, RatingDialogLabels.Three, RatingDialogLabels.Four, RatingDialogLabels.Five],
//             {
//                 listStyle: builder.ListStyle.button,
//                 maxRetries: 1,
//                 retryPrompt: ["Please choose one option", "I would request you to please select one of these options"]
//             });
//     },
//     function (session, results) {
//         session.dialogData.fiveQuestion = results.response;
//         builder.Prompts.choice(
//             session,
//             'I would recommend this course to other team members',
//             [RatingDialogLabels.One, RatingDialogLabels.Two, RatingDialogLabels.Three, RatingDialogLabels.Four, RatingDialogLabels.Five],
//             {
//                 listStyle: builder.ListStyle.button,
//                 maxRetries: 1,
//                 retryPrompt: ["Please choose one option", "I would request you to please select one of these options"]
//             });
//     },
//     function (session, results) {
//         session.dialogData.sixQuestion = results.response;
//         builder.Prompts.confirm(
//             session,
//             'The training started at the scheduled time.',
//             "Yes", "No",
//             {
//                 listStyle: builder.ListStyle.button,
//                 maxRetries: 1,
//                 retryPrompt: ["Please choose one option", "I would request you to please select one of these options"]
//             });
//     },
//     function (session, results) {
//         session.dialogData.sevenQuestion = results.response;
//         builder.Prompts.confirm(
//             session,
//             'I was given enough notification for the training to plan my product tasks accordingly.',
//             {
//                 listStyle: builder.ListStyle.button,
//                 maxRetries: 1,
//                 retryPrompt: ["Please choose one option", "I would request you to please select one of these options"]
//             });
//     },
//     function (session, results) {
//         session.dialogData.eightQuestion = results.response;
//         builder.Prompts.confirm(
//             session,
//             'The training was conducted in a conducive and well-equipped environment.',
//             {
//                 listStyle: builder.ListStyle.button,
//                 maxRetries: 1,
//                 retryPrompt: ["Please choose one option", "I would request you to please select one of these options"]
//             });
//     },
//     function (session, results) {
//         session.dialogData.nineQuestion = results.response;
//         builder.Prompts.text(session, 'What is at least one learning that you can take from this session?')
//     },
//     function (session, results) {
//         session.dialogData.tenQuestion = results.response;
//         builder.Prompts.text(session, 'How can this training be further improved for better results – give at least 1 recommendation')
//     },
//     function (session, results) {
//         session.dialogData.elevenQuestion = results.response;
//         builder.Prompts.text(session, 'Do you have any other feedback for improvement.')
//     },
//     function (session, results) {
//         session.dialogData.twelveQuestion = results.response;
//         builder.Prompts.choice(
//             session,
//             'Overall Rating',
//             [RatingDialogLabels.One, RatingDialogLabels.Two, RatingDialogLabels.Three, RatingDialogLabels.Four, RatingDialogLabels.Five],
//             {
//                 listStyle: builder.ListStyle.button,
//                 maxRetries: 1,
//                 retryPrompt: ["Please choose one option", "I would request you to please select one of these options"]
//             });
//     },
//     function (session, results) {
//         session.dialogData.thirteenQuestion = results.response;
//         session.send("Training Session Feedback details: <br/>1- %s <br/>2- %s <br/>3- %s",
//             session.dialogData.oneQuestion.entity, session.dialogData.twoQuestion.entity, session.dialogData.threeQuestion.entity);
//         session.send("Thanks for filling your feedback (bow)");
//         session.endDialog();
//
//     }
// ]);
//
// // Dialog that will ask user the reason of not filling the feedback form
// bot.dialog('notFillingFeedback', [
//     function (session) {
//         builder.Prompts.text(session, "Can you please write the reason why you don't want to fill the feedback form?");
//     },
//     function (session, results) {
//         session.dialogData.notFillingFeedbackReason = results.response;
//         session.send("The reason is: " + session.dialogData.notFillingFeedbackReason);
//         session.endDialog();
//     }
// ]);
//
//
// bot.dialog('help', function (session, args, next) {
//     session.endDialog("This is a help section. How can I help you? <br/> What would you like to choose");
// })
//     .triggerAction({
//         matches: /^help$/i,
//         onSelectAction: (session, args, next) => {
//             // Add the help dialog to the dialog stack
//             // (override the default behavior of replacing the stack)
//             session.beginDialog(args.action, args);
//         }
//     });

//-----------------------------

// var bot = new builder.UniversalBot(connector, [
//     function (session) {
//         session.send("Hello... I'm a decision bot.");
//         session.beginDialog('rootMenu');
//     },
//     function (session, results) {
//         session.endConversation("Goodbye until next time...");
//     }
// ]);
//
// // Add root menu dialog
// bot.dialog('rootMenu', [
//     function (session) {
//         builder.Prompts.choice(session, "Choose an option:", 'Flip A Coin|Roll Dice|Magic 8-Ball|Quit');
//     },
//     function (session, results) {
//         switch (results.response.index) {
//             case 0:
//                 session.beginDialog('flipCoinDialog');
//                 break;
//             case 1:
//                 session.beginDialog('rollDiceDialog');
//                 break;
//             case 2:
//                 session.beginDialog('magicBallDialog');
//                 break;
//             default:
//                 session.endDialog();
//                 break;
//         }
//     },
//     function (session) {
//         // Reload menu
//         session.replaceDialog('rootMenu');
//     }
// ]).reloadAction('showMenu', null, { matches: /^(menu|back)/i });
//
// // Flip a coin
// bot.dialog('flipCoinDialog', [
//     function (session, args) {
//         builder.Prompts.choice(session, "Choose heads or tails.", "heads|tails", { listStyle: builder.ListStyle.none })
//     },
//     function (session, results) {
//         var flip = Math.random() > 0.5 ? 'heads' : 'tails';
//         if (flip == results.response.entity) {
//             session.endDialog("It's %s. YOU WIN!", flip);
//         } else {
//             session.endDialog("Sorry... It was %s. you lost :(", flip);
//         }
//     }
// ]);
//
// // Roll some dice
// bot.dialog('rollDiceDialog', [
//     function (session, args) {
//         builder.Prompts.number(session, "How many dice should I roll?");
//     },
//     function (session, results) {
//         if (results.response > 0) {
//             var msg = "I rolled:";
//             for (var i = 0; i < results.response; i++) {
//                 var roll = Math.floor(Math.random() * 6) + 1;
//                 msg += ' ' + roll.toString();
//             }
//             session.endDialog(msg);
//         } else {
//             session.endDialog("Ummm... Ok... I rolled air.");
//         }
//     }
// ]);
//
// // Magic 8-Ball
// bot.dialog('magicBallDialog', [
//     function (session, args) {
//         builder.Prompts.text(session, "What is your question?");
//     },
//     function (session, results) {
//         // Use the SDK's built-in ability to pick a response at random.
//         session.endDialog(magicAnswers);
//     }
// ]);
//
// var magicAnswers = [
//     "It is certain",
//     "It is decidedly so",
//     "Without a doubt",
//     "Yes, definitely",
//     "You may rely on it",
//     "As I see it, yes",
//     "Most likely",
//     "Outlook good",
//     "Yes",
//     "Signs point to yes",
//     "Reply hazy try again",
//     "Ask again later",
//     "Better not tell you now",
//     "Cannot predict now",
//     "Concentrate and ask again",
//     "Don't count on it",
//     "My reply is no",
//     "My sources say no",
//     "Outlook not so good",
//     "Very doubtful"
// ];


// const bot = new builder.UniversalBot(connector, [
//     (session, args, next) => {
//
//         const card = new builder.ThumbnailCard(session);
//         card.buttons([
//             new builder.CardAction(session).title('Add a number').value('Add').type('imBack'),
//             new builder.CardAction(session).title('Get help').value('Help').type('imBack'),
//         ]).text(`What would you like to do?`);
//
//         const message = new builder.Message(session);
//         message.addAttachment(card);
//
//         session.send(`Hi there! I'm the calculator bot! I can add numbers for you.`);
//         // we can end the conversation here
//         // the buttons will provide the appropriate message
//         session.endConversation(message);
//     },
// ]);
//
// bot.dialog('AddNumber', [
//     (session, args, next) => {
//         let message = null;
//         if(!session.privateConversationData.runningTotal) {
//             message = `Give me the first number.`;
//             session.privateConversationData.runningTotal = 0;
//         } else {
//             message = `Give me the next number, or say **total** to display the total.`;
//         }
//         builder.Prompts.number(session, message, {maxRetries: 3});
//     },
//     (session, results, next) => {
//         if(results.response) {
//             session.privateConversationData.runningTotal += results.response;
//             session.replaceDialog('AddNumber');
//         } else {
//             session.endConversation(`Sorry, I don't understand. Let's start over.`);
//         }
//     },
// ])
//     .triggerAction({matches: /^add$/i})
//     .cancelAction('CancelAddNumber', 'Operation cancelled', {
//         matches: /^cancel$/,
//         onSelectAction: (session, args) => {
//             session.endConversation(`Operation cancelled.`);
//         },
//         confirmPrompt: `Are you sure you wish to cancel?`
//     })
//     .beginDialogAction('Total', 'Total', { matches: /^total$/})
//     .beginDialogAction('HelpAddNumber', 'Help', { matches: /^help$/, dialogArgs: {action: 'AddNumber'} });
//
// bot.dialog('Total', [
//     (session, results, next) => {
//         session.endConversation(`The total is ${session.privateConversationData.runningTotal}`);
//     },
// ]);
//
// bot.dialog('Help', [
//     (session, args, next) => {
//         let message = '';
//         switch(args.action) {
//             case 'AddNumber':
//                 message = 'You can either type the next number, or use **total** to get the total.';
//                 break;
//             default:
//                 message = 'You can type **add** to add numbers.';
//                 break;
//         }
//         session.endDialog(message);
//     }
// ]).triggerAction({
//     matches: /^help/i,
//     onSelectAction: (session, args) => {
//         session.beginDialog(args.action, args);
//     }
// });


//------------------------

//=========================================================
// Activity Events
//=========================================================

bot.on('conversationUpdate', function (message) {
    // Check for group conversations
    if (message.address.conversation.isGroup) {
        // Send a hello message when bot is added
        if (message.membersAdded) {
            message.membersAdded.forEach(function (identity) {
                if (identity.id === message.address.bot.id) {
                    var reply = new builder.Message()
                        .address(message.address)
                        .text("Hello everyone!");
                    bot.send(reply);
                }
            });
        }

        // Send a goodbye message when bot is removed
        if (message.membersRemoved) {
            message.membersRemoved.forEach(function (identity) {
                if (identity.id === message.address.bot.id) {
                    var reply = new builder.Message()
                        .address(message.address)
                        .text("Goodbye");
                    bot.send(reply);
                }
            });
        }
    }
});

bot.on('contactRelationUpdate', function (message) {
    if (message.action === 'add') {
        var name = message.user ? message.user.name : null;
        var reply = new builder.Message()
            .address(message.address)
            .text("Hello %s... Thanks for adding me. Say 'hello' to see some great demos.", name || 'there');
        bot.send(reply);
    } else {
        // delete their data
        console.log("Delete bot");
    }
});

bot.on('deleteUserData', function (message) {
    // User asked to delete their data
    console.log("User has asked to delete bot");
});


//=========================================================
// Bots Middleware
//=========================================================

// Anytime the major version is incremented any existing conversations will be restarted.
bot.use(builder.Middleware.dialogVersion({ version: 1.0, resetCommand: /^reset/i }));

//=========================================================
// Bots Global Actions
//=========================================================

bot.endConversationAction('goodbye', 'Goodbye :)', { matches: /^goodbye/i });
bot.beginDialogAction('help', '/help', { matches: /^help/i });

//=========================================================
// Bots Dialogs
//=========================================================

bot.dialog('/', [
    function (session) {
        // Send a greeting and show help.
        var card = new builder.HeroCard(session)
            .title("Microsoft Bot Framework")
            .text("Your bots - wherever your users are talking.")
            .images([
                builder.CardImage.create(session, "http://docs.botframework.com/images/demo_bot_image.png")
            ]);
        var msg = new builder.Message(session).attachments([card]);
        session.send(msg);
        session.send("Hi... I'm the Microsoft Bot Framework demo bot for Skype. I can show you everything you can use our Bot Builder SDK to do on Skype.");
        session.beginDialog('/help');
    },
    function (session, results) {
        // Display menu
        session.beginDialog('/menu');
    },
    function (session, results) {
        // Always say goodbye
        session.send("Ok... See you later!");
    }
]);

bot.dialog('/menu', [
    function (session) {
        builder.Prompts.choice(session, "What demo would you like to run?", "prompts|picture|cards|list|carousel|receipt|actions|(quit)");
    },
    function (session, results) {
        if (results.response && results.response.entity != '(quit)') {
            // Launch demo dialog
            session.beginDialog('/' + results.response.entity);
        } else {
            // Exit the menu
            session.endDialog();
        }
    },
    function (session, results) {
        // The menu runs a loop until the user chooses to (quit).
        session.replaceDialog('/menu');
    }
]).reloadAction('reloadMenu', null, { matches: /^menu|show menu/i });

bot.dialog('/help', [
    function (session) {
        session.endDialog("Global commands that are available anytime:\n\n* menu - Exits a demo and returns to the menu.\n* goodbye - End this conversation.\n* help - Displays these commands.");
    }
]);

bot.dialog('/prompts', [
    function (session) {
        session.send("Our Bot Builder SDK has a rich set of built-in prompts that simplify asking the user a series of questions. This demo will walk you through using each prompt. Just follow the prompts and you can quit at any time by saying 'cancel'.");
        builder.Prompts.text(session, "Prompts.text()\n\nEnter some text and I'll say it back.");
    },
    function (session, results) {
        session.send("You entered '%s'", results.response);
        builder.Prompts.number(session, "Prompts.number()\n\nNow enter a number.");
    },
    function (session, results) {
        session.send("You entered '%s'", results.response);
        session.send("Bot Builder includes a rich choice() prompt that lets you offer a user a list choices to pick from. On Skype these choices by default surface using buttons if there are 3 or less choices. If there are more than 3 choices a numbered list will be used but you can specify the exact type of list to show using the ListStyle property.");
        builder.Prompts.choice(session, "Prompts.choice()\n\nChoose a list style (the default is auto.)", "auto|inline|list|button|none");
    },
    function (session, results) {
        var style = builder.ListStyle[results.response.entity];
        builder.Prompts.choice(session, "Prompts.choice()\n\nNow pick an option.", "option A|option B|option C", { listStyle: style });
    },
    function (session, results) {
        session.send("You chose '%s'", results.response.entity);
        builder.Prompts.confirm(session, "Prompts.confirm()\n\nSimple yes/no questions are possible. Answer yes or no now.");
    },
    function (session, results) {
        session.send("You chose '%s'", results.response ? 'yes' : 'no');
        builder.Prompts.time(session, "Prompts.time()\n\nThe framework can recognize a range of times expressed as natural language. Enter a time like 'Monday at 7am' and I'll show you the JSON we return.");
    },
    function (session, results) {
        session.send("Recognized Entity: %s", JSON.stringify(results.response));
        builder.Prompts.attachment(session, "Prompts.attachment()\n\nYour bot can wait on the user to upload an image or video. Send me an image and I'll send it back to you.");
    },
    function (session, results) {
        var msg = new builder.Message(session)
            .ntext("I got %d attachment.", "I got %d attachments.", results.response.length);
        results.response.forEach(function (attachment) {
            msg.addAttachment(attachment);
        });
        session.endDialog(msg);
    }
]);

bot.dialog('/picture', [
    function (session) {
        session.send("You can easily send pictures to a user...");
        var msg = new builder.Message(session)
            .attachments([{
                contentType: "image/jpeg",
                contentUrl: "http://www.theoldrobots.com/images62/Bender-18.JPG"
            }]);
        session.endDialog(msg);
    }
]);

bot.dialog('/cards', [
    function (session) {
        session.send("You can use Hero & Thumbnail cards to send the user visually rich information...");

        var msg = new builder.Message(session)
            .textFormat(builder.TextFormat.xml)
            .attachments([
                new builder.HeroCard(session)
                    .title("Hero Card")
                    .subtitle("Space Needle")
                    .text("The <b>Space Needle</b> is an observation tower in Seattle, Washington, a landmark of the Pacific Northwest, and an icon of Seattle.")
                    .images([
                        builder.CardImage.create(session, "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7c/Seattlenighttimequeenanne.jpg/320px-Seattlenighttimequeenanne.jpg")
                    ])
                    .tap(builder.CardAction.openUrl(session, "https://en.wikipedia.org/wiki/Space_Needle"))
            ]);
        session.send(msg);

        msg = new builder.Message(session)
            .textFormat(builder.TextFormat.xml)
            .attachments([
                new builder.VideoCard(session)
                    .title("Video Card")
                    .subtitle("Microsoft Band")
                    .text("This is Microsoft Band. For people who want to live healthier and achieve more there is Microsoft Band. Reach your health and fitness goals by tracking your heart rate, exercise, calorie burn, and sleep quality, and be productive with email, text, and calendar alerts on your wrist.")
                    .image(builder.CardImage.create(session, "https://tse1.mm.bing.net/th?id=OVP.Vffb32d4de3ecaecb56e16cadca8398bb&w=150&h=84&c=7&rs=1&pid=2.1"))
                    .media([
                        builder.CardMedia.create(session, "http://video.ch9.ms/ch9/08e5/6a4338c7-8492-4688-998b-43e164d908e5/thenewmicrosoftband2_mid.mp4")
                    ])
                    .autoloop(true)
                    .autostart(false)
                    .shareable(true)
            ]);
        session.send(msg);

        msg = new builder.Message(session)
            .textFormat(builder.TextFormat.xml)
            .attachments([
                new builder.ThumbnailCard(session)
                    .title("Thumbnail Card")
                    .subtitle("Pikes Place Market")
                    .text("<b>Pike Place Market</b> is a public market overlooking the Elliott Bay waterfront in Seattle, Washington, United States.")
                    .images([
                        builder.CardImage.create(session, "https://upload.wikimedia.org/wikipedia/en/thumb/2/2a/PikePlaceMarket.jpg/320px-PikePlaceMarket.jpg")
                    ])
                    .tap(builder.CardAction.openUrl(session, "https://en.wikipedia.org/wiki/Pike_Place_Market"))
            ]);
        session.endDialog(msg);
    }
]);

bot.dialog('/list', [
    function (session) {
        session.send("You can send the user a list of cards as multiple attachments in a single message...");

        var msg = new builder.Message(session)
            .textFormat(builder.TextFormat.xml)
            .attachments([
                new builder.HeroCard(session)
                    .title("Hero Card")
                    .subtitle("Space Needle")
                    .text("The <b>Space Needle</b> is an observation tower in Seattle, Washington, a landmark of the Pacific Northwest, and an icon of Seattle.")
                    .images([
                        builder.CardImage.create(session, "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7c/Seattlenighttimequeenanne.jpg/320px-Seattlenighttimequeenanne.jpg")
                    ]),
                new builder.ThumbnailCard(session)
                    .title("Thumbnail Card")
                    .subtitle("Pikes Place Market")
                    .text("<b>Pike Place Market</b> is a public market overlooking the Elliott Bay waterfront in Seattle, Washington, United States.")
                    .images([
                        builder.CardImage.create(session, "https://upload.wikimedia.org/wikipedia/en/thumb/2/2a/PikePlaceMarket.jpg/320px-PikePlaceMarket.jpg")
                    ])
            ]);
        session.endDialog(msg);
    }
]);

bot.dialog('/carousel', [
    function (session) {
        session.send("You can pass a custom message to Prompts.choice() that will present the user with a carousel of cards to select from. Each card can even support multiple actions.");

        // Ask the user to select an item from a carousel.
        var msg = new builder.Message(session)
            .textFormat(builder.TextFormat.xml)
            .attachmentLayout(builder.AttachmentLayout.carousel)
            .attachments([
                new builder.HeroCard(session)
                    .title("Space Needle")
                    .text("The <b>Space Needle</b> is an observation tower in Seattle, Washington, a landmark of the Pacific Northwest, and an icon of Seattle.")
                    .images([
                        builder.CardImage.create(session, "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7c/Seattlenighttimequeenanne.jpg/320px-Seattlenighttimequeenanne.jpg")
                            .tap(builder.CardAction.showImage(session, "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7c/Seattlenighttimequeenanne.jpg/800px-Seattlenighttimequeenanne.jpg")),
                    ])
                    .buttons([
                        builder.CardAction.openUrl(session, "https://en.wikipedia.org/wiki/Space_Needle", "Wikipedia"),
                        builder.CardAction.imBack(session, "select:100", "Select")
                    ]),
                new builder.HeroCard(session)
                    .title("Pikes Place Market")
                    .text("<b>Pike Place Market</b> is a public market overlooking the Elliott Bay waterfront in Seattle, Washington, United States.")
                    .images([
                        builder.CardImage.create(session, "https://upload.wikimedia.org/wikipedia/en/thumb/2/2a/PikePlaceMarket.jpg/320px-PikePlaceMarket.jpg")
                            .tap(builder.CardAction.showImage(session, "https://upload.wikimedia.org/wikipedia/en/thumb/2/2a/PikePlaceMarket.jpg/800px-PikePlaceMarket.jpg")),
                    ])
                    .buttons([
                        builder.CardAction.openUrl(session, "https://en.wikipedia.org/wiki/Pike_Place_Market", "Wikipedia"),
                        builder.CardAction.imBack(session, "select:101", "Select")
                    ]),
                new builder.HeroCard(session)
                    .title("EMP Museum")
                    .text("<b>EMP Musem</b> is a leading-edge nonprofit museum, dedicated to the ideas and risk-taking that fuel contemporary popular culture.")
                    .images([
                        builder.CardImage.create(session, "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a0/Night_Exterior_EMP.jpg/320px-Night_Exterior_EMP.jpg")
                            .tap(builder.CardAction.showImage(session, "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a0/Night_Exterior_EMP.jpg/800px-Night_Exterior_EMP.jpg"))
                    ])
                    .buttons([
                        builder.CardAction.openUrl(session, "https://en.wikipedia.org/wiki/EMP_Museum", "Wikipedia"),
                        builder.CardAction.imBack(session, "select:102", "Select")
                    ])
            ]);
        builder.Prompts.choice(session, msg, "select:100|select:101|select:102");
    },
    function (session, results) {
        var action, item;
        var kvPair = results.response.entity.split(':');
        switch (kvPair[0]) {
            case 'select':
                action = 'selected';
                break;
        }
        switch (kvPair[1]) {
            case '100':
                item = "the <b>Space Needle</b>";
                break;
            case '101':
                item = "<b>Pikes Place Market</b>";
                break;
            case '102':
                item = "the <b>EMP Museum</b>";
                break;
        }
        session.endDialog('You %s "%s"', action, item);
    }
]);

bot.dialog('/receipt', [
    function (session) {
        session.send("You can send a receipts for purchased good with both images and without...");

        // Send a receipt with images
        var msg = new builder.Message(session)
            .attachments([
                new builder.ReceiptCard(session)
                    .title("Recipient's Name")
                    .items([
                        builder.ReceiptItem.create(session, "$22.00", "EMP Museum").image(builder.CardImage.create(session, "https://upload.wikimedia.org/wikipedia/commons/a/a0/Night_Exterior_EMP.jpg")),
                        builder.ReceiptItem.create(session, "$22.00", "Space Needle").image(builder.CardImage.create(session, "https://upload.wikimedia.org/wikipedia/commons/7/7c/Seattlenighttimequeenanne.jpg"))
                    ])
                    .facts([
                        builder.Fact.create(session, "1234567898", "Order Number"),
                        builder.Fact.create(session, "VISA 4076", "Payment Method"),
                        builder.Fact.create(session, "WILLCALL", "Delivery Method")
                    ])
                    .tax("$4.40")
                    .total("$48.40")
            ]);
        session.send(msg);

        // Send a receipt without images
        msg = new builder.Message(session)
            .attachments([
                new builder.ReceiptCard(session)
                    .title("Recipient's Name")
                    .items([
                        builder.ReceiptItem.create(session, "$22.00", "EMP Museum"),
                        builder.ReceiptItem.create(session, "$22.00", "Space Needle")
                    ])
                    .facts([
                        builder.Fact.create(session, "1234567898", "Order Number"),
                        builder.Fact.create(session, "VISA 4076", "Payment Method"),
                        builder.Fact.create(session, "WILLCALL", "Delivery Method")
                    ])
                    .tax("$4.40")
                    .total("$48.40")
            ]);
        session.endDialog(msg);
    }
]);

bot.dialog('/signin', [
    function (session) {
        // Send a signin
        var msg = new builder.Message(session)
            .attachments([
                new builder.SigninCard(session)
                    .text("You must first signin to your account.")
                    .button("signin", "http://example.com/")
            ]);
        session.endDialog(msg);
    }
]);


bot.dialog('/actions', [
    function (session) {
        session.send("Bots can register global actions, like the 'help' & 'goodbye' actions, that can respond to user input at any time. You can even bind actions to buttons on a card.");

        var msg = new builder.Message(session)
            .textFormat(builder.TextFormat.xml)
            .attachments([
                new builder.HeroCard(session)
                    .title("Hero Card")
                    .subtitle("Space Needle")
                    .text("The <b>Space Needle</b> is an observation tower in Seattle, Washington, a landmark of the Pacific Northwest, and an icon of Seattle.")
                    .images([
                        builder.CardImage.create(session, "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7c/Seattlenighttimequeenanne.jpg/320px-Seattlenighttimequeenanne.jpg")
                    ])
                    .buttons([
                        builder.CardAction.dialogAction(session, "weather", "Seattle, WA", "Current Weather")
                    ])
            ]);
        session.send(msg);

        session.endDialog("The 'Current Weather' button on the card above can be pressed at any time regardless of where the user is in the conversation with the bot. The bot can even show the weather after the conversation has ended.");
    }
]);

// Create a dialog and bind it to a global action
bot.dialog('/weather', [
    function (session, args) {
        session.endDialog("The weather in %s is 71 degrees and raining.", args.data);
    }
]);
bot.beginDialogAction('weather', '/weather');   // <-- no 'matches' option means this can only be triggered by a button.





