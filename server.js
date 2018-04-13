var csv = require('fast-csv');
var fs = require('fs');
const functions = require('firebase-functions');
var admin = require("firebase-admin");
var serviceAccount = require('./tie-app.json');
var XLSX = require('xlsx');
var _ = require('underscore');
var moment = require('moment');
var usersList = [];
var async = require('async');

console.log('Initializing Firebase');
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: 'https://tie-con-management.firebaseio.com'
});

function addAttendee() {
    admin.firestore().collection("TestWrite").doc('SAGAR_TEST_DATA')
        .set({ 'username': 'sagarshelar', 'email': 'shaggy.shelar@gmail.com', 'password': '123' })
        .then((docRef) => {
            console.log('Data Added');
        })
        .catch((ex) => {
            console.log('Error Adding Data');
        });
}

function writeCSV() {
    var csvStream = csv.createWriteStream({ headers: true }),
        writableStream = fs.createWriteStream("./Output/TiE Users List.csv");

    writableStream.on("finish", function () {
        console.log("COmpleted Writing data!");
    });
    csvStream.pipe(writableStream);
    csvStream.write({ a: "a0", b: "b0" });
    csvStream.write({ a: "a1", b: "b1" });
    csvStream.write({ a: "a2", b: "b2" });
    csvStream.write({ a: "a3", b: "b4" });
    csvStream.write({ a: "a3", b: "b4" });
    csvStream.end();
}

function registerUserToFirebase(userDetails, callback) {
    userDetails.Message = "DOne processing user";
    callback();
    // admin.auth().createUser({
    //     email: userDetailsuserEmail,
    //     emailVerified: true,
    //     password: userDetails.password,
    //     displayName: userDetails.fullName,
    //     disabled: false,
    // })
    //     .then((userRecord) => {
    //         userDetails.Message += "Created succesfully with UID:", userRecord.uid + ".";
    //         console.log("Successfully created new user:", userRecord.uid);
    //         let attendeeDetails = {
    //             email: req.userEmail,
    //             firstName: userDetails.firstName,
    //             lastName: userDetails.lastName,
    //             fullName: userDetails.fullName,
    //             roleName: 'Delegates',
    //             isAttendee: true,
    //             profileServices: ['Delegates'],
    //             timestamp: req.timestamp,
    //             registrationType: req.registrationType,
    //             briefInfo: '',
    //             attendeeCount: '',
    //             attendeeLabel: 'DEL',
    //             attendanceId: '',
    //             sessionId: '',
    //             linkedInURL: '',
    //             profileImageURL: ''
    //         };
    //     })
    //     .catch((error) => {
    //         userDetails.Message = "Error creating new user:" + error;
    //         console.log("Error creating new user:", error);
    //     });
}

function writeUsersIntoXLS() {
    var ws = XLSX.utils.json_to_sheet(usersList);
    var wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'App Registered Users List');
    var currentDate = new Date();
    var formatedDate = moment(new Date()).format('MM-DD-YYYY-HH-MM-SS');
    var fileName = './Output/App Registered TiE Users_' + formatedDate + '.xls'
    XLSX.writeFile(wb, fileName);
}

function registerUsersToFirebase() {
    var waterfallFunctions = [];
    _.each(usersList, function (user) {
        waterfallFunctions.push(function (next) {
            registerUserToFirebase(user, function (err, post) {
                console.log('Completed processin of', user.fullName);
                next();
            });
        });
    });

    async.series(waterfallFunctions,
        function (err, results) {
            console.log("Completed writing into the file");
            writeUsersIntoXLS();
        });
}

function startParsing(filepath) {
    console.log('startParsing');
    var counter = 0;
    var stream = fs.createReadStream(filepath);
    var fastCsv = csv.createWriteStream();
    var writeStream = fs.createWriteStream('./Output/TiE Users List.csv');
    fastCsv.pipe(writeStream);

    var failedUsers = [];
    var savedUsers = [];
    var waterfallFunctions = [];


    var csvStream = csv
        .parse()
        .on('data', function (data) {
            counter++;
            console.log('DDD', data);
            if (counter > 1) {
                var validationErrors = '';
                if (data.length < 3) {
                    validationErrors += 'Invalid length of record.';
                    data.push(validationErrors);
                    fastCsv.write(data);
                    return;
                }

                var firstName = data[0].trim();
                if (firstName == '') {
                    validationErrors += 'Invalid first name of user';
                }

                var lastName = data[1].trim();
                if (lastName == '') {
                    validationErrors += 'Invalid last name of user';
                }

                var email = data[2].trim();
                if (email == '') {
                    validationErrors += 'Invalid email of user';
                }

                var userToAdd = {
                    firstName: firstName,
                    lastName: lastName,
                    email: email,
                };
                console.log("User to create", userToAdd);
                // waterfallFunctions.push(function (next) {
                //   studentModel.create(userToAdd, function (err, post) {
                //     if (err) {
                //       if (err.errno == 1062) {
                //         validationErrors += i18next.t('error_duplicateEntry');
                //       } else {
                //         validationErrors += err.message;
                //       }
                //       failedStudents.push({ 'Row': data, 'Error': validationErrors });
                //       data.push(validationErrors);
                //       fastCsv.write(data);
                //     } else {
                //       savedStudents.push({ 'Row': data });
                //     }
                //     next();
                //   });
                // });
            } else {
                //data.push('Error Message');
                //fastCsv.write(data);
            }
        })
        .on('end', function () {
            //   async.waterfall(waterfallFunctions, function (err) {
            //     fastCsv.end();
            //   });
        });
    stream.pipe(csvStream);
}

//startParsing('registrationDetails.csv');

function parseXLSX(filepath) {
    var buf = fs.readFileSync(filepath);
    var workbook = XLSX.read(buf, { type: 'buffer' });
    var first_sheet_name = workbook.SheetNames[0];
    var worksheet = workbook.Sheets[first_sheet_name];
    if (!worksheet) {
        console.log('File does not contains any sheet.');
        return;
    }
    var users = XLSX.utils.sheet_to_json(worksheet);
    _.each(users, function (user) {
        var userToAdd = { firstName: '', lastName: '', email: '' };
        var names = user.Name.split(" ");
        if (names.length == 1) {
            userToAdd.firstName = names[0];
        } else if (names.length == 2) {
            userToAdd.firstName = names[0];
            userToAdd.lastName = names[1];
        } else if (names.length == 3) {
            userToAdd.firstName = names[0];
            userToAdd.lastName = names[1] + ' ' + names[2];
        } else {
            userToAdd.firstName = user.Name;
        }
        userToAdd.password = Math.random().toString(36).slice(-6);
        userToAdd.email = user['Email id'];
        userToAdd.fullName = user.Name;
        usersList.push(userToAdd);
        //console.log(userToAdd);
    });
    //this.writeUsersIntoXLS();
    registerUsersToFirebase();
}

parseXLSX('TiECon_Pune_2018_-_Registrations_as_on_12th_April.xls')
console.log('Completed Program Execution.');