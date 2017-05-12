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
  },
  "12345": {
     id: "12345",
     email: "user2@example.com",
     password: "pass2"
   }
};

let urlDatabase = {
   "b2xVn2":{
      'long_url': "http://www.lighthouselabs.ca",
      'user_id': '12345'
    },
   "9sm5xK": {
     'long_url':"http://www.google.com",
     'user_id': '56789'
    }
};

function generateRandomString() {
  return Math.random().toString(36).substr(2, 7);
};

function searchUsersByEmail(obj,email) {
  for (var prop in obj) {
    if (obj[prop].email == email) {
      return obj[prop];
    }
  }
  return false;
};

app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());
app.use(express.static(__dirname + '/public'));
app.use('/urls/new', function (req, res, next) {
  if (!req.cookies['user_id']) {
    res.redirect('/login')
  } else {
    next();
  }
})

//=================================****** configure ejs ******====================================

app.set('view engine', 'ejs');

//=================================***** Routes *****=============================================

app.get('/urls.json', (req, res) => {
  res.json(urlDatabase);
});

app.get('/urls', (req,res) => {
  let templateVars = {
    urls: urlDatabase,
    user: users[req.cookies['user_id']]
  };
  res.render('urls_index', templateVars);
});

app.get('/urls/new', (req, res) => {
  let templateVars = {
    user: users[req.cookies['user_id']]
  };
  res.render('urls_new', templateVars);
});

app.get('/urls/:id', (req, res) => {
  if (req.params.id in urlDatabase) {
    if(urlDatabase[req.params.id].user_id == req.cookies['user_id']) {
      let templateVars = {
        shortURL: req.params.id,
        user: users[req.cookies['user_id']]
      };
      res.render('urls_show', templateVars);
    } else {
      res.send('You are not allowed to edit a url that you have not created!');
      return;
    }
  } else {
    res.status(404);
    res.send('Requested short URL was not found');
  }
});

app.post('/urls/:id', (req, res) => {
  if (req.body.shortURL !== req.params.id) {
    urlDatabase[req.body.shortURL] = {
      long_url: urlDatabase[req.params.id].long_url,
      user_id: req.cookies['user_id']
    };
    delete urlDatabase[req.params.id];
  }
  res.redirect('/urls');
});

app.get('/u/:shortURL', (req, res) => {
  //TODO change the next line of code to if (prop in obj)
  if (req.params.shortURL in urlDatabase) {
    let longURL = urlDatabase[req.params.shortURL].long_url;
    res.redirect(longURL);
  } else {
    res.send('the url does not exist');
  }
});

 //Create a new url pair(short and long) and save it to the urlDatabase
app.post('/urls', (req, res) => {
  let id = generateRandomString();
  urlDatabase[id]= {
    'long_url': req.body.longURL,
    'user_id': req.cookies['user_id']
  };
  res.redirect(`/urls/${id}`);
});

app.post('/urls/:id/delete', (req, res) => {
  if (urlDatabase[req.params.id].user_id == req.cookies['user_id']) {
    delete urlDatabase[req.params.id];
    res.redirect('/urls');
  }
  else {
    res.send('You are not allowed to delete a url that you have not created!')
  }
});

app.get('/register', (req, res) => {
  res.render('register')
});

app.post('/register', (req, res) => {
  const id = generateRandomString();
  const user = searchUsersByEmail(users, req.body.email);
  if (req.body.email && req.body.name && req.body.password) {
    if (!user) {
    users[id] = {
      id: id,
      email: req.body.email,
      name: req.body.name,
      password: req.body.password
    };
    res.cookie('user_id',id);
    res.redirect('/urls');
    } else {
      res.status(400)
      res.send('user already exist')
      return;
    }
  } else {
      res.redirect('/register');
  }
});

app.get('/login', (req, res) => {
  res.render('login');
});

app.post('/login', (req, res) => {
  const user = searchUsersByEmail(users,req.body.email)
  if (user) {
    if (user.password == req.body.password) {
      res.cookie('user_id', user.id);
      res.redirect('/urls');
      return;
    } else {
      res.status(403);
      res.send('incorrect credentials')
    }
  } else {
      res.redirect('/register');
  }
});

app.post('/logout', (req, res) => {
  res.clearCookie('user_id');
  res.redirect('/login');
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
