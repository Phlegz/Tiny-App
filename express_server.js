'use strict'
const express = require('express');
const app = express();
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const PORT = process.env.PORT || 8080;

let users = {
  "user1RandomID": {
    id: "user1RandomID",
    email: "user1@example.com",
    password: "pass1"
  },
 "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "pass2"
  }
};

let urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

function generateRandomString() {
  return Math.random().toString(36).substr(2, 7);
};

app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());
app.use(express.static(__dirname + '/public'));

//=================================****** configure ejs ******====================================

app.set('view engine', 'ejs');

//=================================***** Routes *****=============================================

app.get('/urls.json', (req, res) => {
  res.json(urlDatabase);
});

app.get('/urls', (req,res) => {
  let templateVars = {
    urls: urlDatabase,
    username: users[req.cookies['user_id']].email
  };
  res.render('urls_index', templateVars);
});

app.get('/urls/new', (req, res) => {
  let templateVars = {
    username: users[req.cookies['user_id']].email
  };
  res.render('urls_new', templateVars);
});

app.get('/urls/:id', (req, res) => {
  if (req.params.id in urlDatabase) {
    let templateVars = {
      shortURL: req.params.id,
      username: users[req.cookies['user_id']].email
    };
    res.render('urls_show', templateVars);
  } else {
    res.status(404);
    res.send('Requested short URL was not found');
  }
});

app.post('/urls/:id', (req, res) => {
  if (req.body.shortURL !== req.params.id) {
    urlDatabase[req.body.shortURL] = urlDatabase[req.params.id];
    delete urlDatabase[req.params.id];
  }
  res.redirect('/urls');
});

app.get('/u/:shortURL', (req, res) => {
  if (urlDatabase.hasOwnProperty(req.params.shortURL)) {
    let longURL = urlDatabase[req.params.shortURL];
    res.redirect(longURL);
  } else {

    res.send('the url does not exist');
  }
});

 //Create a new url pair(short and long) and save it to the urlDatabase
app.post('/urls', (req, res) => {
  let id = generateRandomString();
  urlDatabase[id]= req.body.longURL;
  res.redirect(`/urls/${id}`);
});

app.post('/urls/:id/delete', (req, res) => {
  delete urlDatabase[req.params.id];
  res.redirect('/urls');
});

app.get('/register', (req, res) => {
  res.render('register')
});

app.post('/register', (req, res) => {
  let id = generateRandomString();
  if (req.body.email && req.body.name && req.body.password) {
    users[id] = {
      email: req.body.email,
      name: req.body.name,
      password: req.body.password
    };
    res.cookie('user_id',id);
    res.redirect('/urls');
  } else {
      res.redirect('/register');
  }
});

app.get('/login', (req, res) => {
  res.render('login');
});

app.post('/login', (req, res) => {
  for (var user in users) {
    if (users[user].email == req.body.email && users[user].password == req.body.password) {
      res.cookie('user_id', user);
      res.redirect('/urls');
      return;
    }
  }
  res.redirect('/register');
});

app.post('/logout', (req, res) => {
  res.clearCookie('user_id');
  res.redirect('/login');
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
