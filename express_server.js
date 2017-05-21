
const cookieSession = require('cookie-session');
const express       = require('express');
const bodyParser    = require('body-parser');
const bcrypt        = require('bcrypt');
const PORT          = process.env.PORT || 8080;

//users and urlDatabase objects have been populated with some example data to demonstrate the format of data being saved to them
const users = {
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

const urlDatabase = {
   "b2xVn2":{
      'long_url': "http://www.lighthouselabs.ca",
      'user_id': '12345'
    },
   "9sm5xK": {
     'long_url':"http://www.google.com",
     'user_id': 'user2RandomID'
    }
};

//===============================***** Start the express app ******=============================
const app = express();
//==============================================================================================


//=================================****** Configure ejs ******==================================
app.set('view engine', 'ejs');
//==============================================================================================


//===============================******* Express middlewares *****==============================
app.use(cookieSession({
  name: 'session',
  keys: ['key1', 'key2'],
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}));
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static(__dirname + '/public'));
app.use((req, res, next) => {
  res.locals.user = users[req.session.user_id];
  next();
});
app.use('/urls', (req, res, next) => {
  if (!req.session.user_id) {
      res.status(401);
      res.render('error');
  } else {
      next();
  }
});
//=============================================================================================


//=================================***** Helper functions *****======================================
function generateRandomString() {
  return Math.random().toString(36).substr(2, 7);
}

/**
@param {Object} users
@param {String} email
*/
function searchUsersByEmail(users, email) {
  for (const user in users) {
    if (users[user].email === email) {
        return users[user];
    }
  }
  return false;
}

/**
@param {Object} urlDatabase
@param {String} userId
*/
function urlsForUser(urlDatabase, userId) {
  const urls = {};
  for (const key in urlDatabase) {
    if (urlDatabase[key].user_id === userId) {
        urls[key] = urlDatabase[key];
    }
  }
  return urls;
}
//==============================================================================================


//=================================***** Routes *****==========================================
app.get('/', (req, res) => {
  if (req.session.user_id) {
      res.redirect('/urls');
  } else {
      res.redirect('/login');
  }
});

app.route('/urls')
  .get((req, res) => {
    const urls = urlsForUser(urlDatabase, req.session.user_id)
    const templateVars = {
      urls
    };
    res.render('urls_index', templateVars);
  })
  .post((req, res) => {
    const dateCreated = new Date().toLocaleString();
    const id = generateRandomString();
    urlDatabase[id]= {
     'long_url': req.body.longURL,
     'date_created': dateCreated,
     'user_id': req.session.user_id
    };
    res.redirect(`/urls/${id}`);
  });

app.get('/urls/new', (req, res) => {
  res.render('urls_new');
});

app.route('/urls/:id')
  .get((req, res) => {
    if (!(req.params.id in urlDatabase)) {
        res.status(404);
        res.render('error',{status:404, message: 'The requested short URL was not found!'});
        return;
    }
    if (urlDatabase[req.params.id].user_id !== req.session.user_id) {
        res.status(401);
        res.render('error',{status:401, message: 'You are not allowed to edit/delete a url that you have not created!'});
        return;
    }
    const templateVars = {
      shortURL: req.params.id,
      longURL: urlDatabase[req.params.id].long_url
    };
    res.render('urls_show', templateVars);
  })
  .post((req, res) => {
    if (req.body.longURL !== urlDatabase[req.params.id].long_url) {
        urlDatabase[req.params.id].long_url = req.body.longURL;
    }
    res.redirect('/urls');
  });

app.post('/urls/:id/delete', (req, res) => {
  if (urlDatabase[req.params.id].user_id === req.session.user_id) {
      delete urlDatabase[req.params.id];
      res.redirect('/urls');
  } else {
      res.status(401);
      res.render('error', {status: 401, message: 'You are not allowed to edit/delete a url that you have not created!'});
  }
});

app.get('/u/:shortURL', (req, res) => {
  if (req.params.shortURL in urlDatabase) {
      const longURL = urlDatabase[req.params.shortURL].long_url;
      res.redirect(longURL);
  } else {
      res.status(404);
      res.render('error', {status:404, message: 'The requested short URL was not found!'});
  }
});

app.route('/register')
  .get((req, res) => {
    if (req.session.user_id) {
        res.redirect('/urls');
        return;
    }
    res.render('register');
  })
  .post((req, res) => {
    if (!(req.body.email && req.body.password)) {
        res.status(400).send('Fields can not be empty');
    }
    const user = searchUsersByEmail(users, req.body.email);
    if (!user) {
        const password = req.body.password;
        const hashed_password = bcrypt.hashSync(password, 10);
        const id = generateRandomString();
        users[id] = {
          id: id,
          email: req.body.email,
          name: req.body.name,
          password: hashed_password
        };
        req.session.user_id = id;
        res.redirect('/urls');
    } else {
        res.status(400);
        res.send('user already exist');
    }
  });

app.route('/login')
  .get((req, res) => {
    if (req.session.user_id) {
        res.redirect('/urls');
        return;
    }
    res.render('login');
  })
  .post((req, res) => {
    const user = searchUsersByEmail(users,req.body.email);
    if (user) {
        if (bcrypt.compareSync(req.body.password, user.password)) {
            req.session.user_id = user.id;
            res.redirect('/urls');
        } else {
            res.status(403).send('incorrect credentials');
        }
    } else {
        res.status(403).send('Please register before loggin in');
    }
  });

app.post('/logout', (req, res) => {
  req.session = null;
  res.redirect('/urls');
});
//=========================================================================================================

app.listen(PORT, () => {
  console.log(`Express app listening on port ${PORT}!`);
});
