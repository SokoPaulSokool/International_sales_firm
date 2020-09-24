/**
 * Module dependencies.
 */

var express = require("express");
var logger = require("morgan");
var path = require("path");
var app = express();
var cors = require("cors");
var csvToJson = require("convert-csv-to-json");
var CSVToJSON = require("csvtojson");
var bodyParser = require("body-parser");
var moment = require("moment");
var fileUpload = require("express-fileupload");
var morgan = require("morgan");

app.set("view engine", "ejs");
// support parsing of application/json type post data
app.use(bodyParser.json());

//support parsing of application/x-www-form-urlencoded post data
app.use(bodyParser.urlencoded({ extended: true }));
app.use(morgan("dev"));
app.use(
  fileUpload({
    createParentPath: true,
  })
);
app.use(cors());
var records = "Records.csv";
console.log(records);

var filteredData = [];
var allData = [];
function checkDate(dateCheck, dateFrom, dateTo) {
  var d1 = dateFrom.split("/");
  var d2 = dateTo.split("/");
  var c = dateCheck.split("/");

  //   var from = new Date(d1[2], parseInt(d1[1]) - 1, d1[0]); // -1 because months are from 0 to 11
  //   var to = new Date(d2[2], parseInt(d2[1]) - 1, d2[0]);
  //   var check = new Date(c[2], parseInt(c[1]) - 1, c[0]);
  // 4/20/2010
  // var from = new Date(d1[2], parseInt(d1[0]) - 1, parseInt(d1[1])-1); // -1 because months are from 0 to 11
  // var to = new Date(d2[2], parseInt(d2[0]) - 1, parseInt(d2[1])-1);
  // var check = new Date(c[2], parseInt(c[0]) - 1, parseInt(c[1])-1);

  var from = new Date(d1[0], parseInt(d1[1]), d1[2]); // -1 because months are from 0 to 11
  from.setDate(from.getDate() - 1);
  var to = new Date(d2[0], parseInt(d2[1]), d2[2]);
  to.setDate(to.getDate() + 1);
  var check = new Date(c[2], parseInt(c[0]), c[1]);
  check.setDate(check.getDate());

  if (check > from && check < to) {
    return true;
  } else {
    return false;
  }
}

// log requests
app.use(logger("dev"));

// express on its own has no notion
// of a "file". The express.static()
// middleware checks for a file matching
// the `req.path` within the directory
// that you pass it. In this case "GET /js/app.js"
// will look for "./public/js/app.js".

app.use(express.static(path.join(__dirname, "public")));

// if you wanted to "prefix" you may use
// the mounting feature of Connect, for example
// "GET /static/js/app.js" instead of "GET /js/app.js".
// The mount-path "/static" is simply removed before
// passing control to the express.static() middleware,
// thus it serves the file correctly by ignoring "/static"
app.use("/static", express.static(path.join(__dirname, "public")));

// if for some reason you want to serve files from
// several directories, you can use express.static()
// multiple times! Here we're passing "./public/css",
// this will allow "GET /style.css" instead of "GET /css/style.css":
app.use(express.static(path.join(__dirname, "public", "css")));

var currentPosition = 0;

function todayDate() {
  var date = new Date();

  var day = date.getDate();
  var month = date.getMonth() + 1;
  var year = date.getFullYear();

  if (month < 10) month = "0" + month;
  if (day < 10) day = "0" + day;

  var today = year + "-" + month + "-" + day;
  return today;
}

function pastDate() {
  var date = new Date();

  var day = date.getDate();
  var month = date.getMonth() + 1;
  var year =  parseInt(date.getFullYear())-10;

  if (month < 10) month = "0" + month;
  if (day < 10) day = "0" + day;

  var today = year + "-" + month + "-" + day;
  return today;
}



var dateFrom = pastDate();
var dateTo = todayDate();
app.get("/", (req, res) => {
  // dateFrom = todayDate();
  // dateTo = todayDate();

  CSVToJSON()
    .fromFile("./uploads/data.csv")
    .then((users) => {
      allData = users;
      res.render("index", {
        dataSize: allData.length,
        pageNumber: currentPosition,
        dataList: allData.slice(
          currentPosition * 20,
          currentPosition * 20 + 20
        ),
      });
    })
    .catch((err) => {
      // log error if any
      res.json({ success: false, message: "failes" });
    });
});

