let firebase = require('firebase')
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
    // let questionAnswerData = {};
    // for (let index = 0; index < questionAnswers.length; index++){
    //     questionAnswerData[questionAnswers[index].Question.replace('.', '')] = questionAnswers[index].Answer;
    // }
    let questions = i18n.__('questions');
    let questionAnswerData = {};
    for (let index = 0; index < questions.length; index++) {
        questionAnswerData[questions[index].replace('.', '')] = index;
    }
    console.log(questionAnswerData);
    firebase.database().ref('trainingFeedback/' + trainingId).push({
        trainingId: trainingId,
        userId: userId,
        questionAnswers: questionAnswerData
    });

    // let questions = i18n.__('questions');
    // let questionAnswerData = {};
    // for (let index = 0; index < questions.length; index++) {
    //     questionAnswerData[questions[index].replace('.', '')] = index;
    // }
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
        if (index === 1){
            firebase.database().ref('trainings/' + id.path.o[1] + '/attendees/' + index).set({
                attendeeName: attendees[index],
                isAttended: true,
                isFeedbackFilled: true
            });
        }else {
            firebase.database().ref('trainings/' + id.path.o[1] + '/attendees/' + index).set({
                attendeeName: attendees[index],
                isAttended: true,
                isFeedbackFilled: false
            });
        }
    }
}

function fetchTrainingData(){
    firebase.database().ref('trainings/').once('value', function (snapshot) {
        console.log(snapshot.val());
    }, function (errorObject) {
        console.log("The read failed: " + errorObject.code);
    });
}

function fetchNonFilledTrainings(){
    firebase.database().ref('trainings/').orderByChild('isFeedbackFilled').equalTo(false).once('value', function (snapshot) {
        console.log('Data -> ' + snapshot.val());
    }, function (errorObject) {
        console.log("The read failed: " + errorObject.code);
    });

    // usersRef.orderByChild("accountID").equalTo(56473).once("value",function(snapshot){
    //     //returns the exact user
    // });
}


// fetchNonFilledTrainings();
// fetchTrainingData();
saveTrainingData('Espresso', 'Lipika', ['Sachit', 'Praween', 'Sahil'], 'June');
// saveTrainingFeedback(0, 1, "");
