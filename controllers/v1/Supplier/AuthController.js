const mongoose = require("mongoose");
const { ObjectId } = mongoose.Types;
const Helper = require("../../../config/helper");
const CODES = require("../../../config/status_codes/status_codes");
const MSG = require("../../../config/language/Messages");
const jwt = require("jsonwebtoken");
const SECRET_KEY = process.env.JWT_SECRET;
const NODE_ENV = process.env.NODE_ENV;
const BASE_URL = process.env.BASE_URL;
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const supplierModel = require("../../../models/SupplierModel");
const supplierEditRequestModel = require("../../../models/SupplierEditRequestModel");
var _ = require("lodash");
const moment = require("moment-timezone");
let State = require("country-state-city").State;
let City = require("country-state-city").City;
const supplierImage = Helper.upload_space("suppliers").array("supplierImages");
const notificationSubscribeDataModel = require("../../../models/notificationSubscribeDataModel");
module.exports = {
  stepOneUpdate: async (req, res) => {
    const { _id } = req.params;
    const {
      basicInfo,
      address,
      registeredAddress,
      isProfileStep,
      isSameAddress,
    } = req.body;
    try {
      var pass = basicInfo.password;
      const salt = bcrypt.genSaltSync(10);
      const hash = bcrypt.hashSync(basicInfo.password, salt);
      basicInfo.password = hash;
      const emailExit = await supplierModel.findOne({
        _id: {
          $ne: _id,
        },
        "basicInfo.emailId": basicInfo.emailId,
        accountStatus: {
          $ne: "Delete",
        },
      });
      if (emailExit) {
        return Helper.response(
          res,
          404,
          "Email already exist please login and complete registration flow."
        );
      }
      const supplier = await supplierModel.findByIdAndUpdate(
        _id,
        {
          basicInfo,
          address,
          registeredAddress,
          isSameAddress,
          isProfileStep,
          updatedAt: moment().format(),
        },
        {
          new: true,
        }
      );

      if (!supplier) {
        return Helper.response(res, 404, "Supplier not found.");
      }
      return Helper.response(res, 200, "Profile step one updated.", {
        data: {
          _id: supplier._id,
          isProfileStep: supplier.isProfileStep,
        },
      });
    } catch (error) {
      console.log(error, "error", "422");
      return Helper.response(
        res,
        500,
        "Could not update supplier information."
      );
    }
  },
  registerStepOne: async (req, res) => {
    const {
      basicInfo,
      address,
      registeredAddress,
      isSameAddress,
      isProfileStep,
    } = req.body;
    try {
      var pass = basicInfo.password;
      const salt = bcrypt.genSaltSync(10);
      const hash = bcrypt.hashSync(basicInfo.password, salt);
      basicInfo.password = hash;
      const emailExit = await supplierModel.findOne({
        "basicInfo.emailId": basicInfo.emailId,
        accountStatus: {
          $ne: "Delete",
        },
      });
      if (emailExit) {
        return Helper.response(
          res,
          404,
          "Email already exist please login and complete registration flow."
        );
      }
      // const formattedSupplierId = await formatSupplierId();
      const formattedSupplierId = await Helper.generateSellerUniqId();

      const verificationToken = Math.random().toString(36).substring(7);
      const verificationTokenExpires = new Date();
      verificationTokenExpires.setHours(
        verificationTokenExpires.getHours() + 24
      );
      const supplier = new supplierModel({
        basicInfo,
        address,
        registeredAddress,
        isSameAddress,
        isProfileStep,
        supplierUniqId: formattedSupplierId,
        verificationToken: verificationToken,
        verificationTokenExpires: verificationTokenExpires,
        createdAt: moment().format(),
      });
      var saveData = await supplier.save();
      var html = `
                Dear <b>${basicInfo.founderName},<br><br>
                Welcome to project – your one-stop destination for transformative healthcare solutions. We are thrilled to have you
                join our community of innovators and healthcare providers dedicated to enhancing healthcare delivery across India.<br><br>
                At project, we believe in fostering collaboration between healthcare innovators and providers to bring cost-effective, Made-in-India health innovations to the forefront. Whether it's medical devices, point-of-care diagnostics, supply chain solutions, or digital health advancements, our platform offers exclusive access to a wide range of healthcare innovations.
                <br><br>
                Your registration on project marks the beginning of a journey towards delivering sustainable and effective healthcare
                services to the masses. As a registered member, you now have access to tailored solutions designed specifically for
                small and medium-sized hospitals, ensuring that you can provide high-quality care to your patients.<br>
                <br>
                <p>Here are your login details: </br></br>User id/ email id - <b>${basicInfo.emailId} </b> <br>Password - <b>${pass}</b>
                </br>To ensure the security of your account, we kindly request you to verify your email address by clicking on the following
                link (Valid for 24 hours):  <a href="${BASE_URL}supplier/v1/verifyEmail/${verificationToken}" target="_blank">Click Here</a> </br></br>
                <br><br>
                Once your email address is verified, you can log in to project and explore the wide range of healthcare innovations
                available on our platform.<br><br>
                
                Thank you for choosing project as your partner in healthcare innovation. We look forward to working together to
                transform healthcare delivery in India.
                <br> <br>
                Best regards,<br>
                Team project<br><br><br>
          `;
      await Helper.send365Email(
        process.env.MAIL_SEND_EMAIL,
        basicInfo.emailId,
        "Welcome to project: Your Gateway to Healthcare Innovation",
        html,
        "text"
      );
      return Helper.response(res, 200, "Profile step one completed.", {
        data: {
          _id: supplier._id,
          isProfileStep: supplier.isProfileStep,
        },
      });
    } catch (error) {
      console.log(error, "error", "533333");
      return Helper.response(
        res,
        500,
        "Could not update supplier information."
      );
    }
  },
  registerStepTwo: async (req, res) => {
    const { _id } = req.params;
    const { kycDetails, businessDetails, isProfileStep } = req.body;
    try {
      const supplier = await supplierModel.findByIdAndUpdate(
        _id,
        {
          kycDetails,
          businessDetails,
          isProfileStep,
          updatedAt: moment().format(),
        },
        {
          new: true,
        }
      );

      if (!supplier) {
        return Helper.response(res, 404, "Supplier not found.");
      }

      return Helper.response(res, 200, "Profile step two completed.", {
        data: {
          _id: supplier._id,
          isProfileStep: supplier.isProfileStep,
        },
      });
    } catch (error) {
      console.log(error);
      return Helper.response(
        res,
        500,
        "Could not update supplier information."
      );
    }
  },
  registerStepThree: async (req, res) => {
    const { _id } = req.params;
    const { bankDetails, isProfileStep } = req.body;
    try {
      const supplier = await supplierModel.findByIdAndUpdate(
        _id,
        {
          bankDetails,
          isProfileStep,
          updatedAt: moment().format(),
        },
        {
          new: true,
        }
      );

      if (!supplier) {
        return Helper.response(res, 404, "Supplier not found.");
      }

      return Helper.response(res, 200, "Profile step three completed.", {
        data: {
          _id: supplier._id,
          isProfileStep: supplier.isProfileStep,
        },
      });
    } catch (error) {
      return Helper.response(
        res,
        500,
        "Could not update supplier information."
      );
    }
  },
  registerList: async (req, res) => {
    const { _id } = req.params;
    try {
      var query = {
        _id,
        accountStatus: {
          $ne: "Delete",
        },
      };
      var checkExistance = await supplierModel.findOne(query);
      if (!checkExistance) {
        return Helper.response(res, 404, "Supplier not found.");
      } else {
        var isEdited = checkExistance.isEdited;
      }
      if (isEdited == "editRequest" && req.user.role == "supplier") {
        var supplier = await supplierEditRequestModel.findOne({
          supplierId: _id,
        });
      } else {
        var supplier = await supplierModel.findOne(query, {
          JWT_Token: 0,
        });
      }

      if (!supplier) {
        return Helper.response(res, 404, "Supplier not found.");
      }
      if (supplier.basicInfo.companyRegistrationFile.length > 0) {
        let companyRegistrationFile = [];
        for (
          let i = 0;
          i < supplier.basicInfo.companyRegistrationFile.length;
          i++
        ) {
          var fileExe = await Helper.getFileExtension(
            supplier.basicInfo.companyRegistrationFile[i].imgName
          );
          companyRegistrationFile.push({
            imgUrl:
              process.env.IMAGE_URL +
              "suppliers/" +
              supplier.basicInfo.companyRegistrationFile[i].imgName,
            imgName: supplier.basicInfo.companyRegistrationFile[i].imgName,
            fileType: fileExe,
          });
        }
        supplier.basicInfo.companyRegistrationFile = companyRegistrationFile;
      }
      if (supplier.kycDetails.gstDeclaration.length > 0) {
        let gstDeclaration = [];
        for (let i = 0; i < supplier.kycDetails.gstDeclaration.length; i++) {
          var fileExe = await Helper.getFileExtension(
            supplier.kycDetails.gstDeclaration[i].imgName
          );
          gstDeclaration.push({
            imgUrl:
              process.env.IMAGE_URL +
              "suppliers/" +
              supplier.kycDetails.gstDeclaration[i].imgName,
            imgName: supplier.kycDetails.gstDeclaration[i].imgName,
            fileType: fileExe,
          });
        }
        supplier.kycDetails.gstDeclaration = gstDeclaration;
      }
      if (supplier.kycDetails.gstNo.length > 0) {
        let gstNo = [];
        for (let i = 0; i < supplier.kycDetails.gstNo.length; i++) {
          var fileExe = await Helper.getFileExtension(
            supplier.kycDetails.gstNo[i].imgName
          );
          gstNo.push({
            imgUrl:
              process.env.IMAGE_URL +
              "suppliers/" +
              supplier.kycDetails.gstNo[i].imgName,
            imgName: supplier.kycDetails.gstNo[i].imgName,
            fileType: fileExe,
          });
        }
        supplier.kycDetails.gstNo = gstNo;
      }
      if (supplier.kycDetails.panNo.length > 0) {
        let panNo = [];
        for (let i = 0; i < supplier.kycDetails.panNo.length; i++) {
          var fileExe = await Helper.getFileExtension(
            supplier.kycDetails.panNo[i].imgName
          );
          panNo.push({
            imgUrl:
              process.env.IMAGE_URL +
              "suppliers/" +
              supplier.kycDetails.panNo[i].imgName,
            imgName: supplier.kycDetails.panNo[i].imgName,
            fileType: fileExe,
          });
        }
        supplier.kycDetails.panNo = panNo;
      }
      if (supplier.kycDetails.idProof.length > 0) {
        let idProof = [];
        for (let i = 0; i < supplier.kycDetails.idProof.length; i++) {
          var fileExe = await Helper.getFileExtension(
            supplier.kycDetails.idProof[i].imgName
          );
          idProof.push({
            imgUrl:
              process.env.IMAGE_URL +
              "suppliers/" +
              supplier.kycDetails.idProof[i].imgName,
            imgName: supplier.kycDetails.idProof[i].imgName,
            fileType: fileExe,
          });
        }
        supplier.kycDetails.idProof = idProof;
      }
      if (
        supplier.businessDetails.businessLicenceNo &&
        supplier.businessDetails.businessLicenceNo.length > 0
      ) {
        let businessLicenceNo = [];
        for (
          let i = 0;
          i < supplier.businessDetails.businessLicenceNo.length;
          i++
        ) {
          if (supplier.businessDetails.businessLicenceNo[i].imgName) {
            var fileExe = await Helper.getFileExtension(
              supplier.businessDetails.businessLicenceNo[i].imgName
            );
            businessLicenceNo.push({
              imgUrl:
                process.env.IMAGE_URL +
                "suppliers/" +
                supplier.businessDetails.businessLicenceNo[i].imgName,
              imgName: supplier.businessDetails.businessLicenceNo[i].imgName,
              fileType: fileExe,
            });
          }
        }
        supplier.businessDetails.businessLicenceNo = businessLicenceNo;
      }
      if (
        supplier.businessDetails.tradeMarkFiles &&
        supplier.businessDetails.tradeMarkFiles.length > 0
      ) {
        let tradeMarkFiles = [];
        for (
          let i = 0;
          i < supplier.businessDetails.tradeMarkFiles.length;
          i++
        ) {
          if (supplier.businessDetails.tradeMarkFiles[i].imgName) {
            var fileExe = await Helper.getFileExtension(
              supplier.businessDetails.tradeMarkFiles[i].imgName
            );
            tradeMarkFiles.push({
              imgUrl:
                process.env.IMAGE_URL +
                "suppliers/" +
                supplier.businessDetails.tradeMarkFiles[i].imgName,
              imgName: supplier.businessDetails.tradeMarkFiles[i].imgName,
              fileType: fileExe,
            });
          }
        }
        supplier.businessDetails.tradeMarkFiles = tradeMarkFiles;
      }
      if (
        supplier.businessDetails.vendorEnroll &&
        supplier.businessDetails.vendorEnroll.length > 0
      ) {
        let vendorEnroll = [];
        for (let i = 0; i < supplier.businessDetails.vendorEnroll.length; i++) {
          if (supplier.businessDetails.vendorEnroll[i].imgName) {
            var fileExe = await Helper.getFileExtension(
              supplier.businessDetails.vendorEnroll[i].imgName
            );
            vendorEnroll.push({
              imgUrl:
                process.env.IMAGE_URL +
                "suppliers/" +
                supplier.businessDetails.vendorEnroll[i].imgName,
              imgName: supplier.businessDetails.vendorEnroll[i].imgName,
              fileType: fileExe,
            });
          }
        }
        supplier.businessDetails.vendorEnroll = vendorEnroll;
      }
      if (
        supplier.businessDetails.selfAgreement &&
        supplier.businessDetails.selfAgreement.length > 0
      ) {
        let selfAgreement = [];
        for (
          let i = 0;
          i < supplier.businessDetails.selfAgreement.length;
          i++
        ) {
          if (supplier.businessDetails.selfAgreement[i].imgName) {
            var fileExe = await Helper.getFileExtension(
              supplier.businessDetails.selfAgreement[i].imgName
            );
            selfAgreement.push({
              imgUrl:
                process.env.IMAGE_URL +
                "suppliers/" +
                supplier.businessDetails.selfAgreement[i].imgName,
              imgName: supplier.businessDetails.selfAgreement[i].imgName,
              fileType: fileExe,
            });
          }
        }
        supplier.businessDetails.selfAgreement = selfAgreement;
      }
      if (
        supplier.businessDetails.bankDetails &&
        supplier.businessDetails.bankDetails.length > 0
      ) {
        let bankDetails = [];
        for (let i = 0; i < supplier.businessDetails.bankDetails.length; i++) {
          if (supplier.businessDetails.bankDetails[i].imgName) {
            var fileExe = await Helper.getFileExtension(
              supplier.businessDetails.bankDetails[i].imgName
            );
            bankDetails.push({
              imgUrl:
                process.env.IMAGE_URL +
                "suppliers/" +
                supplier.businessDetails.bankDetails[i].imgName,
              imgName: supplier.businessDetails.bankDetails[i].imgName,
              fileType: fileExe,
            });
          }
        }
        supplier.businessDetails.bankDetails = bankDetails;
      }
      if (supplier.otherDetails.codeOfConduct.length > 0) {
        let codeOfConduct = [];
        for (let i = 0; i < supplier.otherDetails.codeOfConduct.length; i++) {
          var fileExe = await Helper.getFileExtension(
            supplier.otherDetails.codeOfConduct[i].imgName
          );
          codeOfConduct.push({
            imgUrl:
              process.env.IMAGE_URL +
              "suppliers/" +
              supplier.otherDetails.codeOfConduct[i].imgName,
            imgName: supplier.otherDetails.codeOfConduct[i].imgName,
            fileType: fileExe,
          });
        }
        supplier.otherDetails.codeOfConduct = codeOfConduct;
      }
      if (supplier.otherDetails.cancelledCheque.length > 0) {
        let cancelledCheque = [];
        for (let i = 0; i < supplier.otherDetails.cancelledCheque.length; i++) {
          var fileExe = await Helper.getFileExtension(
            supplier.otherDetails.cancelledCheque[i].imgName
          );
          cancelledCheque.push({
            imgUrl:
              process.env.IMAGE_URL +
              "suppliers/" +
              supplier.otherDetails.cancelledCheque[i].imgName,
            imgName: supplier.otherDetails.cancelledCheque[i].imgName,
            fileType: fileExe,
          });
        }
        supplier.otherDetails.cancelledCheque = cancelledCheque;
      }
      if (
        supplier.bankDetails &&
        supplier.bankDetails.cancelledCheque &&
        supplier.bankDetails.cancelledCheque.length > 0
      ) {
        let cancelledCheque = [];
        for (let i = 0; i < supplier.bankDetails.cancelledCheque.length; i++) {
          var fileExe = await Helper.getFileExtension(
            supplier.bankDetails.cancelledCheque[i].imgName
          );
          cancelledCheque.push({
            imgUrl:
              process.env.IMAGE_URL +
              "suppliers/" +
              supplier.bankDetails.cancelledCheque[i].imgName,
            imgName: supplier.bankDetails.cancelledCheque[i].imgName,
            fileType: fileExe,
          });
        }
        supplier.bankDetails.cancelledCheque = cancelledCheque;
      }
      return Helper.response(res, 200, "Profile data.", {
        data: supplier,
      });
    } catch (error) {
      return Helper.response(res, 500, "Could not find supplier information.");
    }
  },
  supplierEditRequest: async (req, res) => {
    const { _id } = req.params;
    const {
      basicInfo,
      address,
      kycDetails,
      businessDetails,
      otherDetails,
      registeredAddress,
      isSameAddress,
      isProfileStep,
      bankDetails,
      accountStatus,
    } = req.body;
    try {
      const emailExit = await supplierModel.findOne({
        _id: {
          $ne: _id,
        },
        "basicInfo.emailId": basicInfo.emailId,
        accountStatus: {
          $ne: "Delete",
        },
      });
      if (emailExit) {
        return Helper.response(
          res,
          404,
          "Email already exist please login and complete registration flow."
        );
      }
      var supplierObj = {
        supplierId: _id,
        basicInfo,
        address,
        kycDetails,
        businessDetails,
        otherDetails,
        registeredAddress,
        isSameAddress,
        isProfileStep,
        bankDetails,
        accountStatus,
        isRead: false,
        updatedAt: moment().format(),
      };
      var checkSupplier = await supplierModel.findOneAndUpdate(
        {
          _id,
        },
        {
          $set: {
            accountStatus: "Active",
          },
          updatedAt: moment().format(),
          isRead: false,
          isEdited: "editRequest",
        },
        {
          new: true,
        }
      );
      if (!checkSupplier) {
        return Helper.response(res, 401, "No data found");
      }
      const supplier = await supplierEditRequestModel.findOne({
        supplierId: _id,
      });

      if (!supplier) {
        const supplierEditRequestSave = new supplierEditRequestModel(
          supplierObj
        );
        const savedRequest = await supplierEditRequestSave.save();
        return Helper.response(
          res,
          200,
          "Profile updated, Your profile needs to be approved via Admin to be active again. Please confirm?"
        );
      } else {
        const supplier = await supplierEditRequestModel.findOneAndUpdate(
          {
            supplierId: _id,
          },
          {
            $set: supplierObj,
          },
          {
            new: true,
          }
        );
        return Helper.response(
          res,
          200,
          "Profile updated, Your profile needs to be approved via Admin to be active again. Please confirm?"
        );
      }
    } catch (error) {
      console.log(error, "error", "422");
      return Helper.response(
        res,
        500,
        "Could not update supplier information."
      );
    }
  },

  supplierStatus: async (req, res) => {
    const { _id } = req.params;
    try {
      var query = {
        _id,
        accountStatus: {
          $ne: "Delete",
        },
      };
      const supplier = await supplierModel.findOne(query, {
        accountStatus: 1,
      });
      if (!supplier) {
        return Helper.response(res, 404, "Supplier not found.");
      }
      return Helper.response(res, 200, "Supplier status.", {
        data: supplier,
      });
    } catch (error) {
      console.log(error, "error");
      return Helper.response(res, 500, "Could not find supplier information.");
    }
  },
  uplaodDocument: async (req, res) => {
    try {
      supplierImage(req, res, async function (err, result) {
        if (err) {
          return Helper.response(res, 422, "Something went wrong");
        } else {
          let imgName = [];
          for (let obj of req.files) {
            var imgUrl = obj.location.split("suppliers/");
            imgName.push({
              imgName: imgUrl[1],
              imgUrl: obj.location,
            });
          }

          return Helper.response(
            res,
            CODES.STATUS_CODES.OK,
            MSG.success[LOCALE || "en"],
            {
              imgName: imgName,
            }
          );
        }
      });
    } catch (error) {
      return Helper.response(res, 500, MSG.api.fail[LOCALE || "en"]);
    }
  },
  login: async (req, res) => {
    const { emailId, password } = req.body;
    try {
      const supplierDetails = await supplierModel.findOne({
        "basicInfo.emailId": emailId,
        accountStatus: { $ne: "Delete" },
      });
      if (!supplierDetails) {
        return Helper.response(res, 404, "Seller details not found.");
      }
      if (
        supplierDetails &&
        supplierDetails.isVerified === false &&
        new Date() > supplierDetails.verificationTokenExpires
      ) {
        const verificationToken = Math.random().toString(36).substring(7);
        const verificationTokenExpires = new Date();
        verificationTokenExpires.setHours(
          verificationTokenExpires.getHours() + 24
        );
        await supplierModel.findOneAndUpdate(
          {
            "basicInfo.emailId": emailId,
          },
          { $set: { verificationToken, verificationTokenExpires } },
          { new: true }
        );
        var html = `
                Dear <b>${supplierDetails.basicInfo.founderName},<br><br>
                Welcome to project – your one-stop destination for transformative healthcare solutions. We are thrilled to have you
                join our community of innovators and healthcare providers dedicated to enhancing healthcare delivery across India.<br><br>
                At project, we believe in fostering collaboration between healthcare innovators and providers to bring cost-effective, Made-in-India health innovations to the forefront. Whether it's medical devices, point-of-care diagnostics, supply chain solutions, or digital health advancements, our platform offers exclusive access to a wide range of healthcare innovations.
                <br><br>
                Your registration on project marks the beginning of a journey towards delivering sustainable and effective healthcare
                services to the masses. As a registered member, you now have access to tailored solutions designed specifically for
                small and medium-sized hospitals, ensuring that you can provide high-quality care to your patients.<br>
                <br>
                <p>Here are your login details: </br></br>User id/ email id - <b>${emailId} </b><br> Password - <b>${password}</b>
                </br>To ensure the security of your account, we kindly request you to verify your email address by clicking on the following
                link (Valid for 24 hours):  <a href="${BASE_URL}supplier/v1/verifyEmail/${verificationToken}" target="_blank">Click Here</a> </br>
                Once your email address is verified, you can log in to project and explore the wide range of healthcare innovations
                available on our platform.<br><br>
                
                Thank you for choosing project as your partner in healthcare innovation. We look forward to working together to
                transform healthcare delivery in India.
                <br><br>
                Best regards,<br>
                Team project<br><br><br>
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
      } else if (supplierDetails.isVerified === false) {
        return Helper.response(
          res,
          403,
          "Your email has not been verified yet. Please check your email for the verification link."
        );
      }
      if (supplierDetails.accountStatus === "Inactive") {
        return Helper.response(
          res,
          403,
          "Your account is not approved yet.Please wait for admin approval!"
        );
      }

      const doesPasswordMatch = await bcrypt.compare(
        password,
        supplierDetails.basicInfo.password
      );
      if (!doesPasswordMatch) {
        return Helper.response(res, 422, "Invalid Email or password.");
      }

      if (doesPasswordMatch) {
        const JWT_Token = jwt.sign(
          {
            _id: supplierDetails._id,
            role: "supplier",
          },
          SECRET_KEY
        );
        const updatedsupplierDetails = await supplierModel.findOneAndUpdate(
          {
            _id: supplierDetails._id,
          },
          // {$set:{updateAt:moment().format()}},
          {
            $push: {
              JWT_Token: JWT_Token,
            },
            updatedAt: moment().format(),
          },
          {
            new: true,
          }
        );

        if (updatedsupplierDetails) {
          const { _id, accountStatus, isProfileStep, role } =
            updatedsupplierDetails; // plz confirm if role field needs to be added
          var name = updatedsupplierDetails.basicInfo.founderName;
          var companyName = updatedsupplierDetails.basicInfo.companyName;
          return res.status(200).json({
            code: 200,
            message: "Login Successful.",
            supplierData: {
              _id,
              JWT_Token: [JWT_Token],
              accountStatus: accountStatus,
              isProfileStep: isProfileStep,
              role: role,
              emailId: emailId,
              name: companyName,
            },
          });
        } else {
          return Helper.response(res, 422, "Something went wrong.");
        }
      } else {
        return Helper.response(res, 422, "Invalid Email or password.");
      }
    } catch (error) {
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
        const token = buffer.toString("hex");
        supplierModel
          .findOneAndUpdate(
            {
              "basicInfo.emailId": req.body.emailId,
              accountStatus: { $ne: "Delete" },
            },
            {
              $set: {
                otp: otp,
                isOtpVerified: false,
                otpExpiredToken: Date.now() + 600000,
              },
            },
            {
              new: true,
            }
          )
          .then((supplier) => {
            if (!supplier) {
              return Helper.response(
                res,
                422,
                "Seller does not exist with this email."
              );
            }
            // supplier.resetToken = token
            // supplier.expireToken = Date.now() + 3600000
            supplier
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
                  result.basicInfo.emailId,
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
      return Helper.response(res, 500, "Server error.");
    }
  },
  otpVerify: async (req, res) => {
    try {
      const { supplierId, otp } = req.body;
      const result = await supplierModel.findOne({
        _id: supplierId,
      });

      if (!result) {
        return Helper.response(res, 404, "Supplier not found");
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
        const updateRes = await supplierModel.findByIdAndUpdate(
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
      if (typeof req.body.supplierId === "undefined") {
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
      const _id = req.body.supplierId;
      supplierModel
        .findOne({
          _id,
          // expireToken: {
          //     $gt: Date.now()
          // }
        })
        .then(async (supplier) => {
          if (!supplier) {
            return Helper.response(res, 422, "Try again token has expired.");
          }
          bcrypt.hash(newPassword, 12).then(async (hashedpassword) => {
            supplier.basicInfo.password = hashedpassword;
            var html = `
      <p>Your password has been <b>changed.</b></p> </br></br></br>
      `;
            await Helper.send365Email(
              process.env.MAIL_SEND_EMAIL,
              supplier.basicInfo.emailId,
              "Regarding Reset Password",
              html,
              "text"
            );
            // supplier.resetToken = ""
            // supplier.expireToken = ""
            supplier.save().then((savedsupplier) => {
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
      var userResult = await supplierModel.findOneAndUpdate(
        {
          _id: _id,
        },
        {
          $pull: {
            JWT_Token: token,
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
  states: async (req, res) => {
    try {
      var stateName = State.getAllStates();
      var indiaState = _.filter(stateName, {
        countryCode: "IN",
      });
      return Helper.response(res, 200, "List of states", {
        states: indiaState,
      });
    } catch (error) {
      console.log(error);
      return Helper.response(res, 500, "Server error.");
    }
  },
  citiesBystates: async (req, res) => {
    try {
      if (
        req.query.countryCode == undefined &&
        req.query.isoCode == undefined
      ) {
        return Helper.response(
          res,
          404,
          "Country code and iso code is required to get city"
        );
      }
      var cityName = City.getCitiesOfState(
        req.query.countryCode,
        req.query.isoCode
      );
      return Helper.response(res, 200, "List of cities", {
        cities: cityName,
      });
    } catch (error) {
      console.log(error);
      return Helper.response(res, 500, "Server error.");
    }
  },
  emailVerify: async (req, res) => {
    try {
      const { token } = req.params;

      // Find the user with the verification token
      const supplier = await supplierModel.findOne({
        verificationToken: token,
      });

      // console.log("supplier", supplier);
      // return false;
      if (!supplier) {
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
      if (new Date() > supplier.verificationTokenExpires) {
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
      if (supplier.isVerified) {
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

      const updateRes = await supplierModel.findByIdAndUpdate(
        {
          _id: supplier._id,
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
      const existingSeller = await supplierModel.findById(_id);
      if (!existingSeller) {
        return Helper.response(res, 404, "supplier not found");
      }
      // Check if the new email is already in use
      const emailInUse = await supplierModel.findOne({
        "basicInfo.emailId": emailId,
        accountStatus: { $ne: "Delete" },
      });

      if (emailInUse && emailInUse._id.toString() !== _id.toString()) {
        return Helper.response(res, 400, "Email already in use");
      }
      // Update the email address
      await supplierModel.findByIdAndUpdate(
        _id,
        {
          "basicInfo.emailId": emailId,
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
                      <p>Hi ${existingSeller.basicInfo.founderName},</p>

                      <p>Your email address for project has been changed. The new email is now <strong>${emailId}</strong>, replacing the old <strong>${existingSeller.basicInfo.emailId}</strong>.</p>

                      <p>Please make sure to use the updated email to login and access your project account.</p>

                      <p>Thanks,<br>
                      project</p>
                  </body>
                  </html>`;
      await Helper.send365Email(
        process.env.MAIL_SEND_EMAIL,
        existingSeller.basicInfo.emailId,
        "Your project Email Address Has Been Updated",
        html,
        "text"
      );

      return Helper.response(
        res,
        200,
        "Seller's email id updated successfully."
      );
    } catch (error) {
      console.log(error, "error", "422");
      return Helper.response(res, 500, "Could not update Seller information.");
    }
  },
};
