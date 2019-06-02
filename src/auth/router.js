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

authRouter.post('/key', auth, (req, res, next) => {
  let key = req.user.generateKey();
  res.status(200).send(key);
});

// should be visible by anyone
authRouter.get('/public-stuff', (request, response, next) => {
  response.status(200).send(`This is ${request.path}`);
});

// should require only a valid login
authRouter.get('/hidden-stuff', auth(), (request, response, next) => {
  response.status(200).send(`This is ${request.path}`);
});

// should require the read capability
authRouter.get(
  '/something-to-read',
  auth('read'),
  (request, response, next) => {
    response.status(200).send(`This is ${request.path}`);
  }
);

// should require the create capability
authRouter.post(
  '/create-a-thing',
  auth('create'),
  (request, response, next) => {
    response.status(200).send(`This is ${request.path}`);
  }
);

// should require the update capability
authRouter.put('/update', auth('update'), (request, response, next) => {
  response.status(200).send(`This is ${request.path}`);
});

// should require the update capability
authRouter.patch('/jp', auth('update'), (request, response, next) => {
  response.status(200).send(`This is ${request.path}`);
});

// should require the delete capability
authRouter.delete('/bye-bye', auth('delete'), (request, response, next) => {
  response.status(200).send(`This is ${request.path}`);
});

// should require the superuser capability
authRouter.get('/everything', (request, response, next) => {
  response.status(200).send(`This is ${request.path}`);
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
