let firebase = require('firebase')
let exceltojson = require("xls-to-json-lc");
let i18n = require("i18n");

i18n.configure({
    locales: ['en', 'de'],
    directory: __dirname + '/locales'
});

//========================================================
//Initialize Firebase
//========================================================
let config = {
    apiKey: "AIzaSyBpguhnkqvKLkdnnjyicMNstu8lRgXQGYY",
    authDomain: "botsun-83f8c.firebaseapp.com",
    databaseURL: "https://botsun-83f8c.firebaseio.com",
    projectId: "botsun-83f8c",
    storageBucket: "botsun-83f8c.appspot.com",
    messagingSenderId: "673044083117"
};
firebase.initializeApp(config);

module.exports = {
    saveQuestionsToDB: function (questions) {
        writeQuestionsToFirebase(questions);
    },
    saveFeedbackToDB: function (trainingId, userId, questionAnswers) {
        saveFeedback(trainingId, userId, questionAnswers);
    },
    getUserEmailId: function (username, callbackFunction) {
        getEmailIdFromUsername(username, callbackFunction);
    },
    isFeedbackPendingForUser: function (username, callbackFunction){
        getEmailIdFromUsername(username, function (emailId) {
            if (emailId) {
                isFeedbackPending(emailId, callbackFunction);
            }
        });
    },
    getPendingFeedbackForUser: function (username, callbackFunction){
        getEmailIdFromUsername(username, function (emailId) {
            if (emailId) {
                getUserPendingFeedback(emailId, callbackFunction);
            }
        });
    }
};

/**
 * Used to write all question data to Firebase DB
 */
function writeQuestionsToFirebase(questions) {
    questions.forEach(function (question) {
        writeQuestionData(question.id, question.question, question.options, question.question_type);
    });
}

/**
 * It writes the questions along with its possible answers to Firebase DB
 * @param questionId the id of the question
 * @param question the question
 * @param answerOptions the possible answers
 */
function writeQuestionData(questionId, question, answerOptions, questionType) {
    firebase.database().ref('questions/' + questionId).set({
        questionId: questionId,
        question: question,
        answerChoices: answerOptions.length > 0 ? answerOptions : '',
        questionType: questionType,
        answer: ''
    });
}

function saveUserData() {
    exceltojson({
        input: __dirname + '/user_data.xls',
        output: null,
        lowerCaseHeaders: false //to convert all excel headers to lowr case in json
    }, function (err, result) {
        if (err) {
            console.error(err);
        } else {
            result.forEach(function (userData) {
                saveUser(userData);
            });
        }
    });
}

function saveUser(userData) {
    firebase.database().ref('users/' + userData.EmailId.replaceAll('.', ':')).set({
        employeeId: userData.EmployeeID,
        firstName: userData.FirstName,
        lastName: userData.LastName,
        fullName: userData.FirstName + ' ' + userData.LastName,
        emailId: userData.EmailId,
        skypeId: userData.SkypeId
    });
}

function saveFeedback(trainingId, userId, questionAnswers){
    getEmailIdFromUsername(userId, function (emailId) {
        if (emailId) {
            saveTrainingFeedback(trainingId, emailId, questionAnswers);
        }
    });
}

function saveTrainingFeedback(trainingId, userId, questionAnswers) {
    let questionAnswerData = {};
    for (let index = 0; index < questionAnswers.length; index++) {
        questionAnswerData[questionAnswers[index].question.replace('.', '')] = questionAnswers[index].answer;
    }
    firebase.database().ref('trainingFeedback/' + trainingId + '/' + userId.replaceAll('.', ':')).set({
        trainingId: trainingId,
        userId: userId,
        questionAnswers: questionAnswerData
    });
    firebase.database().ref('pendingFeedback/' + userId.replaceAll('.', ':') + '/' + trainingId).remove(function (error) {
        console.log(error);
    })
}

function fetchTrainingFeedback(trainingId) {
    firebase.database().ref('trainingFeedback/' + trainingId).once('value', function (snapshot) {
        console.log(snapshot.val());
    }, function (errorObject) {
        console.log("The read failed: " + errorObject.code);
    });
}