app.post("/", (req, res) => {
  console.log(req.body);

  currentPosition = 0;
  if (req.files) {
    var avatar = req.files.file;

    //Use the mv() method to place the file in upload directory (i.e. "uploads")
    avatar.mv("./uploads/data.csv").then(() => {
      CSVToJSON()
        .fromFile("./uploads/data.csv")
        .then((users) => {
          allData = users;
          res.render("index", {
            dataSize: allData.length,
            pageNumber: currentPosition,
            dataList: allData.slice(
              currentPosition * 20,
              currentPosition * 20 + 20
            ),
          });
        })
        .catch((err) => {
          // log error if any
          res.json({ success: false, message: "failes" });
        });
    });
  } 
});
app.post("/profitable", (req, res) => {
  console.log(req.body);

  currentPosition = 0;
  
    try {
      // 3/31/2016
      dateFrom = req.body.dateFrom.replace("-", "/").replace("-", "/");
      dateTo = req.body.dateTo.replace("-", "/").replace("-", "/");
    } catch (error) {}
    console.log(dateFrom);
    console.log(dateTo);

    // convert users.csv file to JSON array
    CSVToJSON()
      .fromFile("./uploads/data.csv")
      .then((users) => {
        var ll = [];
        console.log(dateFrom);
        var profits = 0;
        for (var index = 0; index < users.length; index++) {
          var element = users[index];
          // console.log(element);

          var dateCheck = element["Order Date"];
          var check = checkDate(dateCheck, dateFrom, dateTo);

          if (check == true) {
            ll.push(element);
            profits = profits+ parseInt(element["Total Profit"]) ;
          }
        }

        // filteredData = ll;
        filteredProfitable = ll.sort((a1, a2) => {
          if (a1["Total Profit"] > a2["Total Profit"]) {
            return -1;
          }
          if (a1["Total Profit"] < a2["Total Profit"]) {
            return 1;
          }
          return 0;
        });
        filteredData = filteredProfitable;

    
        res.render("profitable", {
          profits: profits,
          dateFrom: dateFrom.replace("/", "-").replace("/", "-"),
          dateTo: dateTo.replace("/", "-").replace("/", "-"),
          pageNumber: currentPosition,
          dataList: filteredData.slice(
            0,
            5
          ),
        });
      })
      .catch((err) => {
        // log error if any
        res.json({ success: false, message: "failes" });
      });

});

app.post("/:id", (req, res) => {
  var id = req.params.id;
  var type = req.body.type;
  if (type === "prev" && currentPosition > 0) {
    currentPosition = currentPosition - 1;
  }
  if (type === "next" && currentPosition < allData.length / 20) {
    currentPosition = currentPosition + 1;
  }

  console.log(currentPosition);
  var last = currentPosition * 20 + 20;
  if (currentPosition > allData.length / 20) {
    last = allData.length;
    console.log("lslsllsl");
  }

  res.render("index", {
    dataSize: allData.length,
    pageNumber: currentPosition,
    dataList: allData.slice(currentPosition * 20, last),
  });
});


app.get("/profitable", (req, res) => {
  dateFrom = pastDate();
  dateTo = todayDate();

  CSVToJSON()
    .fromFile("./uploads/data.csv")
    .then((users) => {
      // filteredData = users;
      try {
        // 3/31/2016
        dateFrom = dateFrom.replace("-", "/").replace("-", "/");
        dateTo = dateTo.replace("-", "/").replace("-", "/");
      } catch (error) {}
      var ll = [];
      console.log(dateFrom,"]]]");
      var profits = 0;
      for (var index = 0; index < users.length; index++) {
        var element = users[index];
        // console.log(element);

        var dateCheck = element["Order Date"];
        var check = checkDate(dateCheck, dateFrom, dateTo);

        if (check == true) {
          ll.push(element);
          profits = profits+ parseInt(element["Total Profit"]) ;
        }
      }
    
      filteredProfitable = ll.sort((a1, a2) => {
        if (a1["Total Profit"] > a2["Total Profit"]) {
          return -1;
        }
        if (a1["Total Profit"] < a2["Total Profit"]) {
          return 1;
        }
        return 0;
      });
      filteredData = filteredProfitable;
      res.render("profitable", {
        profits: profits,
        dateFrom: dateFrom.replace("/", "-").replace("/", "-"),
        dateTo: dateTo.replace("/", "-").replace("/", "-"),
        pageNumber: currentPosition,
        dataList: filteredData.slice(0 , 5),
      });
    })
    .catch((err) => {
      // log error if any
      res.json({ success: false, message: "failes" });
    });
});
var PORT = process.env.PORT|| 3000;
app.listen(PORT);
