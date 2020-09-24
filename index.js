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
var fs = require("fs");

app.set("view engine", "ejs");
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(morgan("dev"));
app.use(logger("dev"));
app.use(express.static(path.join(__dirname, "public")));
app.use("/static", express.static(path.join(__dirname, "public")));
app.use(express.static(path.join(__dirname, "public", "css")));
app.use(
  fileUpload({
    createParentPath: true,
  })
);
app.use(cors());
var PORT = process.env.PORT || 3000;

var currentPosition = 0;
var filteredData = [];
var allData = [];
function checkDate(dateCheck, dateFrom, dateTo) {
  var d1 = dateFrom.split("/");
  var d2 = dateTo.split("/");
  var c = dateCheck.split("/");
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
  var year = parseInt(date.getFullYear()) - 10;
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
  try {
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
        res.render("index", {
          dataSize: allData.length,
          pageNumber: currentPosition,
          dataList: allData.slice(
            currentPosition * 20,
            currentPosition * 20 + 20
          ),
        });
      });
  } catch (error) {}
});

app.post("/", (req, res) => {
  console.log(req.body);

  currentPosition = 0;
  if (req.files) {
    var records = req.files.file;
    records.mv("./uploads/data.csv").then(() => {
      try {
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
            res.render("index", {
              dataSize: allData.length,
              pageNumber: currentPosition,
              dataList: allData.slice(
                currentPosition * 20,
                currentPosition * 20 + 20
              ),
            });
          });
      } catch (error) {}
    });
  }

  if (req.body && req.body.delete) {
    allData = [];
    currentPosition = 0;
    try {
      var filePath = "./uploads/data.csv";
      fs.unlinkSync(filePath);
    } catch (error) {}

    res.render("index", {
      dataSize: allData.length,
      pageNumber: currentPosition,
      dataList: allData,
    });
  }
});

app.post("/profitable", (req, res) => {
  currentPosition = 0;
  try {
    dateFrom = req.body.dateFrom.replace("-", "/").replace("-", "/");
    dateTo = req.body.dateTo.replace("-", "/").replace("-", "/");
  } catch (error) {}
  console.log(dateFrom);
  console.log(dateTo);

  try {
    CSVToJSON()
      .fromFile("./uploads/data.csv")
      .then((users) => {
        var rangeData = [];
        console.log(dateFrom);
        var profits = 0;
        for (var index = 0; index < users.length; index++) {
          var element = users[index];
          var dateCheck = element["Order Date"];
          var check = checkDate(dateCheck, dateFrom, dateTo);
          if (check == true) {
            rangeData.push(element);
            profits = profits + parseInt(element["Total Profit"]);
          }
        }
        filteredProfitable = rangeData.sort((a1, a2) => {
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
          dataList: filteredData.slice(0, 5),
        });
      })
      .catch((err) => {
        filteredData = [];
        res.render("profitable", {
          profits: 0,
          dateFrom: dateFrom.replace("/", "-").replace("/", "-"),
          dateTo: dateTo.replace("/", "-").replace("/", "-"),
          pageNumber: currentPosition,
          dataList: filteredData.slice(0, 5),
        });
      });
  } catch (error) {}
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
  try {
    CSVToJSON()
      .fromFile("./uploads/data.csv")
      .then((users) => {
        // filteredData = users;
        try {
          // 3/31/2016
          dateFrom = dateFrom.replace("-", "/").replace("-", "/");
          dateTo = dateTo.replace("-", "/").replace("-", "/");
        } catch (error) {}
        var rangeData = [];
        console.log(dateFrom, "]]]");
        var profits = 0;
        for (var index = 0; index < users.length; index++) {
          var element = users[index];
          var dateCheck = element["Order Date"];
          var check = checkDate(dateCheck, dateFrom, dateTo);

          if (check == true) {
            rangeData.push(element);
            profits = profits + parseInt(element["Total Profit"]);
          }
        }

        filteredProfitable = rangeData.sort((a1, a2) => {
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
          dataList: filteredData.slice(0, 5),
        });
      })
      .catch((err) => {
        filteredData = [];
        res.render("profitable", {
          profits: 0,
          dateFrom: dateFrom.replace("/", "-").replace("/", "-"),
          dateTo: dateTo.replace("/", "-").replace("/", "-"),
          pageNumber: currentPosition,
          dataList: filteredData.slice(0, 5),
        });
      });
  } catch (error) {}
});

app.listen(PORT);
