const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const CODES = require("../../../config/status_codes/status_codes");
const MSG = require("../../../config/language/Messages");
const supplierModel = require("../../../models/SupplierModel");
const ProductModel = require("../../../models/ProductModel");
const ServiceModel = require("../../../models/ServiceModel");
const OrderDetailsModel = require("../../../models/OrderDetailsModel");
const supplierEditRequestModel = require("../../../models/SupplierEditRequestModel");
const queryChatModel = require("../../../models/queryChatModel");
const querySellerResponseModel = require("../../../models/QuerySellerResponseModel");
const queryResponseModel = require("../../../models/QueryResponseModel");
const wishListModel = require("../../../models/WishListModel");
const queryModel = require("../../../models/QueryModel");
const Helper = require("../../../config/helper");
module.exports = {
  getSupplierListing: async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit) : 10;
      const page = req.query.page ? parseInt(req.query.page) : 1;
      let query = {
        accountStatus: {
          $ne: "Delete",
        },
      };

      if (req.query.status) {
        query.accountStatus = {
          $eq: req.query.status,
        };
      }
      if (req.query.isRead == "true" || req.query.isRead == true) {
        query.isRead = true;
      } else if (req.query.isRead == "false" || req.query.isRead == false) {
        query.isRead = false;
      }
      if (req.query.search) {
        const searchObject = {
          $or: [
            {
              "basicInfo.founderName": {
                $regex: req.query.search,
                $options: "i",
              },
            },
            {
              "basicInfo.address": {
                $regex: req.query.search,
                $options: "i",
              },
            },
            {
              "basicInfo.contactNo": {
                $regex: req.query.search,
                $options: "i",
              },
            },
            {
              "basicInfo.emailId": {
                $regex: req.query.search,
                $options: "i",
              },
            },
            {
              "basicInfo.website": {
                $regex: req.query.search,
                $options: "i",
              },
            },
            {
              "basicInfo.companyName": {
                $regex: req.query.search,
                $options: "i",
              },
            },
            {
              supplierUniqId: {
                $regex: req.query.search,
                $options: "i",
              },
            },
          ],
        };
        Object.assign(query, searchObject);
      }
      var startsDate = req.query.startDate ? req.query.startDate : null;
      let endsDate = req.query.endDate ? req.query.endDate : null;
      endsDate = Helper.modifyDate(endsDate, 1);

      if (startsDate && endsDate) {
        var dateFilter = {
          createdAt: {
            $gte: new Date(startsDate),
            $lte: new Date(endsDate),
          },
        };
        Object.assign(query, dateFilter);
      }

      const result = await supplierModel.paginate(query, {
        page: page,
        sort: {
          updatedAt: -1,
        },
        limit: limit,
        select: {
          JWT_Token: 0,
          "basicInfo.password": 0,
        },
      });
      const serviceList = result.docs;
      const totalResult = result.totalDocs;

      if (serviceList.length > 0) {
        await Promise.all(
          serviceList.map(async function (item) {
            if (item.basicInfo.companyRegistrationFile.length > 0) {
              let companyRegistrationFile = [];
              for (
                let i = 0;
                i < item.basicInfo.companyRegistrationFile.length;
                i++
              ) {
                var fileExe = await Helper.getFileExtension(
                  item.basicInfo.companyRegistrationFile[i].imgName
                );
                companyRegistrationFile.push({
                  imgUrl:
                    process.env.IMAGE_URL +
                    "suppliers/" +
                    item.basicInfo.companyRegistrationFile[i].imgName,
                  imgName: item.basicInfo.companyRegistrationFile[i].imgName,
                  fileType: fileExe,
                });
              }
              item.basicInfo.companyRegistrationFile = companyRegistrationFile;
            }
            if (item.kycDetails.gstDeclaration.length > 0) {
              let gstDeclaration = [];
              for (let i = 0; i < item.kycDetails.gstDeclaration.length; i++) {
                var fileExe = await Helper.getFileExtension(
                  item.kycDetails.gstDeclaration[i].imgName
                );
                gstDeclaration.push({
                  imgUrl:
                    process.env.IMAGE_URL +
                    "suppliers/" +
                    item.kycDetails.gstDeclaration[i].imgName,
                  imgName: item.kycDetails.gstDeclaration[i].imgName,
                  fileType: fileExe,
                });
              }
              item.kycDetails.gstDeclaration = gstDeclaration;
            }
            if (item.kycDetails.gstNo.length > 0) {
              let gstNo = [];
              for (let i = 0; i < item.kycDetails.gstNo.length; i++) {
                var fileExe = await Helper.getFileExtension(
                  item.kycDetails.gstNo[i].imgName
                );
                gstNo.push({
                  imgUrl:
                    process.env.IMAGE_URL +
                    "suppliers/" +
                    item.kycDetails.gstNo[i].imgName,
                  imgName: item.kycDetails.gstNo[i].imgName,
                  fileType: fileExe,
                });
              }
              item.kycDetails.gstNo = gstNo;
            }
            if (item.kycDetails.panNo.length > 0) {
              let panNo = [];
              for (let i = 0; i < item.kycDetails.panNo.length; i++) {
                var fileExe = await Helper.getFileExtension(
                  item.kycDetails.panNo[i].imgName
                );
                panNo.push({
                  imgUrl:
                    process.env.IMAGE_URL +
                    "suppliers/" +
                    item.kycDetails.panNo[i].imgName,
                  imgName: item.kycDetails.panNo[i].imgName,
                  fileType: fileExe,
                });
              }
              item.kycDetails.panNo = panNo;
            }
            if (item.kycDetails.idProof.length > 0) {
              let idProof = [];
              for (let i = 0; i < item.kycDetails.idProof.length; i++) {
                var fileExe = await Helper.getFileExtension(
                  item.kycDetails.idProof[i].imgName
                );
                idProof.push({
                  imgUrl:
                    process.env.IMAGE_URL +
                    "suppliers/" +
                    item.kycDetails.idProof[i].imgName,
                  imgName: item.kycDetails.idProof[i].imgName,
                  fileType: fileExe,
                });
              }
              item.kycDetails.idProof = idProof;
            }
            if (item.businessDetails.businessLicenceNo.length > 0) {
              let businessLicenceNo = [];
              for (
                let i = 0;
                i < item.businessDetails.businessLicenceNo.length;
                i++
              ) {
                var fileExe = await Helper.getFileExtension(
                  item.businessDetails.businessLicenceNo[i].imgName
                );
                businessLicenceNo.push({
                  imgUrl:
                    process.env.IMAGE_URL +
                    "suppliers/" +
                    item.businessDetails.businessLicenceNo[i].imgName,
                  imgName: item.businessDetails.businessLicenceNo[i].imgName,
                  fileType: fileExe,
                });
              }
              item.businessDetails.businessLicenceNo = businessLicenceNo;
            }
            if (item.businessDetails.tradeMarkFiles.length > 0) {
              let tradeMarkFiles = [];
              for (
                let i = 0;
                i < item.businessDetails.tradeMarkFiles.length;
                i++
              ) {
                var fileExe = await Helper.getFileExtension(
                  item.businessDetails.tradeMarkFiles[i].imgName
                );
                tradeMarkFiles.push({
                  imgUrl:
                    process.env.IMAGE_URL +
                    "suppliers/" +
                    item.businessDetails.tradeMarkFiles[i].imgName,
                  imgName: item.businessDetails.tradeMarkFiles[i].imgName,
                  fileType: fileExe,
                });
              }
              item.businessDetails.tradeMarkFiles = tradeMarkFiles;
            }
            if (item.businessDetails.selfAgreement.length > 0) {
              let selfAgreement = [];
              for (
                let i = 0;
                i < item.businessDetails.selfAgreement.length;
                i++
              ) {
                var fileExe = await Helper.getFileExtension(
                  item.businessDetails.selfAgreement[i].imgName
                );
                selfAgreement.push({
                  imgUrl:
                    process.env.IMAGE_URL +
                    "suppliers/" +
                    item.businessDetails.selfAgreement[i].imgName,
                  imgName: item.businessDetails.selfAgreement[i].imgName,
                  fileType: fileExe,
                });
              }
              item.businessDetails.selfAgreement = selfAgreement;
            }
            if (item.businessDetails.bankDetails.length > 0) {
              let bankDetails = [];
              for (
                let i = 0;
                i < item.businessDetails.bankDetails.length;
                i++
              ) {
                var fileExe = await Helper.getFileExtension(
                  item.businessDetails.bankDetails[i].imgName
                );
                bankDetails.push({
                  imgUrl:
                    process.env.IMAGE_URL +
                    "suppliers/" +
                    item.businessDetails.bankDetails[i].imgName,
                  imgName: item.businessDetails.bankDetails[i].imgName,
                  fileType: fileExe,
                });
              }
              item.businessDetails.bankDetails = bankDetails;
            }
            if (item.businessDetails.vendorEnroll.length > 0) {
              let vendorEnroll = [];
              for (
                let i = 0;
                i < item.businessDetails.vendorEnroll.length;
                i++
              ) {
                var fileExe = await Helper.getFileExtension(
                  item.businessDetails.vendorEnroll[i].imgName
                );
                vendorEnroll.push({
                  imgUrl:
                    process.env.IMAGE_URL +
                    "suppliers/" +
                    item.businessDetails.vendorEnroll[i].imgName,
                  imgName: item.businessDetails.vendorEnroll[i].imgName,
                  fileType: fileExe,
                });
              }
              item.businessDetails.vendorEnroll = vendorEnroll;
            }
            if (item.otherDetails.codeOfConduct.length > 0) {
              let codeOfConduct = [];
              for (let i = 0; i < item.otherDetails.codeOfConduct.length; i++) {
                var fileExe = await Helper.getFileExtension(
                  item.otherDetails.codeOfConduct[i].imgName
                );
                codeOfConduct.push({
                  imgUrl:
                    process.env.IMAGE_URL +
                    "suppliers/" +
                    item.otherDetails.codeOfConduct[i].imgName,
                  imgName: item.otherDetails.codeOfConduct[i].imgName,
                  fileType: fileExe,
                });
              }
              item.otherDetails.codeOfConduct = codeOfConduct;
            }
            if (item.otherDetails.cancelledCheque.length > 0) {
              let cancelledCheque = [];
              for (
                let i = 0;
                i < item.otherDetails.cancelledCheque.length;
                i++
              ) {
                var fileExe = await Helper.getFileExtension(
                  item.otherDetails.cancelledCheque[i].imgName
                );
                cancelledCheque.push({
                  imgUrl:
                    process.env.IMAGE_URL +
                    "suppliers/" +
                    item.otherDetails.cancelledCheque[i].imgName,
                  imgName: item.otherDetails.cancelledCheque[i].imgName,
                  fileType: fileExe,
                });
              }
              item.otherDetails.cancelledCheque = cancelledCheque;
            }
            if (item.otherDetails.cancelledCheque.length > 0) {
              let cancelledCheque = [];
              for (
                let i = 0;
                i < item.otherDetails.cancelledCheque.length;
                i++
              ) {
                var fileExe = await Helper.getFileExtension(
                  item.otherDetails.cancelledCheque[i].imgName
                );
                cancelledCheque.push({
                  imgUrl:
                    process.env.IMAGE_URL +
                    "suppliers/" +
                    item.otherDetails.cancelledCheque[i].imgName,
                  imgName: item.otherDetails.cancelledCheque[i].imgName,
                  fileType: fileExe,
                });
              }
              item.otherDetails.cancelledCheque = cancelledCheque;
            }
          })
        );
        const resData = {
          supplierList: serviceList,
          totalResult: totalResult,
          limit: limit,
        };
        Helper.response(
          res,
          CODES.STATUS_CODES.OK,
          MSG.supplier.fetch[LOCALE || "en"],
          resData
        );
      } else {
        Helper.response(
          res,
          CODES.STATUS_CODES.Not_Found,
          MSG.supplier.fetch[LOCALE || "en"],
          {
            supplierList: [],
          }
        );
      }
    } catch (error) {
      console.error("Error:", error);
      Helper.response(
        res,
        CODES.STATUS_CODES.Internal_Server_Error,
        MSG.serverError[LOCALE || "en"]
      );
    }
  },
  supplierAccountStatusUpdate: async (req, res) => {
    try {
      const { _id } = req.params;
      const { status } = req.body;
      let updateObj = {
        accountStatus: status,
        JWT_Token: [],
      };
      const supplierDetails = await supplierModel.findById(_id);
      if (!supplierDetails) {
        return Helper.response(res, 404, "Not found");
      }

      const updatedSupplierDetails = await supplierModel.findByIdAndUpdate(
        _id,
        {
          $set: updateObj,
        },
        {
          new: true,
        }
      );
      if (!updatedSupplierDetails) {
        Helper.response(res, 404, "Not found");
        return;
      }
      var html = "",
        successMsg = "";
      if (updatedSupplierDetails.accountStatus == "Active") {
        successMsg = "Supplier activated";
        html = `
      <p>Your account has been <b>activated.</b></p> </br></br></br>
      `;
      }
      if (updatedSupplierDetails.accountStatus == "Inactive") {
        await ProductModel.updateMany(
          { supplierId: supplierDetails._id },
          { $set: { productStatus: "Inactive" } },
          { multi: true }
        );
        await ServiceModel.updateMany(
          { supplierId: supplierDetails._id },
          { $set: { status: "Inactive" } },
          { multi: true }
        );
        successMsg = "Supplier inactivated";
        html = `
      <p>Your account has been <b>inactivated. Your product/service are also <b>inactivated</b> now.</b></p> </br></br></br>
      `;
      }
      if (updatedSupplierDetails.accountStatus == "Delete") {
        console.log("delete");
        await ProductModel.updateMany(
          { supplierId: supplierDetails._id },
          { $set: { productStatus: "Delete" } },
          { multi: true }
        );
        await ServiceModel.updateMany(
          { supplierId: supplierDetails._id },
          { $set: { status: "Delete" } },
          { multi: true }
        );
        await OrderDetailsModel.updateMany(
          { supplierId: supplierDetails._id },
          { $set: { orderStatus: "Delete" } },
          { multi: true }
        );
        await queryChatModel.updateMany(
          { supplierId: supplierDetails._id },
          { $set: { status: "Delete" } },
          { multi: true }
        );
        await querySellerResponseModel.updateMany(
          { supplierId: supplierDetails._id },
          { $set: { status: "Delete" } },
          { multi: true }
        );
        await queryResponseModel.updateMany(
          { supplierId: supplierDetails._id },
          { $set: { status: "Delete" } },
          { multi: true }
        );
        await queryModel.updateMany(
          { supplierId: supplierDetails._id },
          { $set: { status: "Delete" } },
          { multi: true }
        );
        await wishListModel.updateMany(
          { supplierId: supplierDetails._id },
          { $set: { status: "Delete" } },
          { multi: true }
        );
        successMsg = "Supplier deleted";
        html = `
      <p>Your account has been <b>deleted. Your product/service are also <b>deleted</b> now.</b></p> </br></br></br>
      `;
      }
      await Helper.send365Email(
        process.env.MAIL_SEND_EMAIL,
        updatedSupplierDetails.basicInfo.emailId,
        "Regarding Your Registration",
        html,
        "text"
      );
      Helper.response(res, 200, successMsg);
    } catch (err) {
      console.log(err, "err");
      Helper.response(res, 500, "Internal server error");
    }
  },
  supplierDetails: async (req, res) => {
    try {
      const supplierId = req.params.id;
      console.log({
        supplierId,
      });

      //{"-JWT_Token -otp -isOtpVerified -device_Token"}

      //  const userInfo = await supplierModel
      //    .findOne(
      //      { _id: ObjectId(id) },
      //      { JWT_Token: 0, otp: 0, isOtpVerified: 0, device_Token: 0 }
      //    )
      //    .lean();
      const supplierDetails = await supplierModel.findById(supplierId, {
        password: 0,
        JWT_Token: 0,
        _v: 0,
      });
      console.log({
        supplierDetails,
      });

      if (supplierDetails) {
        // supplierDetails.orderList = await orderByUser(id);
        return Helper.response(res, 200, MSG.success[LOCALE || "en"], {
          supplierDetails,
        });
      }
      return Helper.response(res, 402, MSG.notFound[LOCALE || "en"]);
    } catch (error) {
      return Helper.response(res, 500, MSG.serverError[LOCALE || "en"]);
    }
  },
  supplierStatusDelete: async (req, res) => {
    try {
      const supplierId = req.params.id;
      console.log({
        supplierId,
      });

      const fieldsToUpdate = {
        // mobile: "00007777",
        // oldNumber: req.user.mobile,
        accountStatus: "Delete",
        JWT_Token: [],
      };

      console.log({
        fieldsToUpdate,
      });

      const doesSupplierExist = await supplierModel.findById(supplierId);
      console.log({
        doesSupplierExist,
      });

      if (doesSupplierExist) {
        //   const customer = await customerModel
        //     .findOneAndUpdate(
        //       { _id: ObjectId(supplierId) },
        //       { $set: updateObj },
        //       { new: true }
        //     )
        //     .exec();

        //  const updatedSupplierDetails = await customerModel
        //    .findOneAndUpdate(
        //      { _id: ObjectId(supplierId) },
        //      { $set: updateObj },
        //      { new: true }
        //    )
        //    .exec();

        const updatedSupplierDetails = await supplierModel
          .findByIdAndUpdate(
            supplierId,
            {
              $set: fieldsToUpdate,
            },
            {
              new: true,
            }
          )
          .select({
            password: 0,
            __v: 0,
          });
        console.log({
          updatedSupplierDetails,
        });

        if (!updatedSupplierDetails) {
          return Helper.response(
            res,
            CODES.STATUS_CODES.Not_Found,
            MSG.notFound[LOCALE || "en"]
          );
        }
        return Helper.response(
          res,
          CODES.STATUS_CODES.OK,
          MSG.success[LOCALE || "en"]
        );
      } else {
        return Helper.response(
          res,
          CODES.STATUS_CODES.Not_Found,
          MSG.notFound[LOCALE || "en"]
        );
      }
    } catch (error) {
      return Helper.response(
        res,
        CODES.STATUS_CODES.Internal_Server_Error,
        MSG.serverError[LOCALE || "en"]
      );
    }
  },
  previewSupplierEditRequest: async (req, res) => {
    const { _id } = req.params;
    try {
      console.log("preview");
      var query = {
        supplierId: _id,
      };
      const supplier = await supplierEditRequestModel.findOne(query, {
        JWT_Token: 0,
      });
      if (!supplier) {
        return Helper.response(res, 404, "No data found.");
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
      if (supplier.businessDetails.businessLicenceNo.length > 0) {
        let businessLicenceNo = [];
        for (
          let i = 0;
          i < supplier.businessDetails.businessLicenceNo.length;
          i++
        ) {
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
        supplier.businessDetails.businessLicenceNo = businessLicenceNo;
      }
      if (supplier.businessDetails.tradeMarkFiles.length > 0) {
        let tradeMarkFiles = [];
        for (
          let i = 0;
          i < supplier.businessDetails.tradeMarkFiles.length;
          i++
        ) {
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
        supplier.businessDetails.tradeMarkFiles = tradeMarkFiles;
      }
      if (supplier.businessDetails.vendorEnroll.length > 0) {
        let vendorEnroll = [];
        for (let i = 0; i < supplier.businessDetails.vendorEnroll.length; i++) {
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
        supplier.businessDetails.vendorEnroll = vendorEnroll;
      }
      if (supplier.businessDetails.selfAgreement.length > 0) {
        let selfAgreement = [];
        for (
          let i = 0;
          i < supplier.businessDetails.selfAgreement.length;
          i++
        ) {
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
        supplier.businessDetails.selfAgreement = selfAgreement;
      }
      if (supplier.businessDetails.bankDetails.length > 0) {
        let bankDetails = [];
        for (let i = 0; i < supplier.businessDetails.bankDetails.length; i++) {
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
      return Helper.response(res, 200, "Edit preview data", {
        data: supplier,
      });
    } catch (error) {
      console.log(error, "error");
      return Helper.response(res, 500, "Could not find supplier information.");
    }
  },
  acceptSupplierEditRequest: async (req, res) => {
    try {
      const { _id } = req.params;
      const supplierDetails = await supplierModel.findById(_id);
      if (!supplierDetails) {
        return Helper.response(res, 404, "Not found");
      }
      req.body.accountStatus = "Active";
      req.body.updatedAt = new Date();
      req.body.isEdited = "acceptByAdmin";
      const updatedSupplierDetails = await supplierModel.findByIdAndUpdate(
        _id,
        {
          $set: req.body,
        },
        {
          new: true,
        }
      );
      if (!updatedSupplierDetails) {
        Helper.response(res, 404, "Not found");
        return;
      }
      //  const deleteEditRequest = await supplierEditRequestModel.findOneAndRemove({supplierId:_id})
      Helper.response(res, 200, "Request accepted successful");
    } catch (err) {
      console.log(err, "err");
      Helper.response(res, 500, "Internal server error");
    }
  },
  rejecteSupplierEditRequest: async (req, res) => {
    try {
      const { _id } = req.params;
      const supplierDetails = await supplierModel.findById(_id);
      if (!supplierDetails) {
        return Helper.response(res, 404, "Not found");
      }
      req.body.accountStatus = "Active";
      req.body.updatedAt = new Date();
      req.body.isEdited = "rejectByAdmin";
      const updatedSupplierDetails = await supplierModel.findByIdAndUpdate(
        _id,
        {
          $set: req.body,
        },
        {
          new: true,
        }
      );
      if (!updatedSupplierDetails) {
        Helper.response(res, 404, "Not found");
        return;
      }
      //  const deleteEditRequest = await supplierEditRequestModel.findOneAndRemove({supplierId:_id})
      Helper.response(res, 200, "Request rejected successful");
    } catch (err) {
      console.log(err, "err");
      Helper.response(res, 500, "Internal server error");
    }
  },
  getSupplier: async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit) : 200;
      const page = req.query.page ? parseInt(req.query.page) : 1;
      let query = {
        accountStatus: {
          $ne: "Delete",
        },
      };

      if (req.query.search) {
        const searchObject = {
          $or: [
            {
              "basicInfo.founderName": {
                $regex: req.query.search,
                $options: "i",
              },
            },
            {
              "basicInfo.companyName": {
                $regex: req.query.search,
                $options: "i",
              },
            },
          ],
        };
        Object.assign(query, searchObject);
      }

      const result = await supplierModel.paginate(query, {
        page: page,
        sort: {
          createdAt: -1,
        },
        limit: limit,
        select: {
          JWT_Token: 0,
          "basicInfo.password": 0,
          "basicInfo.companyRegistrationFile": 0,
          "basicInfo.companyRegistrationYear": 0,
          "basicInfo.website": 0,
          "basicInfo.contactNo": 0,
          "basicInfo.spocNumber": 0,
          "basicInfo.countryCode": 0,
          "basicInfo.country": 0,
          "basicInfo.dob": 0,
          address: 0,
          registeredAddress: 0,
          kycDetails: 0,
          businessDetails: 0,
          otherDetails: 0,
          website: 0,
          otp: 0,
          isOtpVerified: 0,
          isEdited: 0,
          createdAt: 0,
          updatedAt: 0,
          __v: 0,
          isVerified: 0,
          verificationToken: 0,
          isProfileStep: 0,
          verificationTokenExpires: 0,
        },
      });
      const serviceList = result.docs;
      const totalResult = result.totalDocs;

      if (serviceList.length > 0) {
        const resData = {
          supplierList: serviceList,
          totalResult: totalResult,
          limit: limit,
        };
        Helper.response(
          res,
          CODES.STATUS_CODES.OK,
          MSG.supplier.fetch[LOCALE || "en"],
          resData
        );
      } else {
        Helper.response(
          res,
          CODES.STATUS_CODES.Not_Found,
          MSG.supplier.fetch[LOCALE || "en"],
          {
            supplierList: [],
          }
        );
      }
    } catch (error) {
      console.error("Error:", error);
      Helper.response(
        res,
        CODES.STATUS_CODES.Internal_Server_Error,
        MSG.serverError[LOCALE || "en"]
      );
    }
  },
  sellerRead: async (req, res) => {
    try {
      const _id = req.params.sellerId;
      const sellerExist = await supplierModel.findById(_id);
      if (sellerExist) {
        const sellerData = await supplierModel.findByIdAndUpdate(
          _id,
          {
            isRead: true,
          },
          {
            new: true,
          }
        );
        if (!sellerData) {
          return Helper.response(res, 404, "Not found");
        }
        return Helper.response(res, 200, "Seller read successfully");
      } else {
        return Helper.response(res, 404, "Not found");
      }
    } catch (error) {
      console.log(error);
      return Helper.response(res, 500, "Internal error");
    }
  },
};
