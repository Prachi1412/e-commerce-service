//impementing middleware using jwt only those user can access who have tocken
const jwt = require("jsonwebtoken");
const customerModel = require("../models/CustomerModel");
const supplierModel = require("../models/SupplierModel");
const adminModel = require("../models/AdminModel");
const Helper = require("../config/helper");
require("dotenv").config({
  path: ".env." + process.env.NODE_ENV,
});
const JWT_SECRET = process.env.JWT_SECRET;
const util = require("util");

// const userPolicy = require("../policies/Admin/adminPolicies");

async function verifyToken(req, res, next) {
  const { authorization } = req.headers;
  if (!authorization) {
    return Helper.response(res, 401, "you must be logged in");
  }
  const token = authorization;
  jwt.verify(token, JWT_SECRET, (err, payload) => {
    if (err) {
      return Helper.response(res, 401, "you must be logged in");
    }
    const { _id, role } = payload;
    // console.log(_id, "role", role);
    const options = {
      timeZone: "Asia/Kolkata", // 'Asia/Singapore'
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    };
    if (role === undefined || role == "undefined" || role === "customer") {
      customerModel
        .findById(_id)
        .lean()
        .then(async (userdata) => {
          if (userdata === null) {
            let checkAdmin = await adminModel.findById(_id);
            if (checkAdmin) {
              const currentDate = new Date().toLocaleString("en-US", options);
              if (checkAdmin.JWT_Token.includes(token)) {
                checkAdmin.JWT_Token = [token];
                checkAdmin.role = "admin";
                req.user = checkAdmin;
                req.currentDate = currentDate;
                return next();
              } else {
                return Helper.response(res, 401, "Token is invalid");
              }
            } else {
              return Helper.response(res, 401, "Token is invalid");
            }
          }

          const currentDate = new Date().toLocaleString("en-US", options);
          if (userdata.jwtToken.includes(token)) {
            userdata.jwtToken = [token];
            userdata.role = "customer";
            req.user = userdata;
            req.currentDate = currentDate;
            next();
          } else {
            return Helper.response(res, 401, "Token is invalid");
          }
        });
    }
    if (role === "supplier") {
      supplierModel
        .findById(_id)
        .lean()
        .then((userdata) => {
          if (userdata === null) {
            return Helper.response(res, 401, "Token is invalid");
          }
          const currentDate = new Date().toLocaleString("en-US", options);
          if (userdata.JWT_Token.includes(token)) {
            userdata.JWT_Token = [token];
            req.user = userdata;
            req.currentDate = currentDate;
            next();
          } else {
            return Helper.response(res, 401, "Token is invalid");
          }
        });
    }
  });
}

const checkPermission = (resource) => {
  return async (req, res, next) => {
    const userId = req.user && req.user._id.toString();
    const isAllowed = await userPolicy.isAllowed(
      userId,
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
