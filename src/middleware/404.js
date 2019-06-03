'use strict';

/**
 * 404 middleware
 */
module.exports = (req, res, next) => {
  let error = { error: 'Resource Not Found' };
  res
    .status(404)
    .json(error)
    .end();
};
