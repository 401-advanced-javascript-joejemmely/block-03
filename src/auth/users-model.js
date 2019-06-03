'use strict';

const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('./roles-model.js');

const SINGLE_USE_TOKENS = !!process.env.SINGLE_USE_TOKENS;
const TOKEN_EXPIRE = process.env.TOKEN_LIFETIME || '5m';
const SECRET = process.env.SECRET;

const usedTokens = new Set();

const users = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    email: { type: String },
    role: { type: String, default: 'user', enum: ['admin', 'editor', 'user'] },
  },
  { toObject: { virtuals: true }, toJSON: { virtuals: true } }
);

/**
 * Create a virtual of the capabilities into the user
 */
users.virtual('capabilities', {
  ref: 'roles',
  localField: 'role',
  foreignField: 'role',
  justOne: false,
});

/**
 * Mongoose Hook - Populate the capabilites into the user
 */
users.pre('findOne', function() {
  try {
    this.populate('capabilities');
  } catch (error) {
    console.log('Find Error', error);
  }
});

/**
 * Hash the password before saving into the DB
 */
users.pre('save', function(next) {
  bcrypt
    .hash(this.password, 10)
    .then(hashedPassword => {
      this.password = hashedPassword;
      next();
    })
    .catch(error => {
      throw new Error(error);
    });
});

/**
 * Create user from OAuth
 * @param {string} email
 */
users.statics.createFromOauth = function(email) {
  if (!email) {
    return Promise.reject('Validation Error');
  }

  return this.findOne({ email })
    .then(user => {
      if (!user) {
        throw new Error('User Not Found');
      }
      return user;
    })
    .catch(error => {
      let username = email;
      let password = 'none';
      return this.create({ username, password, email });
    });
};

/**
 * Authenticate with token
 * @param {string} token
 */
users.statics.authenticateToken = function(token) {
  if (usedTokens.has(token)) {
    return Promise.reject('Invalid Token');
  }

  try {
    let parsedToken = jwt.verify(token, SECRET);
    SINGLE_USE_TOKENS && parsedToken.type !== 'key' && usedTokens.add(token);
    let query = { _id: parsedToken.id };
    return this.findOne(query);
  } catch (e) {
    throw new Error('Invalid Token');
  }
};

/**
 * Authenticate with username:password
 */
users.statics.authenticateBasic = function(auth) {
  let query = { username: auth.username };
  return this.findOne(query)
    .then(user => user && user.comparePassword(auth.password))
    .catch(error => {
      throw error;
    });
};

/**
 * Check if the provided password match the one in the DB
 */
users.methods.comparePassword = function(password) {
  return bcrypt
    .compare(password, this.password)
    .then(valid => (valid ? this : null));
};

/**
 * Generate a token
 */
users.methods.generateToken = function(type) {
  let token = {
    id: this._id,
    capabilities: this.capabilities[0].capabilities,
    type: type || 'user',
  };

  let options = {};
  if (type !== 'key' && !!TOKEN_EXPIRE) {
    options = { expiresIn: TOKEN_EXPIRE };
  }

  return jwt.sign(token, SECRET, options);
};

/**
 * Check if a user can do what he wants to do
 */
users.methods.can = function(capability) {
  const capabilities = this.capabilities[0].capabilities;
  return capabilities.includes(capability);
};

/**
 * Generate a login key
 */
users.methods.generateKey = function() {
  return this.generateToken('key');
};

module.exports = mongoose.model('users', users);
