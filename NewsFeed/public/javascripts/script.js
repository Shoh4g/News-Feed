/* ============================ code for newsfeed page ============================ */


/**
 * This function tries to remove an HTML element from DOM given its id
 *
 * @param id the id of the HTML element
 */
function getAndRemove(id) {
  var element = document.getElementById(id)
  if(element != null) {
    element.remove()
  }
}


/**
 * This function first removes the existing login/logout button from the page,
 * and then generates a new one based on login status.
 *
 * @param login_status 0 for not logged in, 1 for logged in
 */
function displayLogInOrOutButton(login_status) {
  // remove the existing login button
  getAndRemove("login_button")
  var header = document.getElementById("header")
  var button = document.createElement("a")
  if (login_status == 0) {
    // set the text and link of the button
    button.setAttribute("href", "/login?newsID=0")
    button.innerHTML = "Log in"
  } else {
    // set the text and register an event handler to onclick
    button.innerHTML = "Log out"
    button.onclick = () => {
      logout()
    }
  }
  button.setAttribute("id", "login_button")
  header.appendChild(button)
}


/**
 * This function removes all children elements from an container.
 *
 * @param id the id of the container
 */
function clearContainer(id) {
  var container = document.getElementById(id)
  while (container.firstChild) {
    container.firstChild.remove()
  }
}


/**
 * This function fills the "news" division of the page with news entries retrieved from the server
 *
 * @param entries an array of news entries
 */
function displayNewsEntries(entries) {
  // clear the current entries first
  clearContainer("news")
  var container = document.getElementById("news")
  for(var entry of entries) {
    var entry_container = document.createElement("div")

    var headline = document.createElement("a")
    headline.innerHTML = entry["headline"]
    headline.classList.add("news_headline")
    headline.setAttribute("href", `/displayNewsEntry?newsID=${entry["_id"]}`)
    entry_container.appendChild(headline)

    var datetime = new Date(entry["time"])
    var time_string  = datetime.toLocaleString()
    var time_element = document.createElement("p")
    time_element.classList.add("news_time")
    time_element.innerHTML = time_string
    entry_container.appendChild(time_element)

    var content = document.createElement("p")
    content.innerHTML = entry["content"]
    content.classList.add("news_content")
    entry_container.appendChild(content)

    container.appendChild(entry_container)
  }
}

/**
 * This function fills the "pageindex" division of the page.
 *
 * @param current_idx the current page index (which is highlighted)
 * @param n_pages the total number of pages
 */
 function displayPageIndex(current_idx, n_pages) {
  // clear the current contents first
  clearContainer("pageindex")
  var container = document.getElementById("pageindex")
  for(let i=1; i<=n_pages; i++) {
    var index_button = document.createElement("button")
    index_button.innerHTML = (i).toString()
    // call loadNewsList when the index buttons are clicked
    index_button.onclick = () => {
      loadNewsList(i);
    }
    // highlight the current button by adding a class to it
    if(i == current_idx) {
      index_button.classList.add("highlight")
    }
    container.appendChild(index_button)
  }
}


/**
 * This function sends a GET request to the server to retrive the news list.
 *
 * @param pageindex the page index to display
 */
function loadNewsList(pageindex) {
  var input_box = document.getElementById("search_input")
  // get the current search string from the input box
  var search_string = input_box.value
  // send a GET request to retrievenewslist
  fetch(`retrievenewslist?pageindex=${pageindex}&search=${search_string}`) 
  .then( response => {
    if (response.status == 200) {
      response.text().then( data => {
        // parse the response JSON
        var response_text = JSON.parse(data)
        // obtain the data from the JSON (format is specified on the server side)
        var n_total_entries = response_text["n_total_entries"]
        var retrieved_entries = response_text["retrieved_entries"]
        var login_status = response_text["login_status"]
        // update the page contents
        displayLogInOrOutButton(login_status)
        displayNewsEntries(retrieved_entries)
        displayPageIndex(pageindex, Math.ceil(n_total_entries / 5))
      })
    }})
}

