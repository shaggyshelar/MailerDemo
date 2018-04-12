var csv = require('fast-csv');
var fs = require('fs');

// var filepath = './Output/TiE Users List.csv';
// var stream = fs.createReadStream(filepath);
// var fastCsv = csv.createWriteStream();
// var writeStream = fs.createWriteStream('outputfile.csv');
// fastCsv.pipe(writeStream);
// var data = {a: "a0", b: "b0"};
// fastCsv.write(data);

var csvStream = csv.createWriteStream({headers: true}),
    writableStream = fs.createWriteStream("./Output/TiE Users List.csv");

writableStream.on("finish", function(){
  console.log("COmpleted Writing data!");
});

csvStream.pipe(writableStream);
csvStream.write({a: "a0", b: "b0"});
csvStream.write({a: "a1", b: "b1"});
csvStream.write({a: "a2", b: "b2"});
csvStream.write({a: "a3", b: "b4"});
csvStream.write({a: "a3", b: "b4"});
csvStream.end();