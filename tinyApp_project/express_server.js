var express = require("express");
var app = express();
var PORT = 8080; // default port 8080
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");
app.use(cookieParser());


function generateRandomString(){
  var i, key = "", characters = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"

  for (i = 0; i < 6; i++) {
        key += characters.substr(Math.floor((Math.random() * characters.length)), 1);
    }
    return key;
}

var urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
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

//new url entry
app.post("/urls", (req, res) => {
  let longURL = req.body.longURL;
  let shortURL = createNewURL(longURL);
  res.redirect(`/urls/${shortURL}`);
});

function createNewURL(longURL) {
  let shortURL = generateRandomString();
  urlDatabase[shortURL] = longURL;
  return shortURL;
};

app.get("/u/:shortURL", (req, res) => {
  var shortURL = req.params.shortURL;
  let longURL = urlDatabase[shortURL];
  res.redirect(longURL);
});


app.get("/", (req, res) => {
  res.send("Hello!");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/urls", (req, res) => {
  let templateVars = {
    urls: urlDatabase,
    username: req.cookies["username"]
   };
  res.render("urls_index", templateVars);
});

//register!!!
app.get("/register", (req, res) => {
  res.render("register");
});

app.post("/register", (req, res) => {
  newUser = {};
  newUser["id"] = generateRandomString();
  newUser["email"] = req.body.email;
  newUser["password"] = req.body.password;
  users[newUser["id"]] = newUser;
  res.cookie("user_id", newUser["id"]);
  console.log(users);
  res.redirect(`/urls`);
});

//login entry
app.post("/login", (req, res) => {
  res.cookie('username', req.body.username);
  res.redirect(`/urls`);
});


//logout
app.post("/logout", (req, res) => {
  res.clearCookie('username');
  res.redirect(`/urls`);
});

//new urls get entered here
app.get("/urls/new", (req, res) => {
  let templateVars = {
    username: req.cookies["username"]
  };
  res.render("urls_new", templateVars);
});

//objects in my templateVar get stored here, including cookies

//redirects to shortURL page featuring one entry
app.get("/urls/:id/edit", (req, res) => {
  let shortURL =req.params.id;
  res.redirect(`/urls/${shortURL}`);
});

app.get("/urls/:id", (req, res) => {
  let templateVars = {
    shortURL: req.params.id,
    longURL: urlDatabase[req.params.id],
    username: req.cookies["username"]
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
  urlDatabase[shortURL] = longURL;
  res.redirect("/urls");
});