/* ============================ code for news entry display page ============================ */

/**
 * This function appends new comments that are not currently displayed into the comment section of the page.
 *
 * @param comments the array of comments to append
 */
function addComments(comments) {
  var comment_div = document.getElementById("comments")
  // since we are prepending, we need to inverse the order
  for(var comment of comments.reverse()) {
    var comment_container = document.createElement("div")
    comment_container.classList.add("comment_container")

    var comment_meta = document.createElement("div")
    comment_meta.classList.add("comment_meta")

    var comment_img = document.createElement("img")
    comment_img.setAttribute("src", comment.icon)
    comment_img.setAttribute("width", "200")
    comment_img.setAttribute("height", "200")
    comment_meta.appendChild(comment_img)

    var comment_name = document.createElement("p")
    comment_name.classList.add("comment_name")
    comment_name.innerHTML = comment.name
    comment_meta.appendChild(comment_name)

    var datetime = new Date(comment.time)
    var comment_time = document.createElement("p")
    comment_time.classList.add("comment_time")
    comment_time.innerHTML = datetime.toLocaleString()
    // we record the time here since one user may post comments multiple times
    comment_time.dataset.time = datetime.toISOString()
    comment_meta.appendChild(comment_time)

    comment_container.appendChild(comment_meta)

    var comment_text = document.createElement("p")
    comment_text.classList.add("comment_text")
    comment_text.innerHTML = comment.text
    comment_container.appendChild(comment_text)

    comment_div.prepend(comment_container)
  }
}



/**
 * This function handles the onclick event of the post comment button
 *
 * @param newsID the ID of the current news
 */
function postComment(newsID) {
  var input = document.getElementById("comment_input")
  var comment_text = input.value
  if(!input.value) {
    alert("No comment has been entered.")
    return
  }
  var comment_div = document.getElementById("comments")
  // find the time of the latest comment being displayed by visiting the first element child's
  // dataset attribute (which we have set in the server side and in addComments())
  var latest_comment_time = null;
  if (comment_div.firstElementChild) {
    latest_comment_time = comment_div.firstElementChild.firstElementChild.lastElementChild.dataset.time
  }

  var post_data = {
    newsID: newsID,
    time: new Date(),
    comment: comment_text,
    latest_comment_time: latest_comment_time
  }
  // send a POST request to handlePostComment
  fetch('handlePostComment', {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(post_data)
  })
  .then(response => {
    if (response.status == 200) {
      response.text().then( data => {
        // add new comments upon receiving the response
        addComments(JSON.parse(data))
        // clear the input field
        document.getElementById("comment_input").value = ''
      });
    }
  })
}

/* ============================ code for login and logout ============================ */


/**
 * This function handles the onclick event on the submit button on the login page
 */
function login() {
  var username = document.getElementById("login_username").value
  var password = document.getElementById("login_password").value
  if(username == '' || password == '') {
    alert("Please enter username and password.")
    return
  }
  // send a GET request to handleLogin
  fetch(`handleLogin?username=${username}&password=${password}`)
  .then(response => {
    if (response.status == 200) {
      response.text().then( data => {
        var heading = document.getElementById("login_heading")
        // check login status
        if (data == "login success") {
          heading.innerHTML = "You have successfully logged in"
          document.getElementById("login_container").style.display = "none"
        } else {
          heading.innerHTML = data
        }
      });
    }
  })
}


/**
 * This function handles the onclick event on the logout button on the newsfeed page
 */
function logout() {
  // send a GET request to handleLogout
  fetch(`handleLogout`)
  .then(response => {
    if (response.status == 200) {
      response.text().then( data => {
        if(data == "logout success") {
          // reload the login/logout button
          displayLogInOrOutButton(0)
        } else {
          alert("Failed to log out.")
        }
      });
    }
  })
}