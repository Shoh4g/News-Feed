var express = require('express');
var app = express();
var monk = require('monk');
var cookieParser = require('cookie-parser');
var db = monk('127.0.0.1:27017/assignment1');

/* ====================================== custom data types ====================================== */


/**
 * Data type holding information needed to display a comment
 *
 * @param {string} icon the path to the user icon file
 * @param {string} name username of the user
 * @param {Date} time a Date object representing the post time of the comment
 * @param {string} comment the comment text
 */
function Comment(icon, name, time, comment) {
  this.icon = icon
  this.name = name
  this.time = time
  this.text = comment
}


/* ====================================== HTML generation ====================================== */

/**
 * This function wraps bodyHTML with an HTML head, sets up viewport and links CSS and JS files
 *
 * @param {string} bodyHTML the HTML code that needs to be wrapped in <body>
 * @return {string} wrapped HTML code
 */
function generateHTML(bodyHTML) {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <title></title>
      <meta name="viewport" content="width=device-width, initial-scale=1.0"> 
      <link href="stylesheets/style.css" rel="stylesheet"/>
      <script src="javascripts/script.js"></script>
    </head>
    <body>${bodyHTML}</body>
    </html>
    `
}

/**
 * This function generates the news entry display page (Task 3)
 *
 * @param {string} newsID the newsID of the page
 * @param {string} headline headline of the news
 * @param {string} time time of the news as string to display
 * @param {string} content the text content of the news
 * @param {Array<Comment>} comments an array of Comment object holding the comments of the news
 * @param {integer} login_status whether the user is logged in. 0 for not logged in, 1 for logged in
 * @return {string} HTML of the news entry page
 */
function generateNewsEntryPage(newsID, headline, time, content, comments, login_status) {
  // we first create the comments. Each "comment_container" div holds a comment
  // "comment_meta" div holds the meta information displayed above the comment text, including user icon,
  // user name and comment time

  // Note that we use HTML5's data attributes to store the comment time as an ISO string, which we will use
  // when we fetch the latest news that is not yet displayed (Tasks 3.1 and 3.2). For the actual display,
  // we use toLocaleString().
  // For reference, see https://developer.mozilla.org/en-US/docs/Learn/HTML/Howto/Use_data_attributes
  var comment_container_html = ""
  comments.forEach(comment => {
    comment_container_html += `
    <div class="comment_container">
      <div class="comment_meta">
        <img src='${comment.icon}' width="200" height="200"></img>
        <p class="comment_name">${comment.name}</p>
        <p class="comment_time" data-time="${comment.time.toISOString()}">${comment.time.toLocaleString()}</p>
      </div>
      <p class="comment_text">${comment.text}</p>
    </div>
    `
  })

  // generate login button HTML according to login status
  var comment_button_html
  var comment_input_html
  if (login_status == 1) {
    comment_input_html = `<input type="text" id="comment_input"></input>`
    comment_button_html = `<button class="comment_button" onclick="postComment('${newsID}')">Post comment</button>`
  } else {
    comment_input_html = `<input id="comment_input" disabled></input>`
    comment_button_html = `<button class="comment_button" onclick="location.href='/login?newsID=${newsID}'">Login to comment</button>`
  }

  // generate HTML body for the page
  var body = `
  <div id="entry_header">
    <button id="entry_back_button" onclick="location.href='newsfeed.html'">
     ←
    </button>
    <div id="entry_header_content">
      <h1 id="entry_headline">${headline}</h1>
      <p id="entry_time">${time}</small>
    </div>
  </div>
  <div id="entry_content">
    <p>${content}</p>
  </div>
  <div id="comments">
    ${comment_container_html}
  </div>
  <div id="post_comment_container">
    ${comment_input_html}
    ${comment_button_html}
  </div>
  `
  return generateHTML(body)
}

/**
 * This function generates the Login page (Task 4)
 *
 * @param {string} newsID the newsID of the news from which the login button is clicked
 * @return {string} HTML for the login page
 */
function generateLoginPage(newsID) {
  // create the back button based on newsID
  var back_button
  if (newsID == 0) {
    back_button = `<a id="login_back_button" href="newsfeed.html">Go back</a>`
  } else {
    back_button = `<a id="login_back_button" href='/displayNewsEntry?newsID=${newsID}'>Go back</a>`
  }
  var login_html = `
  <h1 id="login_heading">
    You can log in here
  </h1>
  <div id="login_container">
    <div class="login_row">
      <p>Username:</p>
      <input type="text" id="login_username">
    </div>
    <div class="login_row">
      <p>Password:</p>
      <input type="password" id="login_password">
    </div>
    <div class="login_row">
      <button id="login_submit" onclick="login()">Submit</button>
    </div>
  </div>
  <div id="back_button_container">
    ${back_button}
  </div>
  `
  return generateHTML(login_html)
}

/* ====================================== Utility functions for retrieving data from DB ====================================== */


/**
 * This function sorts an array of Comment objects based on their time.
 * Latest comment will be placed in the front of the array.
 *
 * @param {Array<Comment>} comments the array of comments to sort
 * @return {Array<Comment>} the sorted array
 */
function sortComments(comments) {
  return comments.sort((a, b) => b.time - a.time)
}


/**
 * This function queries a list of news whose headline contains the search string from DB.
 *
 * @param db the database object
 * @param {String} search_string the search string
 * @return a Promise holding the resulting documents
 */
function getNewsListFromDB(db, search_string) {
  // query the DB for the list of news
  // we do not need the comments here so we use projection to drop them
  // we also sort the returned news entries by their time field so latest
  // news will appear first in the result
  return db.get("newsList").find(
    {"headline": {$regex : search_string, $options: 'i'}},
    {projection: {"comments": 0}, sort: {"time": -1}}
  )
}

/**
 * This function queries a news entry from DB using its ID. It also looks up the user's information 
 * using the userID stored in the comment.userID field.
 *
 * @param db the database object
 * @param {string} newsID the ID of the news to query
 * @return a Promise holding the resulting document
 */
function queryNewsEntryFromDB(db, newsID) {
  // Here we perform an aggregation:
  //  Stage 1: we match the news using newsID
  //  Stage 2: we perform a look up from userList. 
  //           For each entry in comments , we try to find documents in userList whose _id
  //           field (foreignField: '_id') matches the comment's userID (localField: 'comments.userID')
  //           The retrieved documents in userList are put in a new field called "comment_users".
  //           We further run a projection on the joined collection, dropping the user's passwords.
  //           This is done by specifying the "pipeline" field of the lookup.
  //
  //  Schema of returned document:
  //    {
  //      _id: ObjectId,
  //      headline: String,
  //      content: String,
  //      time: Date,
  //      comments: Array<Comment>
  //          Comment: {
  //            userID: ObjectId,
  //            time: Date,
  //            comment: String
  //          }
  //      comment_users: Array<User>
  //          User: {
  //            _id: ObjectId,
  //            name: String,
  //            icon: String
  //          }
  //    }
  
  return db.get("newsList").aggregate([
    {$match: {_id: monk.id(newsID)}},
    {
      $lookup: {
        from: 'userList',
        localField: 'comments.userID',
        foreignField: '_id',
        as: 'comment_users',
        pipeline:[{
          $project: {
            password: 0
          }
        }]
      }
    }
  ])
}


/**
 * This function parses the comments from a news entry returned from queryNewsEntryFromDB
 * and creates a time-sorted array of Comment objects. It also filters the comments
 * based on a time threshold.
 *
 * @param entry the document entry returned from queryNewsEntryFromDB
 * @param {Date} [time_threshold=null] only comments with post time later than time_threshold will be returned
 * @return {Array<Comment>} the array of comment objects constructed
 */
function parseCommentsFromDB(entry, time_threshold=null) {
  var comments = []
  // since mongodb lookup will only store unique users into "comment_users",
  // to handle the situation that a user posts multiple comments, we need to
  // manually match each news to the user document here.

  // user_map maps a user's _id to the returned user document
  var user_map = {}
  for (let entry_user of entry.comment_users) {
    user_map[entry_user._id] = entry_user
  }

  for(var i=0; i<entry.comments.length; i++) {
    // we match each comment to its corresponding user document using user_map
    var entry_comment = entry.comments[i]
    var entry_user = user_map[entry_comment.userID]
    var comment = new Comment(entry_user.icon, entry_user.name, entry_comment.time, entry_comment.comment)
    comments.push(comment)
  }
  // sort the comments based on their time
  comments = sortComments(comments)
  if(time_threshold != null) {
    // filter the comments array using time threshold, if specified
    comments = comments.filter(c => c.time > time_threshold)
  }
  return comments
}


/**
 * This function stores a comment to the DB in the corresponding news's entry.
 *
 * @param db the database object
 * @param {String} newsID the newsID to update
 * @param {String} userID the ID of the user posting the comment
 * @param {String|Date} comment_time a date object or time string in ISO format, representing the comment time
 * @param {String} comment_text content of the comment
 * @return a Promise which resolves when the update is done
 */
function postCommentToDB(db, newsID, userID, comment_time, comment_text) {
  return db.get("newsList").update(
    {"_id": monk.id(newsID)},
    {
      "$push": {
          "comments": {
              "userID" : monk.id(userID),
              "time" : new Date(comment_time),
              "comment" : comment_text
          }
      }
    }
  )
}


/**
 * This function queries a user document from the DB using username.
 *
 * @param db the database object
 * @param {String} username username
 * @return a Promise holding the resulting documents
 */
function queryUserByNameFromDB(db, username) {
  return db.get("userList").find({
    "name": username
  })
}

/* ====================================== server logic ====================================== */


/**
 * Utility function to send a plain text response.
 *
 * @param res the response object in express.js
 * @param {String} text the text to send
 */
function sendPlainText(res, text) {
  res.writeHead(200, { 'Content-Type':'text/plain' })
  res.end(text)
}


/**
 * Utility function to send an HTML response.
 *
 * @param res the response object in express.js
 * @param {String} html the HTML code to send
 */
function sendHTML(res, html) {
  res.writeHead(200, { 'Content-Type':'text/html' })
  res.end(html)
}


// make db accessible to routers
app.use(function(req,res,next){
  req.db = db;
  next();
})

// allow expressjs to parse json POST request
app.use(express.json());

// use cookieParser to parse cookies
app.use(cookieParser());

// serve static files in "public" directory
app.use(express.static("public"))

// handle GET request to /retrievenewslist
app.get('/retrievenewslist', function (req, res) {
  // retrieve page_index and search_string from the query
  var page_index = req.query.pageindex
  var search_string = req.query.search
  // query the DB for the list of news
  getNewsListFromDB(req.db, search_string).then((db_result) => {
    // calculate the start and end news indices for the current page
    let page_start_idx = 5 * (page_index - 1)
    let page_end_idx = Math.min(db_result.length, 5 * page_index)
    // get the news entries on current page
    var entries_on_page = db_result.slice(page_start_idx, page_end_idx)
    // shorten the news content to 10 words
    for(var entry of entries_on_page) {
      let splitted = entry["content"].split(" ")
      if(splitted.length > 10) {
         entry["content"] = (splitted.splice(0, 10).join(" ") + "...")
      }
    }
    // construct and send the response in json
    var res_json = {
      "n_total_entries": db_result.length,
      "retrieved_entries": entries_on_page,
      "login_status": req.cookies.userID ? 1 : 0
    }
    res.json(res_json)
 })
})

// handle GET request to /displayNewsEntry
app.get('/displayNewsEntry', function (req, res) {
  var newsID = req.query.newsID
  // query the DB for the news entry
  queryNewsEntryFromDB(req.db, newsID).then((db_result) => {
    var entry = db_result[0]
    // generate the array of comments object
    // we do not specify a threshold here so all entries are returned
    var comments = parseCommentsFromDB(entry)
    // generate the HTML code
    var html = generateNewsEntryPage(
                  newsID,
                  entry.headline,
                  new Date(entry.time).toLocaleString(),
                  entry.content,
                  comments,
                  req.cookies.userID ? 1 : 0)
    // send the HTML response
    sendHTML(res, html)
  })
})

// handle POST request to /handlePostComment
app.post('/handlePostComment', function(req, res) {
 
  postCommentToDB(req.db, req.body.newsID, req.cookies.userID, req.body.time, req.body.comment).then((_) => {
    // query updated new entries
    queryNewsEntryFromDB(req.db, req.body.newsID).then((db_result) => {
      var entry = db_result[0]
      // use the latest_comment_time contained in the request as threshold
      var time_threshold = new Date(req.body.latest_comment_time)
      var comments = parseCommentsFromDB(entry, time_threshold)
      res.json(comments)
    })
  })
})

// handle GET request to /login
app.get('/login', function (req, res) {
  var newsID = req.query.newsID
  var html = generateLoginPage(newsID)
  sendHTML(res, html)
})

// handle GET request to /handleLogin
app.get('/handleLogin', function (req, res) {
  var username = req.query.username
  var password = req.query.password
  queryUserByNameFromDB(req.db, username).then((db_result) => {
    if (db_result.length == 0) {
      // unable to find a matching document
      sendPlainText(res, "Username is incorrect.")
      return
    }
    var user_entry = db_result[0]
    if(user_entry.password != password) {
      sendPlainText(res, "Password is incorrect.")
    } else {
      // set the userID cookie
      res.cookie("userID", user_entry._id)
      sendPlainText(res, "login success")
    }
  })
})

// handle GET request to /handleLogout
app.get('/handleLogout', function (req, res) {
  if(req.cookies.userID) {
    // clear cookie
    res.clearCookie('userID');
    sendPlainText(res, "logout success")
  } else {
    sendPlainText(res, "logout failed")
  }
})

var server = app.listen(8081, () => {
  var host = server.address().address
  var port = server.address().port
  console.log("App listening at http://%s:%s", host, port)
})