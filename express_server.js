'use strict'
const express = require('express');
const app = express();
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const PORT = process.env.PORT || 8080;


function generateRandomString() {
  return Math.random().toString(36).substr(2, 7);
};

app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());
app.set('view engine', 'ejs');

let urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

app.get('/urls.json', (req, res) => {
  res.json(urlDatabase);
});

app.get('/urls', (req,res) => {
  let templateVars = {
    urls: urlDatabase,
    username: req.cookies['username']
  };
  res.render('urls_index', templateVars);
});

app.get('/urls/new', (req, res) => {
  let templateVars = {
    username: req.cookies['username']
  };
  res.render('urls_new', templateVars);
});

app.get('/urls/:id', (req, res) => {
  if (urlDatabase.hasOwnProperty(req.params.id)) {
    let templateVars = {
      shortURL: req.params.id,
      username: req.cookies['username']
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

app.post('/urls', (req, res) => {
  let id = generateRandomString();
  urlDatabase[id]= req.body.longURL;
  console.log(urlDatabase);
  res.redirect(`/urls/${id}`);
});

app.post('/urls/:id/delete', (req, res) => {
  delete urlDatabase[req.params.id];
  res.redirect('/urls');
});

app.post('/login', (req, res) => {
  res.cookie('username',req.body.username);
  res.redirect('/urls')
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
