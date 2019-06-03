'use strict';

/**
 * API Router Module (V1)
 * Integrates with various models through a common Interface (.get(), .post(), .put(), .delete())
 * @module src/api/v1
 */

const cwd = process.cwd();

const express = require('express');

const modelFinder = require(`${cwd}/src/middleware/model-finder.js`);
const auth = require('../auth/middleware.js');

const router = express.Router();

// Evaluate the model, dynamically
router.param('model', modelFinder);

// API Routes
router.get('/api/v1/:model', handleGetAll);
router.post('/api/v1/:model', auth('create'), handlePost);
router.get('/api/v1/:model/:id', handleGetOne);
router.put('/api/v1/:model/:id', auth('update'), handlePut);
router.patch('/api/v1/:model/:id', auth('update'), handlePatch);
router.delete('/api/v1/:model/:id', auth('delete'), handleDelete);

/**
 * Handler for get /:model
 * @param {*} request
 * @param {*} response
 * @param {*} next
 */
function handleGetAll(request, response, next) {
  request.model
    .get()
    .then(data => {
      const output = {
        count: data.length,
        results: data,
      };
      response.status(200).json(output);
    })
    .catch(next);
}

/**
 * Handler for GET /:model/:id
 * @param {*} request
 * @param {*} response
 * @param {*} next
 */
function handleGetOne(request, response, next) {
  request.model
    .get(request.params.id)
    .then(result => response.status(200).json(result[0]))
    .catch(next);
}

/**
 * Handler for POST /:model
 * @param {*} request
 * @param {*} response
 * @param {*} next
 */
function handlePost(request, response, next) {
  request.model
    .post(request.body)
    .then(result => response.status(200).json(result))
    .catch(next);
}

/**
 * Handler for PUT /:model
 * @param {*} request
 * @param {*} response
 * @param {*} next
 */
function handlePut(request, response, next) {
  request.model
    .put(request.params.id, request.body)
    .then(result => response.status(200).json(result))
    .catch(next);
}

/**
 * Handler for PATCH /:model
 * @param {*} request
 * @param {*} response
 * @param {*} next
 */
function handlePatch(request, response, next) {
  request.model
    .patch(request.params.id, request.body)
    .then(result => response.status(200).json(result))
    .catch(next);
}

/**
 * Handler for DELETE /:model/:id
 * @param {*} request
 * @param {*} response
 * @param {*} next
 */
function handleDelete(request, response, next) {
  request.model
    .delete(request.params.id)
    .then(result => response.status(200).json(result))
    .catch(next);
}

module.exports = router;