function saveTrainingData(trainingName, facilitator, attendees, trainingDate) {
    let id = firebase.database().ref('trainings/').push({
        trainingName: trainingName,
        facilitator: facilitator,
        trainingDate: trainingDate
    });
    let trainingId = id.path.o[1];
    for (let index = 0; index < attendees.length; index++) {
        firebase.database().ref('trainings/' + trainingId + '/attendees/' + index).set({
            attendeeName: attendees[index],
            isAttended: true,
        });
        firebase.database().ref('pendingFeedback/' + attendees[index].replaceAll('.', ':') + '/' + trainingId).set({
            attendeeName: attendees[index],
            trainingId: trainingId,
            userId: attendees[index]
        });
    }
}

function fetchTrainingData() {
    firebase.database().ref('trainings/').once('value', function (snapshot) {
        console.log(snapshot.val());
    }, function (errorObject) {
        console.log("The read failed: " + errorObject.code);
    });
}

function fetchNonFilledTrainings() {
    firebase.database().ref('pendingFeedback/').once('value', function (snapshot) {
        snapshot.forEach(function (child) {
            console.log(child.val())
        });
    }, function (errorObject) {
        console.log("The read failed: " + errorObject.code);
    });
}

function isFeedbackPending(userId, callbackFunction) {
    firebase.database().ref('pendingFeedback/' + userId.replaceAll('.', ':')).once('value', function (snapshot) {
        callbackFunction(!!snapshot.val());
    }, function (errorObject) {
        console.log("The read failed: " + errorObject.code);
    });
}

function getEmailIdFromUsername(username, callbackFunction) {
    firebase.database().ref('users/').once('value', function (snapshot) {
        snapshot.forEach(function (child) {
            let user = child.val();
            let emailId = '';
            if (user.firstName + ' ' + user.lastName === username) {
                emailId = user.emailId;
            }
            callbackFunction(emailId);
        })
    }, function (errorObject) {
        console.log("The read failed: " + errorObject.code);
    })
}

function getUserPendingFeedback(emailId, callbackFunction){
    firebase.database().ref('pendingFeedback/'+emailId.replaceAll('.', ':')).once('value', function (snapshot) {
        callbackFunction(snapshot);
    }, function (errorObject) {
        console.log("The read failed: " + errorObject.code);
    })
}

String.prototype.replaceAll = function (str1, str2, ignore) {
    return this.replace(new RegExp(str1.replace(/([\/\,\!\\\^\$\{\}\[\]\(\)\.\*\+\?\|\<\>\-\&])/g, "\\$&"), (ignore ? "gi" : "g")), (typeof(str2) == "string") ? str2.replace(/\$/g, "$$$$") : str2);
}

// function test(username, callbackFunction){
//     getEmailIdFromUsername(username, function (emailId) {
//         if (emailId) {
//             getUserPendingFeedback(emailId, callbackFunction);
//         }
//     });
// }


// getEmailIdFromUsername('Lipika Gupta', function (emailId) {
//     console.log(emailId);
// });
// isFeedbackPending('sahil.goel@quovantis.com', '-KpFmXgFygU3AsDywr8h', function(isFeedbackPending){
//     console.log('isFeedbackPending ' + isFeedbackPending);
// });
writeQuestionsToFirebase(i18n.__('questions'));
saveUserData();


// fetchNonFilledTrainings();
// fetchTrainingData();
// saveTrainingData('Espresso', 'lipika.gupta@quovantis.com', ['sachit.wadhawan@quovantis.com', 'praween.mishra@quovantis.com', 'sahil.goel@quovantis.com'], 'June');
// saveTrainingData('Machine Learning', 'sachit.wadhawan@quovantis.com', ['lipika.gupta@quovantis.com', 'praween.mishra@quovantis.com', 'sahil.goel@quovantis.com'], 'June');
// saveTrainingData('MVP', 'vikas.goyal@quovantis.com', ['gautam.gupta@quovantis.com', 'sumeet.mehta@quovantis.com', 'lipika.gupta@quovantis.com', 'sachit.wadhawan@quovantis.com', 'praween.mishra@quovantis.com', 'sahil.goel@quovantis.com'], 'June');
// saveTrainingFeedback(0, 1, "");
// saveFeedback('1', 'Lipika Gupta', "");
// test('Lipika Gupta', function (isFeedbackPending) {
//     console.log(isFeedbackPending);
// });

