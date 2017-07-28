let firebase = require('firebase')
let exceltojson = require("xls-to-json-lc");
let xlsxtojson = require("xlsx-to-json-lc");
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
    saveFeedbackToDB: function (trainingId, userId, questionAnswers) {
        getEmailIdFromUsername(userId, function (emailId) {
            if (emailId) {
                saveTrainingFeedback(trainingId, emailId, username, questionAnswers);
            }
        });
    },
    getUserEmailId: function (username, callbackFunction) {
        getEmailIdFromUsername(username, callbackFunction);
    },
    isFeedbackPendingForUser: function (username, callbackFunction) {
        getEmailIdFromUsername(username, function (emailId) {
            if (emailId) {
                isFeedbackPending(emailId, callbackFunction);
            }
        });
    },
    getPendingFeedbackForUser: function (username, callbackFunction) {
        getEmailIdFromUsername(username, function (emailId) {
            if (emailId) {
                getUserPendingFeedback(emailId, callbackFunction);
            }
        });
    },
    deleteUserPendingFeedback: function (trainingId, username) {
        getEmailIdFromUsername(username, function (emailId) {
            if (emailId) {
                deletePendingFeedback(trainingId, emailId);
            }
        });
    },
    addUserSession: function (username, address, skypeId) {
        firebase.database().ref('sessions/').push({
            username: username,
            address: address,
            skypeId: skypeId
        });
    },
    getUserSession: function (callbackFunction) {
        firebase.database().ref('session/').once('value', function (snapshot) {
            callbackFunction(snapshot);
        }, function (errorObject) {
            console.log('The read failed: ' + errorObject.code);
        })
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
    xlsxtojson({
        input: __dirname + '/user_data.xlsx',
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
    firebase.database().ref('users/' + userData.EmailID.replaceAll('.', ':')).set({
        employeeId: userData.EmployeeID,
        firstName: userData.FirstName,
        lastName: userData.LastName,
        fullName: userData.FirstName + ' ' + userData.LastName,
        emailId: userData.EmailID,
        skypeId: userData.SkypeID,
        title: userData.Title,
        currentProductTeam: userData.CurrentProductTeam,
        primaryReviewer: userData.PrimaryReviewer,
        practiceGroup: userData.PracticeGroup,
        practiceHead: userData.PracticeHead
    });
}

function saveTrainingFeedback(trainingId, userId, username, questionAnswers) {
    let questionAnswerData = {};
    for (let index = 0; index < questionAnswers.length; index++) {
        questionAnswerData[questionAnswers[index].question.replace('.', '')] = questionAnswers[index].answer;
    }
    firebase.database().ref('trainingFeedback/' + trainingId + '/' + userId.replaceAll('.', ':')).set({
        trainingId: trainingId,
        userId: userId,
        username: username,
        questionAnswers: questionAnswerData
    });
    firebase.database().ref('pendingFeedback/' + userId.replaceAll('.', ':') + '/' + trainingId).remove(function (error) {
        console.log(error);
    })
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

function getUserPendingFeedback(emailId, callbackFunction) {
    firebase.database().ref('pendingFeedback/' + emailId.replaceAll('.', ':')).once('value', function (snapshot) {
        callbackFunction(snapshot);
    }, function (errorObject) {
        console.log("The read failed: " + errorObject.code);
    })
}

function deletePendingFeedback(trainingId, emailId) {
    firebase.database().ref('pendingFeedback/' + emailId.replaceAll('.', ':') + '/' + trainingId).remove();
}

String.prototype.replaceAll = function (str1, str2, ignore) {
    return this.replace(new RegExp(str1.replace(/([\/\,\!\\\^\$\{\}\[\]\(\)\.\*\+\?\|\<\>\-\&])/g, "\\$&"), (ignore ? "gi" : "g")), (typeof(str2) == "string") ? str2.replace(/\$/g, "$$$$") : str2);
}

