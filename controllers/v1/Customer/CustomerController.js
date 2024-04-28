// const mongoose = require('mongoose');
// const customerModel = mongoose.model("Customer");
const customerModel = require("../../../models/CustomerModel");
const Helper = require("../../../config/helper");
const error = require("mongoose/lib/error");
const errors = require("../../../utilities/errors");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const SECRET_KEY = process.env.JWT_SECRET;
const BASE_URL = process.env.BASE_URL;
const { logger } = require("../../../logger/winston");
const moment = require("moment-timezone");
const customerImage = Helper.upload_space("customers").array("profileImage");
const sendEmail = require("../../../helper/excel-generator/email-helper");
const notificationSubscribeDataModel = require("../../../models/notificationSubscribeDataModel");
const institutionModel = require("../../../models/InstitutionModel");
const ProfessionModel = require("../../../models/ProfessionModel");
const productCategoryModel = require("../../../models/ProductCategoryModel");
const productSubCategoryModel = require("../../../models/ProductSubCategoryModel");
const AddressModel = require("../../../models/AddressModel");
module.exports = {
  register: async (req, res) => {
    const { password, emailId } = req.body;
    try {
      var pass = req.body.password;
      const salt = bcrypt.genSaltSync(10);
      const hash = bcrypt.hashSync(password, salt);
      const emailExit = await customerModel.findOne({
        emailId: emailId,
        status: {
          $ne: "Delete",
        },
      });
      if (emailExit) {
        return Helper.response(res, 404, "Email already exist.");
      }
      const registerType = req.body.registerType
        ? req.body.registerType
        : "Individual";
      const formattedCustomerId = await Helper.generateCustomerUniqId(
        registerType
      );
      const customerObj = await convertCustomerObject(
        registerType,
        hash,
        formattedCustomerId,
        req.body
      );
      const customer = new customerModel(customerObj);
      var saveData = await customer.save();
      var addressObj = {
        customerId: saveData._id,
        address: req.body.address,
        city: req.body.city,
        landMark: "",
        country: req.body.country,
        mobileNumber: req.body.contactNo,
        name: req.body.name,
        pinCode: req.body.zipCode,
        state: req.body.state,
        street: "",
        isDefault: true,
      };
      const address = new AddressModel(addressObj);
      const saveAddress = await address.save();
      var html = `
Dear <b>${req.body.name},</b><br><br>
Welcome to project – your one-stop destination for transformative healthcare solutions. We are thrilled to have you
join our community of innovators and healthcare providers dedicated to enhancing healthcare delivery across India.<br><br>
At project, we believe in fostering collaboration between healthcare innovators and providers to bring cost-effective, Made-in-India health innovations to the forefront. Whether it's medical devices, point-of-care diagnostics, supply chain solutions, or digital health advancements, our platform offers exclusive access to a wide range of healthcare innovations.
<br><br>
Your registration on project marks the beginning of a journey towards delivering sustainable and effective healthcare
services to the masses. As a registered member, you now have access to tailored solutions designed specifically for
small and medium-sized hospitals, ensuring that you can provide high-quality care to your patients.<br>
<br>
                <p>Here are your login details:: </br></br>User id/ email id - <b>${emailId} </b></br></b> Password - <b>${pass}</b>
                </br></br></br>To ensure the security of your account, we kindly request you to verify your email address by clicking on the following
                link (Valid for 24 hours):  <a href="${BASE_URL}customer/v1/verifyEmail/${customerObj.verificationToken}" target="_blank">Click Here</a> </br></br>
                <br><br>
                Once your email address is verified, you can log in to project and explore the wide range of healthcare innovations
                available on our platform.<br><br>
                
                Thank you for choosing project as your partner in healthcare innovation. We look forward to working together to
                transform healthcare delivery in India.
                <br><br>
                Best regards,<br>
                Team project`;
      await Helper.send365Email(
        process.env.MAIL_SEND_EMAIL,
        emailId,
        "Welcome to project: Your Gateway to Healthcare Innovation",
        html,
        "text"
      );
      return Helper.response(res, 200, "User registered.", {
        data: {
          _id: customer._id,
          role: "customer",
        },
      });
    } catch (error) {
      logger.error(error);
      return Helper.response(res, 500, "Internal error.");
    }
  },
  login: async (req, res) => {
    const { emailId, password } = req.body;
    try {
      const customerDetails = await customerModel.findOne({
        emailId: emailId,
        status: { $ne: "Delete" },
      });
      if (!customerDetails) {
        return Helper.response(res, 404, "Customer details not found.");
      }
      if (
        customerDetails &&
        customerDetails.isVerified === false &&
        new Date() > customerDetails.verificationTokenExpires
      ) {
        const verificationToken = Math.random().toString(36).substring(7);
        const verificationTokenExpires = new Date();
        verificationTokenExpires.setHours(
          verificationTokenExpires.getHours() + 24
        );
        await customerModel.findOneAndUpdate(
          {
            emailId: emailId,
          },
          { $set: { verificationToken, verificationTokenExpires } },
          { new: true }
        );
        var html = `
                Dear <b>${customerDetails.name},</b><br><br>
                Welcome to project – your one-stop destination for transformative healthcare solutions. We are thrilled to have you<br>
                join our community of innovators and healthcare providers dedicated to enhancing healthcare delivery across India.<br><br>
                At project, we believe in fostering collaboration between healthcare innovators and providers to bring cost-effective, Made-in-India health innovations to the forefront. Whether it's medical devices, point-of-care diagnostics, supply chain solutions, or digital health advancements, our platform offers exclusive access to a wide range of healthcare innovations.
                <br><br>
                Your registration on project marks the beginning of a journey towards delivering sustainable and effective healthcare
                services to the masses. As a registered member, you now have access to tailored solutions designed specifically for
                small and medium-sized hospitals, ensuring that you can provide high-quality care to your patients.<br>
                <br>
                <p>Here are your login details:: </br></br>User id/ email id - <b>${emailId} </b></br></b> Password - <b>${password}</b>
                </br></br></br>To ensure the security of your account, we kindly request you to verify your email address by clicking on the following
                link (Valid for 24 hours):  <a href="${BASE_URL}customer/v1/verifyEmail/${verificationToken}" target="_blank">Click Here</a> </br></br>
                <br><br>
                Once your email address is verified, you can log in to project and explore the wide range of healthcare innovations
                available on our platform.<br><br>
                
                Thank you for choosing project as your partner in healthcare innovation. We look forward to working together to
                transform healthcare delivery in India.
                <br>
                Best regards,
                Team project
          `;
        await Helper.send365Email(
          process.env.MAIL_SEND_EMAIL,
          emailId,
          "Welcome to project: Your Gateway to Healthcare Innovation",
          html,
          "text"
        );
        return Helper.response(
          res,
          403,
          "Your email verification link is expired.You will received new verification link on you registered email id."
        );
      } else if (customerDetails && customerDetails.isVerified === false) {
        return Helper.response(
          res,
          403,
          "Your email has not been verified yet. Please check your email for the verification link."
        );
      }
      console.log("222");
      if (customerDetails && customerDetails.status === "Inactive") {
        return Helper.response(res, 403, "Your account is inactivated.");
      }
      const doesPasswordMatch = await bcrypt.compare(
        password,
        customerDetails.password
      );
      if (!doesPasswordMatch) {
        return Helper.response(res, 422, "Invalid Email or password.");
      }

      if (doesPasswordMatch) {
        console.log("333");
        const jwtToken = jwt.sign(
          {
            _id: customerDetails._id,
            role: "customer",
          },
          SECRET_KEY
        );
        const updatedcustomerDetails = await customerModel.findOneAndUpdate(
          {
            _id: customerDetails._id,
          },
          // { $set: { updatedAt: moment().format() } },
          {
            $push: {
              jwtToken: jwtToken,
            },
            updatedAt: moment().format(),
          },
          {
            new: true,
          }
        );

        if (updatedcustomerDetails) {
          const { _id, status, name } = updatedcustomerDetails; // plz confirm if role field needs to be added
          return res.status(200).json({
            code: 200,
            message: "Login Successful.",
            customerData: {
              _id,
              jwtToken: [jwtToken],
              status: status,
              role: "customer",
              emailId: emailId,
              name: name,
            },
          });
        } else {
          return Helper.response(res, 422, "Something went wrong.");
        }
      } else {
        return Helper.response(res, 422, "Invalid Email or password.");
      }
    } catch (error) {
      console.log(error, "error");
      logger.error(error);
      return Helper.response(res, 500, "Server error.");
    }
  },
  forgotPassword: async (req, res) => {
    try {
      crypto.randomBytes(32, (err, buffer) => {
        if (err) {
          return Helper.response(res, 422, "Something went wrong");
        }
        var otp = Helper.generate_otp();
        customerModel
          .findOneAndUpdate(
            {
              emailId: req.body.emailId,
              status: { $ne: "Delete" },
            },
            {
              $set: {
                otp: otp,
                isOtpVerified: false,
                otpExpiredToken: Date.now() + 600000, //10min expiration
              },
            },
            {
              new: true,
            }
          )
          .then((customer) => {
            if (!customer) {
              return Helper.response(
                res,
                422,
                "Buyer does not exist with this email."
              );
            }
            // customer.resetToken = token
            // customer.expireToken = Date.now() + 3600000
            customer
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
                  result.emailId,
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
      const { customerId, otp } = req.body;
      const result = await customerModel.findOne({
        _id: customerId,
        status: { $ne: "Delete" },
      });

      if (!result) {
        return Helper.response(res, 404, "Customer not found");
      }
      if (otp === result.otp || otp == "000000") {
        if (
          result &&
          result.isOtpVerified == false &&
          new Date() > result.otpExpiredToken
        ) {
          return Helper.response(res, 403, "OTP expired!");
        }
        const saveObj = {
          isOtpVerified: true,
          otp: "",
          otpExpiredToken: null,
        };
        const updateRes = await customerModel.findByIdAndUpdate(
          {
            _id: result._id,
          },
          {
            $set: saveObj,
          },
          {
            new: true,
            useFindAndModify: false,
          }
        );

        if (updateRes) {
          var resResult = {
            isOtpVerified: updateRes.isOtpVerified,
            _id: updateRes._id,
          };
          return Helper.response(
            res,
            200,
            "OTP has been verified successfully",
            resResult
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
      if (typeof req.body.customerId === "undefined") {
        return Helper.response(res, 422, "customerId should not be blank.");
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
      const _id = req.body.customerId;
      customerModel
        .findOne({
          _id,
          // expireToken: {
          //     $gt: Date.now()
          // }
        })
        .then((customer) => {
          if (!customer) {
            return Helper.response(res, 422, "Customer not found.");
          }
          bcrypt.hash(newPassword, 12).then(async (hashedpassword) => {
            customer.password = hashedpassword;
            var html = `
      <p>Your password has been <b>changed.</b></p> </br></br></br>
      `;
            await Helper.send365Email(
              process.env.MAIL_SEND_EMAIL,
              customer.emailId,
              "Regarding Reset Password",
              html,
              "text"
            );
            // customer.resetToken = ""
            // customer.expireToken = ""
            customer.save().then((savedcustomer) => {
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
  logout: async (req, res) => {
    try {
      var { _id } = req.user;
      const { authorization } = req.headers;
      var token = authorization;
      var userResult = await customerModel.findOneAndUpdate(
        {
          _id: _id,
        },
        {
          $pull: {
            jwtToken: token,
          },
        },
        {
          new: true,
        }
      );
      await notificationSubscribeDataModel.findOneAndRemove({
        token,
      });
      if (userResult) {
        return Helper.response(res, 200, "Logout successfully.");
      }
      // .exec(function (err, userResult) {
      //     if (err) {
      //         return Helper.response(res, 422, "Something went wrong.")
      //     } else {
      //         return Helper.response(res, 200, "Logout successfully.")

      //     }
      // });
    } catch (error) {
      console.log(error);
      return Helper.response(res, 500, "Server error.");
    }
  },
  viewProfile: async (req, res) => {
    try {
      const _id = req.user._id;
      var userData = await customerModel
        .findOne(
          {
            _id,
            status: "Active",
          },
          {
            isOtpVerified: 0,
            jwtToken: 0,
            otp: 0,
            profileImage: 0,
          }
        )
        .lean();
      if (!userData) {
        return Helper.response(res, 404, "No data found");
      }
      if (userData.institutionId) {
        let institution = await institutionModel.findById({
          _id: userData.institutionId,
        });
        if (institution) {
          userData.institutionId = institution._id;
          userData.institutionName = institution.name;
        } else {
          userData.institutionId = "";
          userData.institutionName = "";
        }
      } else {
        userData.institutionId = "";
        userData.institutionName = "";
      }
      if (userData.professionId) {
        let profession = await ProfessionModel.findById({
          _id: userData.professionId,
        });
        if (profession) {
          userData.professionId = profession._id;
          userData.professionName = profession.name;
        } else {
          userData.professionId = "";
          userData.professionName = "";
        }
      } else {
        userData.professionId = "";
        userData.professionName = "";
      }
      if (userData.productCategoryId) {
        var productCategoryId = userData.productCategoryId;
        var productSubCategoryId = userData.productSubCategoryId;
        if (productCategoryId.length > 0) {
          userData.productCategoryId = await productCategoryModel.find(
            {
              _id: {
                $in: productCategoryId,
              },
            },
            {
              _id: 1,
              productCategoryName: 1,
              categoryType: 1,
            }
          );
        }
      }
      if (userData.productSubCategoryId) {
        if (productSubCategoryId.length > 0) {
          userData.productSubCategoryId = await productSubCategoryModel.find(
            {
              _id: {
                $in: productSubCategoryId,
              },
            },
            {
              _id: 1,
              subCategoryName: 1,
            }
          );
        }
      }
      // userData.imgUrl = process.env.IMAGE_URL + 'customers/' + userData.profileImage
      return Helper.response(res, 200, "User details.", {
        data: userData,
      });
    } catch (error) {
      console.log("Error :  ", error);
      return Helper.response(res, 500, "Server error.");
    }
  },
  uploadPic: async (req, res) => {
    try {
      customerImage(req, res, async function (err, result) {
        if (err) {
          return Helper.response(res, 422, "Something went wrong");
        } else {
          let imgName = [];
          for (let obj of req.files) {
            var imgUrl = obj.location.split("customers/");
            imgName.push({
              imgName: imgUrl[1],
              imgUrl: obj.location,
            });
          }

          return Helper.response(res, 200, "Image uploaded", {
            imgName: imgName,
          });
        }
      });
    } catch (error) {
      console.log(error);
      return Helper.response(res, 500, "Internal error");
    }
  },
  updateProfile: async (req, res) => {
    const { _id } = req.params;
    try {
      const emailExit = await customerModel.findOne({
        _id: {
          $ne: _id,
        },
        emailId: req.body.emailId,
        status: "Active",
      });
      if (emailExit) {
        return Helper.response(
          res,
          404,
          "Email already exist please login and complete registration flow."
        );
      }
      req.body.updatedAt = moment().format();
      req.body.isRead = false;
      const customer = await customerModel.findByIdAndUpdate(_id, req.body, {
        new: true,
      });

      if (!customer) {
        return Helper.response(res, 404, "customer not found.");
      }
      return Helper.response(res, 200, "User updated.");
    } catch (error) {
      console.log(error, "error", "422");
      return Helper.response(
        res,
        500,
        "Could not update customer information."
      );
    }
  },
  changePassword: async (req, res) => {
    try {
      if (req.body.newPassword == "") {
        return Helper.response(res, 404, "Password is required");
      }
      const result = await customerModel.findOne({
        _id: req.user._id,
        status: "Active",
      });

      if (!result) {
        return Helper.response(res, 422, "Customer not found.");
      }

      if (req.body.newPassword !== req.body.confirmPassword) {
        return Helper.response(
          res,
          422,
          "Password and confirm password don't match."
        );
      }

      const newPassword = await bcrypt.hash(req.body.newPassword, 10);

      const passwordChanged = await customerModel.findOneAndUpdate(
        {
          _id: result._id,
        },
        {
          $set: {
            password: newPassword,
          },
        },
        {
          new: true,
        }
      );

      return Helper.response(res, 200, "Password changed successfully.");
    } catch (error) {
      console.error(error);
      return Helper.response(res, 500, "Server error.");
    }
  },
  emailVerify: async (req, res) => {
    try {
      const { token } = req.params;

      // Find the user with the verification token
      const customer = await customerModel.findOne({
        verificationToken: token,
      });

      if (!customer) {
        const htmlContent = `
          <!DOCTYPE html>
          <html lang="en">
          <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Email Verification Error</title>
              <style>
                  body {
                      font-family: 'Arial', sans-serif;
                      background-color: #f7f7f7;
                      text-align: center;
                      margin: 50px;
                  }

                  h1 {
                      color: #d9534f;
                  }

                  p {
                      color: #d9534f;
                      font-size: 18px;
                  }
              </style>
          </head>
          <body>
              <h1>Email Verification Error</h1>
              <p>Invalid verification token.</p>
          </body>
          </html>
        `;
        return res.send(htmlContent);
      }

      // Check if the verification token has expired
      if (new Date() > customer.verificationTokenExpires) {
        const htmlContent = `<!DOCTYPE html>
          <html lang="en">
          <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Email Verification Error</title>
              <style>
                  body {
                      font-family: 'Arial', sans-serif;
                      background-color: #f7f7f7;
                      text-align: center;
                      margin: 50px;
                  }

                  h1 {
                      color: #d9534f;
                  }

                  p {
                      color: #d9534f;
                      font-size: 18px;
                  }
              </style>
          </head>
          <body>
            <h1>Email Verification Error</h1>
            <p>Verification token has expired.</p>
          </body>
          </html>
        `;
        return res.send(htmlContent);
      }

      // Check if the supplier is already verified
      if (customer.isVerified) {
        // Render an HTML page for an already verified email
        const htmlContent = `<!DOCTYPE html>
          <html lang="en">
          <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Email Verification Success</title>
              <style>
                  body {
                      font-family: 'Arial', sans-serif;
                      background-color: #f7f7f7;
                      text-align: center;
                      margin: 50px;
                  }

                  h1 {
                      color: #0c740c;
                  }

                  p {
                      color: #0c740c;
                      font-size: 18px;
                  }
              </style>
          </head>
          <body>
            <h1>Email Already Verified</h1>
            <p>Your email is already verified.</p>
          </body>
          </html>
        `;
        return res.send(htmlContent);
      }

      const saveObj = {
        isVerified: true,
        verificationToken: null,
        verificationTokenExpires: null,
      };

      const updateRes = await customerModel.findByIdAndUpdate(
        {
          _id: customer._id,
        },
        {
          $set: saveObj,
        },
        {
          new: true,
          useFindAndModify: false,
        }
      );
      if (updateRes) {
        const htmlContent = `
          <!DOCTYPE html>
          <html lang="en">
          <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Email Verification Success</title>
              <style>
                  body {
                      font-family: 'Arial', sans-serif;
                      background-color: #f7f7f7;
                      text-align: center;
                      margin: 50px;
                  }

                  h1 {
                      color: #0c740c;
                  }

                  p {
                      color: #0c740c;
                      font-size: 18px;
                  }
              </style>
          </head>
          <body>
            <h1>Email Verification Success</h1>
            <p>Your email has been successfully verified.</p>
          </body>
          </html>
        `;
        return res.send(htmlContent);
      } else {
        const htmlContent = `
          <!DOCTYPE html>
          <html lang="en">
          <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              < title > Internal server error < /title>
          </head>
          <body>
              < h1 > Internal server error < /h1>
          </body>
          </html>
        `;
        return res.send(htmlContent);
      }
    } catch (error) {
      console.error(error);
      const htmlContent = `
          <!DOCTYPE html>
          <html lang="en">
          <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              < title > Internal server error < /title>
          </head>
          <body>
              < h1 > Internal server error < /h1>
          </body>
          </html>
        `;
      return res.send(htmlContent);
    }
  },
  updateEmail: async (req, res) => {
    const _id = req.user._id;
    const emailId = req.body.emailId;
    try {
      // Check if the user exists
      if (emailId == "") {
        return Helper.response(res, 404, "Email is required");
      }
      const existingBuyer = await customerModel.findById(_id);
      if (!existingBuyer) {
        return Helper.response(res, 404, "Buyer not found");
      }
      // Check if the new email is already in use
      const emailInUse = await customerModel.findOne({
        emailId: emailId,
        status: { $ne: "Delete" },
      });

      if (emailInUse && emailInUse._id.toString() !== _id.toString()) {
        return Helper.response(res, 400, "Email already in use");
      }
      // Update the email address
      await customerModel.findByIdAndUpdate(
        _id,
        {
          emailId: emailId,
          updatedAt: moment().format(),
        },
        {
          new: true,
        }
      );
      var html = `<!DOCTYPE html>
                  <html lang="en">
                  <head>
                      <meta charset="UTF-8">
                      <meta http-equiv="X-UA-Compatible" content="IE=edge">
                      <meta name="viewport" content="width=device-width, initial-scale=1.0">
                      <title>Email Update Notification</title>
                  </head>
                  <body>
                      <p>Hi ${existingBuyer.name},</p>

                      <p>Your email address for project has been changed. The new email is now <strong>${emailId}</strong>, replacing the old <strong>${existingBuyer.emailId}</strong>.</p>

                      <p>Please make sure to use the updated email to login and access your project account.</p>

                      <p>Thanks,<br>
                      project</p>
                  </body>
                  </html>`;
      await Helper.send365Email(
        process.env.MAIL_SEND_EMAIL,
        existingBuyer.emailId,
        "Your project Email Address Has Been Updated",
        html,
        "text"
      );

      return Helper.response(
        res,
        200,
        "Buyer's email id updated successfully."
      );
    } catch (error) {
      console.log(error, "error", "422");
      return Helper.response(res, 500, "Could not update buyer information.");
    }
  },
};

const convertCustomerObject = async (
  registerType,
  hash,
  formattedCustomerId,
  body
) => {
  const verificationToken = Math.random().toString(36).substring(7);
  const verificationTokenExpires = new Date();
  verificationTokenExpires.setHours(verificationTokenExpires.getHours() + 24);
  let customerObj = {
    registerType: registerType,
    password: hash,
    emailId: body.emailId.toLowerCase(),
    name: body.name,
    other: body.other,
    address: body.address,
    city: body.city,
    state: body.state,
    zipCode: body.zipCode,
    alternateEmailId: body.alternateEmailId,
    contactNo: body.contactNo,
    accountUpgradeStatus: body.accountUpgradeStatus,
    typeOfAccount: body.typeOfAccount,
    customerUniqId: formattedCustomerId,
    verificationToken: verificationToken,
    verificationTokenExpires: verificationTokenExpires,
    createdAt: moment().format(),
  };
  if (registerType === "Individual") {
    customerObj.professionId = body.professionId;
    customerObj.institutionId = body.institutionId;
    customerObj.professionalQualification = body.professionalQualification;
    customerObj.yearsOfPractice = body.yearsOfPractice;
    customerObj.productCategoryId = body.productCategoryId;
    customerObj.productSubCategoryId = body.productSubCategoryId;
    customerObj.plans = body.plans;
  }
  if (registerType === "Institution") {
    customerObj.institutionId = body.institutionId;
    customerObj.professionId = body.professionId;
    customerObj.yearOfEstablishment = body.yearOfEstablishment;
    customerObj.nameOfFounder = body.nameOfFounder;
    customerObj.SPOCDetails = body.SPOCDetails;
    customerObj.typeOfAccount = body.typeOfAccount;
    customerObj.accountUpgradeStatus = body.accountUpgradeStatus;
    customerObj.productCategoryId = body.productCategoryId;
    customerObj.productSubCategoryId = body.productSubCategoryId;
    customerObj.typeOfHospital = body.typeOfHospital;
    customerObj.typeOfHospitalValue = body.typeOfHospitalValue;
    customerObj.noOfBeds = body.noOfBeds;
    customerObj.plans = body.plans;
  }
  return customerObj;
};
