//impementing middleware using jwt only those user can access who have tocken
const jwt = require("jsonwebtoken");
const adminModel = require("../models/AdminModel");
const Helper = require("../config/helper");
require("dotenv").config({
  path: ".env." + process.env.NODE_ENV,
});
const JWT_SECRET = process.env.JWT_SECRET;
const util = require("util");
const { _isApiPermission } = require("../config/adminConfig");

const userPolicy = require("../policies/AdminPanel/adminPanelPolicies");
const { log } = require("console");

async function verifyToken(req, res, next) {
  // read the token and check if it exist or not
  const { authorization } = req.headers;
  const tokenBearer = req.token;
  if (!authorization) {
    return Helper.response(res, 401, "You must be logged in");
  }

  let token = authorization;

  if (token && token.startsWith("Bearer")) {
    token = token.split(" ")[1];
  }

  try {
    // validate the token
    const decodedToken = await util.promisify(jwt.verify)(token, JWT_SECRET);
    if (!decodedToken) {
      return Helper.response(res, 403, "Token is invalid");
    }

    const { _id } = decodedToken;

    //Check if logged-in user still exist in db
    const adminData = await adminModel.findById(_id).lean();

    if (!adminData) {
      return Helper.response(res, 401, "User not found.");
    }

    if (adminData.JWT_Token.includes(token)) {
      adminData.JWT_Token = [token];
      req.user = adminData;
      // if (adminData.role == "superadmin" || adminData.role == "admin") {
      //   // Remove query parameters from the requested path
      //   const pathWithoutQueryParams = req.originalUrl.split("?")[0];
      //   let _isAllowed =
      //     _isApiPermission[adminData.role][pathWithoutQueryParams];

      //   if (typeof _isAllowed !== "undefined" && _isAllowed) {
      //     next();
      //   } else {
      //     return Helper.response(res, 401, "Invalid authentication");
      //   }
      // } else {
      //   next();
      // }
      next();
    } else {
      return Helper.response(res, 401, "Token is invalid");
    }
  } catch (error) {
    return Helper.response(res, 401, "Token is invalid");
  }
}

const checkPermission = (resource) => {
  return async (req, res, next) => {
    const userId = req.user && req.user._id.toString();

    const isAllowed = await userPolicy.acl.isAllowed(
      req.user.role,
      resource,
      req.method.toLowerCase()
    );
    if (isAllowed) {
      next();
    } else {
      res.status(403).json({
        error: "Access denied",
      });
    }
  };
};

module.exports = {
  verifyToken,
  checkPermission,
};
