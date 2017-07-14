var firebase = require('firebase')
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
 * It writes the questions along with its possible answers to Firebase DB
 * @param questionId the id of the question
 * @param question the question
 * @param answerOptions the possible answers
 */
function writeQuestionData(questionId, question, answerOptions) {
    firebase.database().ref('questions/' + questionId).set({
        questionId: questionId,
        question: question,
        answerChoices: answerOptions
    });
}

/**
 * Used to write all question data to Firebase DB
 */
function writeQuestionsToFirebase(questions) {
    writeQuestionData(0, questions[0], [1, 2, 3, 4, 5]);
    writeQuestionData(1, questions[1], [1, 2, 3, 4, 5]);
    writeQuestionData(2, questions[2], [1, 2, 3, 4, 5]);
    writeQuestionData(3, questions[3], [1, 2, 3, 4, 5]);
    writeQuestionData(4, questions[4], [1, 2, 3, 4, 5]);
    writeQuestionData(5, questions[5], [1, 2, 3, 4, 5]);
    writeQuestionData(6, questions[6], ['Yes', 'No']);
    writeQuestionData(7, questions[7], ['Yes', 'No']);
    writeQuestionData(8, questions[8], ['Yes', 'No']);
    writeQuestionData(9, questions[9], '');
    writeQuestionData(10, questions[10], '');
    writeQuestionData(11, questions[11], '');
    writeQuestionData(12, questions[12], [1, 2, 3, 4, 5]);
}

function saveTrainingFeedback(trainingId, userId, questionAnswers) {
    var questionAnswerData = {};
    for (var index = 0; index < questionAnswers.length; index++){
        questionAnswerData[questionAnswers[index].Question.replace('.', '')] = questionAnswers[index].Answer;
    }
    console.log(questionAnswerData);
    firebase.database().ref('trainingFeedback/').set({
        trainingId: trainingId,
        userId: userId,
        questionAnswers: questionAnswerData
    });

    // let questions = i18n.__('questions');
    // let questionAnswerData = {};
    // for (let index = 0; index < questions.length; index++) {
    //     questionAnswerData[questions[index].replace('.', '')] = index;
    // }
    // console.log(questionAnswerData);
    // firebase.database().ref('trainingFeedback/' + trainingId).push({
    //     trainingId: trainingId,
    //     userId: userId,
    //     questionAnswers: questionAnswerData
    // });
}

function fetchTrainingFeedback(trainingId){
    firebase.database().ref('trainingFeedback/' + trainingId).once('value', function(snapshot){
        console.log(snapshot.val());
    }, function (errorObject) {
        console.log("The read failed: " + errorObject.code);
    });


    // ref.on("value", function(snapshot) {
    //     console.log(snapshot.val());
    // }, function (errorObject) {
    //     console.log("The read failed: " + errorObject.code);
    // });
}

// writeQuestionsToFirebase(i18n.__('questions'));
// saveTrainingFeedback(0, 2, "");
// fetchTrainingFeedback(0);