/**
 * Created by sachit on 03/08/17.
 */

var nodemailer = require('nodemailer');
let i18n = require("i18n");


i18n.configure({
    locales: ['en', 'de'],
    directory: __dirname + '/locales'
});


module.exports = {

    sendEmailToTMTeam: function sendEmail(session, username, text, feedback, fs) {

        var subject, path, mailOptions;

        subject = username + "- " + i18n.__('subject_feedback');
        path = "response/" + session.userData.firstName + ".csv";

        var transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: 'grubscrub22@gmail.com',
                pass: 'grubscrub@22'
            }
        });

        if (feedback) {
            mailOptions = {
                from: 'grubscrub22@gmail.com',
                to: 'sachit.wadhawan@quovantis.com',
                subject: subject,
                text: text,
                attachments: [{
                    filename: session.userData.firstName + '.csv',
                    path: path
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
                // session.send("Thanks **%s** for filling your feedback (bow)", session.userData.firstName);
                fs.unlinkSync(path);
            }
            transporter.close();
            deleteAllData(session);
            session.endDialog();
        });
    },

    buildQuestionForFeedback: function buildQuestionsAndOptions(session, questionObject, builder) {
        var question = questionObject.question;
        var options = questionObject.options;
        var questionsType = questionObject.question_type;
        var id = questionObject.id;
        var prompt = id + ". " + question;

        switch (questionsType){
            case "choice":
                builder.Prompts.choice(
                    session,
                    prompt,
                    options,
                    {
                        listStyle: builder.ListStyle.button,
                        retryPrompt: i18n.__('retry_prompt')
                    });
                break;

            case "text":
                builder.Prompts.text(session, prompt);
                break;
        }
    },

    optionAfterCompletingFeedback: function selectOptionAfterCompletingAnswer(session, results) {
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
    },

    doOperation: function operationOnAnswer(session, results) {
        if (results.response) {
            var selectedOptionIndex = results.response.index;
            switch (selectedOptionIndex) {
                case 0:
                    session.beginDialog("submitResponse");
                    break;

                case 1:
                    session.beginDialog("showFeedbackReview");
                    break;

                case 2:
                    session.replaceDialog('editing', {reprompt: true});
                    break;

                default:
                    break;

            }

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



