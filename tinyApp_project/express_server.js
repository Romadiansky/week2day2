// import dependencies
const express = require("express");
const cookieSession = require("cookie-session");
const app = express();
const PORT = 8080;
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");
app.use(cookieSession({
  name: 'session',
  keys: ["this is my secret string"],
  maxAge: 365 * 24 * 60 * 60 * 1000
}));
const bcrypt = require('bcrypt');

// random string generator for URL shortening
function generateRandomString() {
  let key = "";
  const characters = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

  for (let i = 0; i < 6; i++) {
    key += characters.substr(Math.floor((Math.random() * characters.length)), 1);
  }
  return key;
}

// main DB for the program
let urlDatabase = {
  "b2xVn2": {userID: "user1", longURL: "http://www.lighthouselabs.ca"},
  "9sm5xK": {userID: "user2", longURL: "http://www.google.com"}
};

// DB of users
let users = {
  "user1": {
    id: "user1",
    email: "user1@email.com",
    hashedPassword: bcrypt.hashSync("12345", 10)
  },
  "user2": {
    id: "user2",
    email: "user2@email.com",
    hashedPassword: bcrypt.hashSync("qwerty", 10)
  }
}

// generate a new URL stored in DB and return its short URL
function createNewURL(longURL, req) {
  let shortURL = generateRandomString();
  urlDatabase[shortURL] = {
    userID: req.session["user_id"],
    longURL: longURL
  };
  return shortURL;
};

// handles new url submission
app.post("/urls", (req, res) => {
  let longURL = req.body.longURL;
  let shortURL = createNewURL(longURL, req);
  res.redirect(`/urls/${shortURL}`);
});

// handles requests to redirect from short url links to original sources
app.get("/u/:shortURL", (req, res) => {
  let shortURL = req.params.shortURL;
  let longURL = urlDatabase[shortURL].longURL;
  res.redirect(longURL);
});

// handles root requests, redirecting depending on login status
app.get("/", (req, res) => {
  if (!users[req.session["user_id"]]) {
    res.redirect("/login");
  } else {
    res.redirect("/urls");
  }
});

// returns URL DB as a json file
app.get("/urls.json", (req, res) => {
  let templateVars = {
    user: users[req.session["user_id"]]
   };
  res.json(urlDatabase);
});

// filters URL DB and returns URLs that belong to a specific user
function urlsForUser(id) {
  let filteredObj = {};
  for (let k in urlDatabase) {
    if (urlDatabase[k].userID === id) {
      filteredObj[k] = urlDatabase[k];
    }
  }
  return filteredObj;
}

// returns the management page for the user's URLs
app.get("/urls", (req, res) => {
  let templateVars = {
    urls: urlsForUser(req.session["user_id"]),
    user: users[req.session["user_id"]]
   };
  res.render("urls_index", templateVars);
});

// serves the registration form
app.get("/register", (req, res) => {
  let templateVars = {
    user: users[req.session["user_id"]]
   };
  res.render("register", templateVars);
});

// handler for submitting registration form
app.post("/register", (req, res) => {
  let newUser = {
    id: generateRandomString(),
    email: req.body.email,
    hashedPassword: bcrypt.hashSync(req.body.password, 10)
  };

  if (newUser.email === "" || req.body.password === "") {
    res.statusCode = 400;
    res.end(`error
      please make sure to enter both your email and your password!`);
    return;
  }

  for (let userKey in users) {
    if (newUser["email"] === users[userKey]["email"]) {
      res.statusCode = 400;
      res.end(`oops
        that email address is already registered`);
      return;
    }
  }

  // add user to DB
  users[newUser["id"]] = newUser;
  // set a login cookie in the user's browser
  req.session.user_id = newUser["id"];
  res.redirect("/urls");
});

// handler for the login page
app.get("/login", (req, res) => {
  let templateVars = {
    user: users[req.session["user_id"]]
   };
  res.render("login", templateVars);
});

// handler for login submission
app.post("/login", (req, res) => {
  for (let userKey in users) {
    if (req.body.email === users[userKey].email
    && bcrypt.compareSync(req.body.password, users[userKey].hashedPassword)){
      req.session.user_id = userKey;
      res.redirect("/urls");
      return;
    }
  }
  res.statusCode = 403;
  res.end("nope -- try again");
});

// handler for logout
app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/urls");
});

// handler for new URL entry form
app.get("/urls/new", (req, res) => {
  let templateVars = {
    user: users[req.session["user_id"]]
  };
  if (templateVars.user) {
    res.render("urls_new", templateVars);
  } else {
    res.redirect("/login");
  }
});

// redirects to URL management page
app.get("/urls/:id/edit", (req, res) => {
  let templateVars = {
    user: users[req.session["user_id"]]
   };
  let shortURL = req.params.id;
  res.redirect(`/urls/${shortURL}`, templateVars);
});

// handler for management page
app.get("/urls/:id", (req, res) => {
  if (!urlDatabase[req.params.id]) {
    res.end("oops \ncheck your URL");
  }
  else if (!(req.session["user_id"] === urlDatabase[req.params.id].userID)) {
    res.end("can't edit what's not yours");
  } else {
    let templateVars = {
      shortURL: req.params.id,
      longURL: urlDatabase[req.params.id].longURL,
      user: users[req.session["user_id"]]
    };
    res.render("urls_show", templateVars);
  }
});

// URL deletion handler
app.post("/urls/:id/delete", (req, res) => {
  delete urlDatabase[req.params.id];
  res.redirect("/urls");
});

// handles updates to short URLs
app.post("/urls/:id", (req, res) => {
  let shortURL = req.params.id;
  let longURL = req.body.longURL;
  urlDatabase[shortURL].longURL = longURL;
  res.redirect("/urls");
});

// start server
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});