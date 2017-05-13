
var cookieSession = require('cookie-session');
const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const PORT = process.env.PORT || 8080;

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
  },
  "12345": {
     id: "12345",
     email: "user3@example.com",
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

//=================================***** Helper functions *****======================================

function generateRandomString() {
  return Math.random().toString(36).substr(2, 7);
};

function searchUsersByEmail(users, email) {
  for (const user in users) {
    if (users[user].email === email) {
      return users[user];
    }
  }
  return false;
};

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
}))
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static(__dirname + '/public'));
app.use((req, res, next) => {
  res.locals.user = users[req.session.user_id];
  next();
})
app.use('/urls', (req, res, next) => {
  if (!req.session.user_id) {
    //TODO render to error page
    res.redirect('/login');
  } else {
    next();
  }
})
//=============================================================================================


//=================================***** Routes *****==========================================

app.route('/urls')
  .get((req,res) => {
    let urls = urlsForUser(urlDatabase, req.session.user_id)
    let templateVars = {
      urls
    };
    res.render('urls_index', templateVars);
  })
  //Create a new url pair(short and long) and save it to the urlDatabase
  .post((req, res) => {
     let id = generateRandomString();
     urlDatabase[id]= {
       'long_url': req.body.longURL,
       'user_id': req.session.user_id
     };
     res.redirect(`/urls/${id}`);
  });

app.get('/urls/new', (req, res) => {
  res.render('urls_new');
});

app.route('/urls/:id')
//TODO guard statemenet, just protect from weird situation on the top
//check nex({status:404, message:'not found'})
// anything passed to next is considered error and then we use a error handling middleware(app.use)
  .get((req, res) => {
    if (req.params.id in urlDatabase) {
      if (urlDatabase[req.params.id].user_id == req.session.user_id) {
        let templateVars = {
          shortURL: req.params.id,
          longURL: urlDatabase[req.params.id].long_url
        };
        res.render('urls_show', templateVars);
      } else {
          res.send('You are not allowed to edit a url that you have not created!');
      }
    } else {
        res.status(404);
        res.send('Requested short URL was not found');
    }
  })
  .post((req, res) => {
    if (req.body.longURL !== urlDatabase[req.params.id].long_url) {
      //TODO dont reassign the whole obj
      urlDatabase[req.params.id] = {
        long_url: req.body.longURL,
        user_id: req.session.user_id
      };
    }
    res.redirect('/urls');
  });

app.get('/u/:shortURL', (req, res) => {
  if (req.params.shortURL in urlDatabase) {
    let longURL = urlDatabase[req.params.shortURL].long_url;
    res.redirect(longURL);
  } else {
      res.send('the url does not exist');
  }
});

app.post('/urls/:id/delete', (req, res) => {
  if (urlDatabase[req.params.id].user_id == req.session.user_id) {
    delete urlDatabase[req.params.id];
    res.redirect('/urls');
  }
  else {
    res.send('You are not allowed to delete a url that you have not created!')
  }
});

app.route('/register')
  .get((req, res) => {
    res.render('register')
  })
  .post((req, res) => {
    if (req.body.email && req.body.name && req.body.password) {
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
        req.session.user_id = id
        // res.cookie('user_id', id);
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

app.route('/login')
  .get((req, res) => {
    res.render('login');
  })
  .post((req, res) => {
    const user = searchUsersByEmail(users,req.body.email)
    if (user) {
      if (bcrypt.compareSync(req.body.password, user.password)) {
        req.session.user_id = user.id
        // res.cookie('user_id', user.id);
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
  // res.clearCookie('user_id');
  req.session = null
  res.redirect('/login');
});
//=========================================================================================================

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
