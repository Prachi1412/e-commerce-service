// const jwt = require("jsonwebtoken");
// require("dotenv").config({ path: ".env." + process.env.NODE_ENV });
// const JWT_SECRET = process.env.JWT_SECRET;
// const adminModel = require("../models/Admin/admin");
// const util = require("util");

// // const keymanager = require('../modules/jwt/server/controllers/keymanager');
// const errors = require("../utilities/errors");

// async function aclCheck(acl, roles, path, method, res, next) {
//   return new Promise((resolve, reject) => {
//     console.log(
//       "acl, roles, req.route.path, req.method.toLowerCase() : ",
//       acl,
//       roles,
//       path,
//       method
//     );
//     acl.areAnyRolesAllowed(roles, path, method, (err, isAllowed) => {
//       if (err) {
//         console.log("err-1", { err });
//         res.status(422).send(info);
//       } else {
//         if (isAllowed) {
//           resolve(next());
//         } else {
//           //   reject(err);
//           res.status(403).send({
//             message: "User is not authorized",
//           });
//         }
//       }
//     });
//   });
// }

// async function check(acl, req, res, next) {
//   console.log("Inside check fn : ", { acl, req });
//   try {
//     const token = req.token;
//     console.log("token : ", { token });

//     if (token) {
//       //   const tempDecode = await util.promisify(jwt.verify)(token, JWT_SECRET);
//       //   console.log("tempDecode : ", { tempDecode });
//       // const key = await keymanager.read(tempDecode.user._id);
//       const verify = await util.promisify(jwt.verify)(token, JWT_SECRET);
//       console.log("verify : ", { verify });
//       if (!verify) {
//         throw new errors.InvalidData({
//           message: "JWT token is not valid",
//         });
//       }
//       const { _id } = verify;
//       console.log("_id : ", { _id });

//       //Check if logged-in user still exist in db
//       const user = await adminModel.findById(_id).lean();
//       console.log("---> 6 ", { user });

//       req.user = user;
//       console.log("req.user : ", req.user);
//       const roles = user ? user.role : "guest";
//       console.log("roles : ", { roles });
//       const result = await aclCheck(
//         acl,
//         roles,
//         req.route.path,
//         req.method.toLowerCase(),
//         res,
//         next
//       );
//       console.log("Result : ", result);

//       return result;
//     } else {
//       const roles = "guest";
//       const result = await aclCheck(
//         acl,
//         roles,
//         req.route.path,
//         req.method.toLowerCase(),
//         res,
//         next
//       );
//       return result;
//     }
//   } catch (e) {
//     throw new errors.JwtExpired({
//       message: "JWT token is invalid or expired.",
//     });
//   }
// }

// module.exports = {
//   check,
// };
