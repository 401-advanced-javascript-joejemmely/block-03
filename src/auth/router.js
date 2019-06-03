'use strict';

const express = require('express');
const authRouter = express.Router();

const User = require('./users-model.js');
const Role = require('./roles-model.js');
const auth = require('./middleware.js');
const oauth = require('./oauth/google.js');

authRouter.post('/signup', (req, res, next) => {
  let user = new User(req.body);
  user
    .save()
    .then(user => {
      req.token = user.generateToken();
      req.user = user;
      res.set('token', req.token);
      res.cookie('auth', req.token);
      res.send(req.token);
    })
    .catch(next);
});

authRouter.post('/signin', auth(), (req, res, next) => {
  res.cookie('auth', req.token);
  res.send(req.token);
});

authRouter.get('/oauth', (req, res, next) => {
  oauth
    .authorize(req)
    .then(token => {
      res.status(200).send(token);
    })
    .catch(next);
});

// Create roles
authRouter.get('/createRoles', (request, response, next) => {
  const capabilities = {
    admin: ['create', 'read', 'update', 'delete'],
    editor: ['create', 'read', 'update'],
    user: ['read'],
  };

  Object.keys(capabilities).forEach(role =>
    Role.create({ role, capabilities: capabilities[role] }, error => {
      if (error) {
        console.log('The role exist already');
      }
    })
  );
  response.status(200).send('The roles have been created');
});

module.exports = authRouter;
