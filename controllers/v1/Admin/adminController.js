const mongoose = require("mongoose");
const adminModel = mongoose.model("Admin");
const Helper = require("../../../config/helper");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const CustomerModel = require("../../../models/CustomerModel");
const SupplierModel = require("../../../models/SupplierModel");
const ProductModel = require("../../../models/ProductModel");
const ServiceModel = require("../../../models/ServiceModel");
const OrderModel = require("../../../models/OrderModel");
const QueryChatModel = require("../../../models/queryChatModel");
const ReviewModel = require("../../../models/ReviewModel");
const SupportModel = require("../../../models/SupportModel");
const QueryModel = require("../../../models/QueryModel");
const SECRET_KEY = process.env.JWT_SECRET;
module.exports = {
  login: async (req, res) => {
    console.log("Inside Admin Login Controller");
    const { email, password } = req.body;
    console.log({ email, password });
    // res.send('Admin Controller login function called .....')

    try {
      const savedUser = await adminModel.findOne({
        email: email,
        status: "Active",
      });

      if (!savedUser) {
        return Helper.response(
          res,
          422,
          "Your account is currently deactivated. Please contact your administrators for assistance"
        );
      }

      const doMatch = await bcrypt.compare(password, savedUser.password);

      if (doMatch) {
        const JWT_Token = jwt.sign({ _id: savedUser._id }, SECRET_KEY);

        const updatedAdmin = await adminModel.findOneAndUpdate(
          { _id: savedUser._id },
          { $push: { JWT_Token: JWT_Token } },
          { new: true }
        );

        if (updatedAdmin) {
          const { _id, name, email, role } = updatedAdmin;
          return res.status(200).json({
            code: 200,
            message: "Login Successful.",
            admindata: {
              _id,
              name,
              email,
              role,
              // _isAdminPermission: _isAdminPermission[role],
              JWT_Token: [JWT_Token],
            },
          });
        } else {
          return Helper.response(res, 422, "Something went wrong.");
        }
      } else {
        return Helper.response(res, 422, "Invalid Email or password.");
      }
    } catch (error) {
      console.log("Error :  ", error);
      return Helper.response(res, 500, "Server error.");
    }
  },
  logout: async (req, res) => {
    try {
      console.log("req.user : ", req.admin);
      const { _id } = req.admin;
      console.log("req.headers : ", req.headers);
      const { authorization } = req.headers;
      const token = authorization;

      const userResult = await adminModel
        .findOneAndUpdate(
          { _id: new mongoose.Types.ObjectId(_id) },
          { $pull: { JWT_Token: token } },
          { new: true }
        )
        .exec();
      console.log("userResult : ", userResult);

      if (!userResult) {
        return Helper.response(res, 422, "Something went wrong.");
      } else {
        return Helper.response(res, 200, "Logout successfully.");
      }
    } catch (error) {
      return Helper.response(res, 500, "Server error.");
    }
  },
  changePassword: async (req, res) => {
    try {
      const admin = await adminModel.findOne({
        _id: req.admin._id,
        status: "Active",
      });

      if (!admin) {
        return Helper.response(res, 422, "Admin not found.");
      }

      if (req.body.newPassword !== req.body.confirmPassword) {
        return Helper.response(
          res,
          422,
          "Password and confirm password don't match."
        );
      }

      const newPasswordHash = await bcrypt.hash(req.body.newPassword, 10);

      const updatedAdmin = await adminModel.findOneAndUpdate(
        { _id: admin._id },
        { $set: { password: newPasswordHash } },
        { new: true }
      );

      return Helper.response(res, 200, "Password changed successfully.");
    } catch (error) {
      console.error(error);
      return Helper.response(res, 500, "Server error.");
    }
  },
  forgotPassword: async (req, res) => {
    try {
      crypto.randomBytes(32, async (err, buffer) => {
        if (err) {
          return Helper.response(res, 422, "Something went wrong");
        }
        let isExist = await adminModel.findOne({
          email: req.body.email,
          status: "Delete",
        });
        if (isExist) {
          return Helper.response(
            res,
            422,
            "Your account is currently deactivated. Please contact your administrators for assistance"
          );
        }
        var otp = Helper.generate_otp();
        adminModel
          .findOneAndUpdate(
            {
              email: req.body.email,
            },
            {
              $set: {
                otp: otp,
                isOtpVerified: false,
                otpExpiredToken: Date.now() + 600000,
              },
            }, // expires in 10 min
            { new: true }
          )
          .then((admin) => {
            if (!admin) {
              return Helper.response(
                res,
                422,
                "admin does not exist with this email."
              );
            }
            // admin.resetToken = token
            // admin.expireToken = Date.now() + 3600000
            admin
              .save({
                validateBeforeSave: false,
              })
              .then(async (result) => {
                var resReult = {
                  _id: result._id,
                };
                var html = `
                               <p>Your OTP to reset password is <b>${otp}</b><br>Expires in <b>10 minutes</b></p> </br></br></br>
                              `;
                await Helper.send365Email(
                  process.env.MAIL_SEND_EMAIL,
                  result.email,
                  "Reset Password",
                  html,
                  "text"
                );
                return Helper.response(
                  res,
                  200,
                  "You should soon receive an email of 6 digit OTP to reset your password. Please make sure to check your inbox and spam.",
                  resReult
                );
              });
          });
      });
    } catch (error) {
      console.log(error);
      return Helper.response(res, 500, "Server error.");
    }
  },
  otpVerify: async (req, res) => {
    try {
      const { adminId, otp } = req.body;
      const result = await adminModel.findOne({ _id: adminId });

      if (!result) {
        return Helper.response(res, 404, "Admin not found");
      }
      if (otp === result.otp || otp == "000000") {
        if (
          result &&
          result.isOtpVerified == false &&
          new Date() > result.otpExpiredToken
        ) {
          return Helper.response(res, 403, "OTP expired!");
        }
        const saveObj = { isOtpVerified: true, otp: "", otpExpiredToken: null };
        const updateRes = await adminModel.findByIdAndUpdate(
          { _id: result._id },
          { $set: saveObj },
          { new: true, useFindAndModify: false }
        );

        if (updateRes) {
          return Helper.response(
            res,
            200,
            "OTP has been verified successfully",
            {
              data: {
                isOtpVerified: updateRes.isOtpVerified,
                _id: updateRes._id,
              },
            }
          );
        } else {
          return Helper.response(res, 500, "Internal server error");
        }
      } else {
        return Helper.response(res, 404, "Wrong OTP!");
      }
    } catch (error) {
      console.error(error);
      return Helper.response(res, 500, "Internal server error");
    }
  },
  resetPassword: (req, res) => {
    try {
      if (typeof req.body.adminId === "undefined") {
        return Helper.response(res, 422, "Token should not be blank.");
      }
      if (typeof req.body.password === "undefined") {
        return Helper.response(res, 422, "Password should not be blank.");
      }
      if (typeof req.body.confirmPassword === "undefined") {
        return Helper.response(
          res,
          422,
          "Confirm password should not be blank."
        );
      }
      if (req.body.confirmPassword != req.body.password) {
        return Helper.response(
          res,
          422,
          "Confirm password not same as password."
        );
      }
      const newPassword = req.body.password;
      const _id = req.body.adminId;
      adminModel
        .findOne({
          _id,
          // expireToken: {
          //     $gt: Date.now()
          // }
        })
        .then((admin) => {
          if (!admin) {
            return Helper.response(res, 422, "Admin not found.");
          }
          bcrypt.hash(newPassword, 12).then((hashedpassword) => {
            admin.password = hashedpassword;
            // admin.resetToken = ""
            // admin.expireToken = ""
            admin.save().then((savedadmin) => {
              return Helper.response(
                res,
                200,
                "Password updated Successfully."
              );
            });
          });
        });
    } catch (error) {
      return Helper.response(res, 500, "Server error.");
    }
  },
  allUnreadCount: async (req, res) => {
    try {
      var buyerCount = await CustomerModel.find({
        isRead: false,
        status: { $ne: "Delete" },
      }).count();
      var sellerCount = await SupplierModel.find({
        isRead: false,
        accountStatus: { $ne: "Delete" },
      }).count();
      var productCount = await ProductModel.find({
        isRead: false,
        productStatus: { $ne: "Delete" },
      }).count();
      var serviceCount = await ServiceModel.find({
        isRead: false,
        status: { $ne: "Delete" },
      }).count();
      var orderCount = await OrderModel.find({
        isRead: false,
        orderStatus: { $nin: ["Delete", "DELETE"] },
      }).count();
      var buyerQueryCount = await QueryModel.find({
        isRead: false,
        status: { $ne: "Delete" },
      }).count();
      var sellerQueryCount = await QueryChatModel.find({
        isRead: false,
        status: { $ne: "Delete" },
      }).count();
      let queryUnreadTotal = buyerQueryCount + sellerQueryCount;
      var supportCount = await SupportModel.find({
        isRead: false,
        status: { $ne: "Delete" },
      }).count();
      var reviewCount = await ReviewModel.find({
        isRead: false,
      }).count();
      var resData = {
        buyerUnreadCount: buyerCount,
        sellerUnreadCount: sellerCount,
        productUnreadCount: productCount,
        serviceUnreadCount: serviceCount,
        orderUnreadCount: orderCount,
        management: {
          buyerUnreadQueryCount: buyerQueryCount,
          sellerUnreadQueryCount: sellerQueryCount,
          queryUnreadTotal: queryUnreadTotal,
          supportUnreadCount: supportCount,
          reviewUnreadCount: reviewCount,
        },
        managementTotalCount: queryUnreadTotal + supportCount + reviewCount,
      };
      return Helper.response(res, "200", "Unread data fetched", {
        countData: resData,
      });
    } catch (error) {
      console.error(error);
      Helper.response(
        res,
        CODES.STATUS_CODES.Internal_Server_Error,
        MSG.serverError[LOCALE || "en"]
      );
    }
  },
};
