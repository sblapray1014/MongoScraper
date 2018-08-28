var express = require("express");
var bodyParser = require("body-parser");
var logger = require("morgan");
var mongoose = require("mongoose");
var request = require("request");

// Our scraping tools
// Axios is a promised-based http library, similar to jQuery's Ajax method
// It works on the client and on the server
var axios = require("axios");
var cheerio = require("cheerio");

// Require all models
var db = require("./models");

var PORT = process.env.PORT || 3000;

// Initialize Express
var app = express();

// Configure middleware

// Use morgan logger for logging requests
app.use(logger("dev"));
// Use body-parser for handling form submissions
app.use(bodyParser.urlencoded({ extended: true }));
// Use express.static to serve the public folder as a static directory
app.use(express.static("public"));

// Connect to the Mongo DB
var MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/MongoScraper";

// Set mongoose to leverage built in JavaScript ES6 Promises
// Connect to the Mongo DB
mongoose.Promise = Promise;
mongoose.connect(MONGODB_URI);


// Routes

// A GET route for scraping the echoJS website
app.get("/collect", function (req, res) {
  request("https://www.nytimes.com", function (error, response, html) {

    // Load the HTML into cheerio and save it to a variable
    // '$' becomes a shorthand for cheerio's selector commands, much like jQuery's '$'
    var $ = cheerio.load(html);

    // An empty array to save the data that we'll scrape
    var results = [];

    // Select each element in the HTML body from which you want information.
    // NOTE: Cheerio selectors function similarly to jQuery's selectors,
    // but be sure to visit the package's npm page to see how it works
    $("h2").each(function (i, element) {

      var title = $(element).text();
      // Find the h4 tag's parent a-tag, and save it's href value as "link"
      var link = $(element).closest("a").attr("href");
      // Save these results in an object that we'll push into the results array we defined earlier
      results.push({
        title: title,
        link: "https://www.nytimes/com" + link
      });
    });

    db.Article.create(results)
      .then(function (dbArticle) {
        // View the added result in the console
        console.log(dbArticle);
      })
      .catch(function (err) {
        // If an error occurred, send it to the client
        return res.json(err);
      });
  });

  // Log the results once you've looped through each of the elements found with cheerio
  // If we were able t successfully scrape and save an Article, send a message to the client
  res.send("Scrape Complete");
});

// Route for getting all Articles from the db
app.get("/articles", function (req, res) {
  db.Article.find({}, function (err, data) {
    res.json(data);
  })
    .catch(function (err) {
      res.json(err);
    })
  // TODO: Finish the route so it grabs all of the articles
});

// Route for grabbing a specific Article by id, populate it with it's note
app.get("/articles/:id", function (req, res) {
  db.Article.findOne({ _id: req.params.id })
    .populate("note")
    .then(function (dbArticle) {
      res.json(dbArticle);
    })
    .catch(function (err) {
      res.json(err);
    })
});

// Route for saving/updating an Article's associated Note
app.post("/articles/:id", function (req, res) {
  var note = req.body;
  db.Note.save(note, function (err, saved) {
    res.send(saved);
  })
  // TODO
  // ====
  // save the new note that gets posted to the Notes collection
  // then find an article from the req.params.id
  // and update it's "note" property with the _id of the new note
});

// Start the server
app.listen(PORT, function () {
  console.log("App running on port " + PORT + "!");
});
