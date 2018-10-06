var express = require("express");
var app = express();
var PORT = 8080;
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");
app.use(cookieParser());


function generateRandomString(){
  let key = "";
  const characters = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

  for (let i = 0; i < 6; i++) {
        key += characters.substr(Math.floor((Math.random() * characters.length)), 1);
    }
    return key;
}

var urlDatabase = {
  "b2xVn2": {userID: "user1", longURL: "http://www.lighthouselabs.ca"},
  "9sm5xK": {userID: "user2", longURL: "http://www.google.com"}
};

var users = {
  "user1": {
    id: "user1",
    email: "user1@email.com",
    password: "12345"
  },
  "user2": {
    id: "user2",
    email: "user2@email.com",
    password: "qwerty"
  }
}

function createNewURL(longURL, req) {
  let shortURL = generateRandomString();
  urlDatabase[shortURL] = {
    userID: req.cookies["user_id"],
    longURL: longURL
  };
  console.log(urlDatabase);
  return shortURL;
};

//new url entry
app.post("/urls", (req, res) => {
  let longURL = req.body.longURL;
  let shortURL = createNewURL(longURL, req);
  res.redirect(`/urls/${shortURL}`);
});

app.get("/u/:shortURL", (req, res) => {
  var shortURL = req.params.shortURL;
  let longURL = urlDatabase[shortURL].longURL;
  res.redirect(longURL);
});

app.get("/", (req, res) => {
  if (!users[req.cookies["user_id"]]) {
    res.redirect("/login");
  } else {
    res.redirect("/urls");
  }
});

app.get("/urls.json", (req, res) => {
  let templateVars = {
    user: users[req.cookies["user_id"]]
   };
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/urls", (req, res) => {
  let templateVars = {
    urls: urlDatabase,
    user: users[req.cookies["user_id"]]
   };
  res.render("urls_index", templateVars);
});

//register!!!
app.get("/register", (req, res) => {
  let templateVars = {
    user: users[req.cookies["user_id"]]
   };
  res.render("register", templateVars);
});

//registration form
app.post("/register", (req, res) => {
  let newUser = {
    id: generateRandomString(),
    email: req.body.email,
    password: req.body.password
  };

  if (newUser.email === "" || newUser.password === "") {
    res.statusCode = 400;
    res.end(`eror
      please make sure to enter both your email and your password!`);
  }

  for (var userKey in users) {
    if (newUser["email"] === users[userKey]["email"]) {
      console.log("error");
      res.statusCode = 400;
      res.end("sorry, that email address is already registered.");
    }
  }

  users[newUser["id"]] = newUser;
  res.cookie("user_id", newUser["id"]);
  res.redirect("/urls");
});

//login request
app.get("/login", (req, res) => {
  let templateVars = {
    user: users[req.cookies["user_id"]]
   };
  res.render("login", templateVars);
});

//login entry
app.post("/login", (req, res) => {
  for (var userKey in users) {
    if (req.body.email === users[userKey].email
    && req.body.password === users[userKey].password) {
      res.cookie("user_id", userKey);
      res.redirect("/");
      return;
    }
  }
  res.statusCode = 403;
  res.end("nope -- try again");
});

//logout
app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect("/urls");
});

//new urls get entered here
app.get("/urls/new", (req, res) => {
  let templateVars = {
    user: users[req.cookies["user_id"]]
  };
  res.render("urls_new", templateVars);
});

//redirects to shortURL page featuring one entry
app.get("/urls/:id/edit", (req, res) => {
  let templateVars = {
    user: users[req.cookies["user_id"]]
   };
  let shortURL = req.params.id;
  res.redirect(`/urls/${shortURL}`, templateVars);
});

app.get("/urls/:id", (req, res) => {
  let templateVars = {
    shortURL: req.params.id,
    longURL: urlDatabase[req.params.id].longURL,
    user: users[req.cookies["user_id"]]
  };
  console.log(req.params);
  res.render("urls_show", templateVars);
});

//deletes an entry
app.post("/urls/:id/delete", (req, res) => {
  delete urlDatabase[req.params.id];
  res.redirect("/urls");
});

//updates short urls
app.post("/urls/:id", (req, res) => {
  let shortURL = req.params.id;
  let longURL = req.body.longURL;
  urlDatabase[shortURL].longURL = longURL;
  res.redirect("/urls");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});