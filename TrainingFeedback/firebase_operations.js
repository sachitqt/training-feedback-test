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
    apiKey: "AIzaSyBU4p6ZhtVa1pijJXv4jxzHqb3vqa23tZ4",
    authDomain: "trainingfeedback-37dcb.firebaseapp.com",
    databaseURL: "https://trainingfeedback-37dcb.firebaseio.com",
    projectId: "trainingfeedback-37dcb",
    storageBucket: "",
    messagingSenderId: "499900088369"
};
firebase.initializeApp(config);

module.exports = {
    saveQuestionsToDB: function (questions) {
        writeQuestionsToFirebase(questions);
    },
    saveFeedbackToDB: function (trainingId, userId, questionAnswers) {
        saveTrainingFeedback(trainingId, userId, questionAnswers);
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
    firebase.database().ref('users/' + userData.FirstName + userData.LastName).set({
        employeeId: userData.EmployeeID,
        firstName: userData.FirstName,
        lastName: userData.LastName,
        fullName: userData.FirstName + ' ' + userData.LastName,
        emailId: userData.EmailId,
        skypeId: userData.SkypeId
    });
}

function saveTrainingFeedback(trainingId, userId, questionAnswers) {
    let questionAnswerData = {};
    for (let index = 0; index < questionAnswers.length; index++) {
        questionAnswerData[questionAnswers[index].question.replace('.', '')] = questionAnswers[index].answer;
    }
    console.log(questionAnswerData);
    firebase.database().ref('trainingFeedback/' + trainingId).push({
        trainingId: trainingId,
        userId: userId,
        questionAnswers: questionAnswerData
    });
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
    for (let index = 0; index < attendees.length; index++) {
        firebase.database().ref('trainings/' + id.path.o[1] + '/attendees/' + index).set({
            attendeeName: attendees[index],
            isAttended: true,
        });
        firebase.database().ref('pendingFeedback/').push({
            attendeeName: attendees[index],
            trainingId: id.path.o[1],
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

writeQuestionsToFirebase(i18n.__('questions'));
// saveUserData();
// fetchNonFilledTrainings();
// fetchTrainingData();
// saveTrainingData('Espresso', 'LipikaGupta', ['SachitWadhawan', 'PraweenMishra', 'SahilGoel'], 'June');
// saveTrainingData('Machine Learning', 'SachitWadhawan', ['LipikaGupta', 'PraweenMishra', 'SahilGoel'], 'June');
// saveTrainingData('MVP', 'VikasGoyal', ['LipikaGupta', 'SachitWadhawan', 'PraweenMishra', 'SahilGoel'], 'June');
// saveTrainingFeedback(0, 1, "");
