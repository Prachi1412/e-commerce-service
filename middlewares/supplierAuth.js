//impementing middleware using jwt only those user can access who have tocken
const jwt = require("jsonwebtoken");
const supplierModel = require("../models/SupplierModel");
const adminModel = require("../models/AdminModel");
const Helper = require("../config/helper");
require("dotenv").config({ path: ".env." + process.env.NODE_ENV });
const JWT_SECRET = process.env.JWT_SECRET;
const util = require("util");
const { _isApiPermission } = require("../config/adminConfig");
// const userPolicy = require("../policies/Admin/adminPolicies");

async function verifyToken(req, res, next) {
  // read the token and check if it exist or not
  const { authorization } = req.headers;
  const tokenBearer = req.token;
  // console.log("---> 1 ", { authorization });
  // console.log("---> 1.1 ", { tokenBearer });
  // console.log("req Object : ", { req });

  if (!authorization) {
    return Helper.response(res, 401, "You must be logged in");
  }

  let token = authorization;
  // console.log("---> 2 ", { token });

  if (token && token.startsWith("Bearer")) {
    token = token.split(" ")[1];
    // console.log("---> 3 ", { token });
  }

  try {
    // const decodedToken = await new Promise((resolve, reject) => {
    //   jwt.verify(token, JWT_SECRET, (err, decodedToken) => {
    //     if (err) {
    //       reject(Helper.response(res, 401, "You must be logged in"));
    //     } else {
    //       resolve(decodedToken);
    //     }
    //   });
    // });

    // validate the token
    const decodedToken = await util.promisify(jwt.verify)(token, JWT_SECRET);
    // console.log("---> 4 ", { decodedToken });
    if (!decodedToken) {
      return Helper.response(res, 401, "Token is invalid");
    }

    const { _id } = decodedToken;
    // console.log("---> 5 ", { _id });

    //Check if logged-in user still exist in db
    const supplierData = await supplierModel.findById(_id).lean();
    // console.log("---> 6 ", { supplierData });

    if (!supplierData) {
      return Helper.response(res, 401, "User not found.");
    }

    if (supplierData.JWT_Token.includes(token)) {
      // console.log("---> 7 ", supplierData.JWT_Token.includes(token));
      supplierData.JWT_Token = [token];
      req.user = supplierData;
      // console.log("---> 8 ", req.user);
      next();
    } else {
      return Helper.response(res, 401, "Token is invalid");
    }
  } catch (error) {
    return Helper.response(res, 401, "Token is invalid");
  }
}

async function verifyTokenAdmin(req, res, next) {
  const { authorization } = req.headers;
  if (!authorization) {
    return Helper.response(res, 401, "you must be logged in");
  }
  const token = authorization;
  jwt.verify(token, JWT_SECRET, (err, payload) => {
    if (err) {
      return Helper.response(res, 401, "you must be logged in");
    }
    const { _id } = payload;
    adminModel
      .findById(_id)
      .lean()
      .then((admindata) => {
        if (admindata === null) {
          return Helper.response(res, 401, "Token is invalid");
        }
        if (admindata.JWT_Token.includes(token)) {
          admindata.JWT_Token = [token];
          req.admin = admindata;
          // if (admindata.role == "program management" || admindata.role == "operations") {
          //   let _isAllowed = _isApiPermission[admindata.role][req.route.path];

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
      });
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
      res.status(403).json({ error: "Access denied" });
    }
  };
};

module.exports = {
  verifyToken,
  checkPermission,
  verifyTokenAdmin,
};
