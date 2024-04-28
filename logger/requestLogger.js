const fs = require("fs");
const { logger } = require("./winston");
const util = require("util");
const config = require("./logConfig.json");

/**
 * Return the current api URL
 * @param {object} request - request object
 */
const getRoute = (req) => {
  const route = req.route ? req.route.path : ""; // check if the handler exist
  const baseUrl = req.baseUrl ? req.baseUrl : ""; // adding the base url if the handler is child of other handler

  return route ? `${baseUrl === "/" ? "" : baseUrl}${route}` : "unknown route";
};

/**
 * HTTP request middleware to log all api request
 * @param
 */
const logRequestStates = () => {
  return (req, res, next) => {
    if (config.logHttpRequest) {
      res.on("finish", () => {
        // console.log(util.inspect(res, false, null, true /* enable colors */));
        const logPayload = {
          TYPE: req.method || "",
          URL_ENDPOINT: getRoute(req), // URL end-point
          GET_PARAMS: req.params || {},
          GET_QUERY_URL: req.query || {},
          POST_BODY: req.body || {}, // Request POST data body
          USER_ID:
            req.user !== undefined && req.user._id !== undefined
              ? req.user._id
              : "NA", //  to log userid , make sure to add user object to your auth route middleware (req.user = {USERINFO})
          RESPONSE_CODE: res.statusCode, // API response status code
          RESPONSE_MSG: res.statusMessage,
          IP: req.headers["x-forwarded-for"] || req.socket.remoteAddress, // get client IP is exist
        };
        if (res.statusCode >= 500) {
          logger.error(JSON.stringify(logPayload));
        } else {
          logger.info(JSON.stringify(logPayload));
        }
      });
    }

    next();
  };
};
module.exports = logRequestStates;
