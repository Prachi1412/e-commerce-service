const CODES = require("../../../config/status_codes/status_codes");
const MSG = require("../../../config/language/Messages");
const { logger } = require("../../../logger/winston");
const supplierModel = require("../../../models/SupplierModel");
const mongoose = require("mongoose");
const moment = require("moment-timezone");
const { ObjectId } = mongoose.Types;
// ObjectId = new ObjectId();

const productModel = require("../../../models/ProductModel");
const Helper = require("../../../config/helper");
const productImage = Helper.upload_space("products").array("productImages");
module.exports = {
  listProducts: async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit) : 25;
      const page = req.query.page ? parseInt(req.query.page) : 1;

      let query = {
        productStatus: {
          $ne: "Delete",
        },
      };
      if (req.query.isRead == "true" || req.query.isRead == true) {
        query.isRead = true;
      } else if (req.query.isRead == "false" || req.query.isRead == false) {
        query.isRead = false;
      }
      // let query = {
      //   productStatus: {
      //     $nin: ["Delete", "Cancel"],
      //   },
      // };

      // if (req.query.status == "Active" || req.query.status == "Inactive") {
      //   query.productStatus = {
      //     $eq: req.query.status
      //   };
      // } else if (req.query.status == "Pending") {
      //   query = {
      //     productStatus: {
      //       $ne: "Delete"
      //     },
      //     "approvedStatus.isApproved": false,
      //   };
      // } else if (req.query.status == "Approved") {
      //   query = {
      //     productStatus: {
      //       $ne: "Delete"
      //     },
      //     "approvedStatus.isApproved": true,
      //   };
      // }
      let status = req.query.status ? req.query.status : null;
      if (status) {
        let statusArray = status.split(",");
        let statusConditions = [];
        if (statusArray.includes("Active")) {
          statusConditions.push({
            productStatus: {
              $in: ["Active"],
            },
          });
        }
        if (statusArray.includes("Inactive")) {
          statusConditions.push({
            productStatus: {
              $in: ["Inactive"],
            },
          });
        }
        if (statusArray.includes("Cancel")) {
          statusConditions.push({
            status: {
              $in: ["Cancel"],
            },
          });
        }
        if (statusArray.includes("Pending")) {
          statusConditions.push({
            "approvedStatus.isApproved": {
              $in: [false],
            },
          });
        }
        if (statusArray.includes("Approved")) {
          statusConditions.push({
            "approvedStatus.isApproved": {
              $in: [true],
            },
          });
        }
        // Combine conditions with $or
        if (statusConditions.length > 0) {
          query.$or = statusConditions;
        }
      }

      if (req.query.search) {
        let searchObject = {
          $or: [
            {
              productName: {
                $regex: req.query.search,
                $options: "i",
              },
            },
            {
              productUniqueId: {
                $regex: req.query.search,
                $options: "i",
              },
            },
            {
              "productClassifications_details.productClassificationName": {
                $regex: req.query.search,
                $options: "i",
              },
            },
            {
              "category_details.productCategoryName": {
                $regex: req.query.search,
                $options: "i",
              },
            },
            {
              "supplierDetails.basicInfo.founderName": {
                $regex: req.query.search,
                $options: "i",
              },
            },
          ],
        };
        Object.assign(query, searchObject);
      }
      let orConditions = [];
      if (req.query.productCategoryIds) {
        let productCategoryIds = req.query.productCategoryIds;
        var productCatId = productCategoryIds.split(",");
        var arrayCatId = [];
        productCatId.forEach((id) => {
          arrayCatId.push(new ObjectId(id));
        });
        orConditions.push({
          productCategoryId: {
            $in: arrayCatId,
          },
        });
        // query.productCategoryId = { $in: arrayCatId };
      }
      if (req.query.productSubCategoryIds) {
        let subCategoryIds = req.query.productSubCategoryIds;
        var productSubCatId = subCategoryIds.split(",");
        var arraySubCatId = [];
        productSubCatId.forEach((id) => {
          arraySubCatId.push(new ObjectId(id));
        });
        orConditions.push({
          productSubCategoryId: {
            $in: arraySubCatId,
          },
        });
        // query.productSubCategoryId = { $in: arraySubCatId };
      }
      if (orConditions.length > 0) {
        query.$and = orConditions;
      }
      let supplierId = req.query.supplierId ? req.query.supplierId : null;
      if (supplierId) {
        let supplierIdArray = supplierId.split(",");
        let objectIdIdArray = supplierIdArray.map((id) => new ObjectId(id));
        query.supplierId = {
          $in: objectIdIdArray,
        };
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
      // console.log({ query });
      // logger.info("query", JSON.stringify(query));
      let agg = [
        {
          $lookup: {
            from: "ProductCategory",
            localField: "productCategoryId",
            foreignField: "_id",
            as: "category_details",
          },
        },
        // {
        //   $unwind: {
        //     path: "$category_details",
        //     preserveNullAndEmptyArrays: true,
        //   },
        // },
        {
          $lookup: {
            from: "ProductSubCategory",
            localField: "productSubCategoryId",
            foreignField: "_id",
            as: "subcategory_details",
          },
        },
        {
          $lookup: {
            from: "ProductClassification",
            localField: "productClassifications",
            foreignField: "_id",
            as: "productClassifications_details",
          },
        },
        // {
        //   $unwind: {
        //     path: "$productClassifications_details",
        //     preserveNullAndEmptyArrays: true,
        //   },
        // },
        {
          $lookup: {
            from: "Supplier",
            localField: "supplierId",
            foreignField: "_id",
            as: "supplierDetails",
          },
        },
        {
          $unwind: {
            path: "$supplierDetails",
            preserveNullAndEmptyArrays: true,
          },
        },
        //   {
        //     $unwind: {
        //       path: "$subcategory_details",
        //       preserveNullAndEmptyArrays: true,
        //     },
        //   },
        {
          $match: query,
        },
        {
          $project: {
            _id: 1,
            productName: 1,
            productCategoryId: 1,
            productCategory: "$category_details.productCategoryName",
            productSubCategory: "$subcategory_details.subCategoryName",
            productSubCategoryId: 1,
            productNameForListing: 1,
            productImages: 1,
            productImageThumbnail: 1,
            productClassifications: "$productClassifications_details",
            supplierName: "$supplierDetails.basicInfo.founderName",
            companyName: "$supplierDetails.basicInfo.companyName",
            supplierId: 1,
            productCDSCORegistration: 1,
            keywords: 1,
            productCDSCORegistrationFiles: 1,
            productDimensions: 1,
            productDescription: 1,
            productTagline: 1,
            genericName: 1,
            specificUse: 1,
            productVideo: 1,
            uploadCertificateDetails: 1,
            otherFeature: 1,
            specification: 1,
            compatibleDevices: 1,
            typeOfconsumables: 1,
            productInstallation: 1,
            maintainainceOffer: 1,
            accesoriesRequirement: 1,
            productWarranty: 1,
            maintenance: 1,
            accessories: 1,
            productWarrantyPeriod: 1,
            consumables: 1,
            consumableRequirement: 1,
            otherRelevantInformation: 1,
            uploadProductBrochure: 1,
            typeOfDemo: 1,
            awardRecognition: 1,
            shippingPreference: 1,
            productPrice: 1,
            updatedAt: 1,
            priceByAdmin: 1,
            productMinDelivery: 1,
            productDeliveryPreference: 1,
            productPaymentMode: 1,
            isFullPayment: 1,
            isPartPayment: 1,
            partPayment: 1,
            installments: 1,
            shipmentType: 1,
            createdAt: 1,
            certificates: 1,
            status: 1,
            productStatus: 1,
            submitStatus: 1,
            approvedStatus: 1,
            cancelStatus: 1,
            contractStatus: 1,
            commisionAddedByAdmin: 1,
            contractFiles: 1,
            productCode: 1,
            productWeight: 1,
            isDemo: 1,
            categoryType: 1,
            productQuantity: 1,
            productUniqueId: 1,
            sku: 1,
            hsnNo: 1,
            isRead: 1,
            noOfUnitSold: {
              $cond: { if: "$noOfUnitSold", then: "$noOfUnitSold", else: 0 },
            },
          },
        },
        {
          $sort: {
            updatedAt: -1,
          },
        },
      ];

      const options = {
        page: page,
        limit: limit,
        allowDiskUse: true,
      };

      let myAggregate = productModel.aggregate(agg);

      const result = await productModel.aggregatePaginate(myAggregate, options);

      if (result.docs.length > 0) {
        let productList = result.docs;
        let totalResult = result.totalDocs;

        if (productList.length > 0) {
          await Promise.all(
            productList.map(async (item) => {
              if (item.productImages.length > 0) {
                let productImages = [];
                for (let i = 0; i < item.productImages.length; i++) {
                  var fileExe = await Helper.getFileExtension(
                    item.productImages[i].imgName
                  );
                  productImages.push({
                    imgUrl:
                      process.env.IMAGE_URL +
                      "suppliers/" +
                      item.productImages[i].imgName,
                    imgName: item.productImages[i].imgName,
                    _id: item.productImages[i]._id,
                    fileType: fileExe,
                  });
                }
                item.productImages = productImages;
              }
              if (
                item.productImageThumbnail != undefined &&
                item.productImageThumbnail.length > 0
              ) {
                let productImageThumbnail = [];
                for (let i = 0; i < item.productImageThumbnail.length; i++) {
                  var fileExe = await Helper.getFileExtension(
                    item.productImageThumbnail[i].imgName
                  );
                  productImageThumbnail.push({
                    imgUrl:
                      process.env.IMAGE_URL +
                      "suppliers/" +
                      item.productImageThumbnail[i].imgName,
                    imgName: item.productImageThumbnail[i].imgName,
                    _id: item.productImageThumbnail[i]._id,
                    fileType: fileExe,
                  });
                }
                item.productImageThumbnail = productImageThumbnail;
              }
              if (
                item.productVideo != undefined &&
                item.productVideo.length > 0
              ) {
                let productVideo = [];
                for (let i = 0; i < item.productVideo.length; i++) {
                  var fileExe = await Helper.getFileExtension(
                    item.productVideo[i].imgName
                  );
                  productVideo.push({
                    imgUrl:
                      process.env.IMAGE_URL +
                      "suppliers/" +
                      item.productVideo[i].imgName,
                    imgName: item.productVideo[i].imgName,
                    _id: item.productVideo[i]._id,
                    fileType: fileExe,
                  });
                }
                item.productVideo = productVideo;
              }
              if (
                item.uploadCertificateDetails !== undefined &&
                item.uploadCertificateDetails.length > 0
              ) {
                for (let i = 0; i < item.uploadCertificateDetails.length; i++) {
                  let uploadCertificateDetailsArr = [];

                  if (
                    item.uploadCertificateDetails[i].uploadCertificate !==
                      undefined &&
                    item.uploadCertificateDetails[i].uploadCertificate.length >
                      0
                  ) {
                    for (
                      let j = 0;
                      j <
                      item.uploadCertificateDetails[i].uploadCertificate.length;
                      j++
                    ) {
                      var fileExe = await Helper.getFileExtension(
                        item.uploadCertificateDetails[i].uploadCertificate[j]
                          .imgName
                      );

                      uploadCertificateDetailsArr.push({
                        imgUrl:
                          process.env.IMAGE_URL +
                          "suppliers/" +
                          item.uploadCertificateDetails[i].uploadCertificate[j]
                            .imgName,
                        imgName:
                          item.uploadCertificateDetails[i].uploadCertificate[j]
                            .imgName,
                        _id: item.uploadCertificateDetails[i].uploadCertificate[
                          j
                        ]._id,
                        fileType: fileExe,
                      });
                    }
                  }

                  item.uploadCertificateDetails[i].uploadCertificate =
                    uploadCertificateDetailsArr;
                }
              }
              if (
                item.uploadProductBrochure != undefined &&
                item.uploadProductBrochure.length > 0
              ) {
                let uploadProductBrochure = [];
                for (let i = 0; i < item.uploadProductBrochure.length; i++) {
                  var fileExe = await Helper.getFileExtension(
                    item.uploadProductBrochure[i].imgName
                  );
                  uploadProductBrochure.push({
                    imgUrl:
                      process.env.IMAGE_URL +
                      "suppliers/" +
                      item.uploadProductBrochure[i].imgName,
                    imgName: item.uploadProductBrochure[i].imgName,
                    _id: item.uploadProductBrochure[i]._id,
                    fileType: fileExe,
                  });
                }
                item.uploadProductBrochure = uploadProductBrochure;
              }
              if (
                item.productCDSCORegistrationFiles &&
                item.productCDSCORegistrationFiles.length > 0
              ) {
                let productCDSCORegistrationFiles = [];
                for (
                  let i = 0;
                  i < item.productCDSCORegistrationFiles.length;
                  i++
                ) {
                  var fileExe = await Helper.getFileExtension(
                    item.productCDSCORegistrationFiles[i].imgName
                  );
                  productCDSCORegistrationFiles.push({
                    imgUrl:
                      process.env.IMAGE_URL +
                      "suppliers/" +
                      item.productCDSCORegistrationFiles[i].imgName,
                    imgName: item.productCDSCORegistrationFiles[i].imgName,
                    _id: item.productCDSCORegistrationFiles[i]._id,
                    fileType: fileExe,
                  });
                }
                item.productCDSCORegistrationFiles =
                  productCDSCORegistrationFiles;
              }
              if (item.certificates && item.certificates.length > 0) {
                let certificates = [];
                for (let i = 0; i < item.certificates.length; i++) {
                  var fileExe = await Helper.getFileExtension(
                    item.certificates[i].imgName
                  );
                  certificates.push({
                    imgUrl:
                      process.env.IMAGE_URL +
                      "suppliers/" +
                      item.certificates[i].imgName,
                    imgName: item.certificates[i].imgName,
                    _id: item.certificates[i]._id,
                    fileType: fileExe,
                  });
                }
                item.certificates = certificates;
              }
              if (item.contractFiles && item.contractFiles.length > 0) {
                let contractFiles = [];
                for (let i = 0; i < item.contractFiles.length; i++) {
                  var fileExe = await Helper.getFileExtension(
                    item.contractFiles[i].imgName
                  );
                  contractFiles.push({
                    imgUrl:
                      process.env.IMAGE_URL +
                      "suppliers/" +
                      item.contractFiles[i].imgName,
                    imgName: item.contractFiles[i].imgName,
                    _id: item.contractFiles[i]._id,
                    fileType: fileExe,
                  });
                }
                item.contractFiles = contractFiles;
              }
              if (item.status == "Submitted") item.status = "Pending";
            })
          );
          let resData = {
            productList: productList,
            totalResult: totalResult,
            limit: limit,
          };
          Helper.response(
            res,
            200,
            "Product list fetched successfully.",
            resData
          );
        } else {
          Helper.response(
            res,
            CODES.STATUS_CODES.Not_Found,
            "Product list fetched successfully.",
            {
              productList: [],
            }
          );
        }
      } else {
        Helper.response(
          res,
          CODES.STATUS_CODES.Not_Found,
          "Product list fetched successfully.",
          {
            productList: [],
          }
        );
      }
    } catch (err) {
      console.log(err, "Rrrrrrrr");
      return Helper.response(res, 500, "Internal server error.");
    }
  },
  uploadPic: async (req, res) => {
    try {
      productImage(req, res, async function (err, result) {
        if (err) {
          return Helper.response(res, 422, "Something went wrong");
        } else {
          let imgName = [];
          for (let obj of req.files) {
            var imgUrl = obj.location.split("products/");
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
  productDetails: async (req, res) => {
    try {
      let query = {
        _id: new ObjectId(req.params.productId),
        status: {
          $ne: "Delete",
        },
      };
      var productRead = await productModel.updateOne(
        query,
        { isRead: true },
        { new: true }
      );
      logger.info("query", JSON.stringify(query));
      let agg = [
        {
          $lookup: {
            from: "ProductCategory",
            localField: "productCategoryId",
            foreignField: "_id",
            as: "category_details",
          },
        },
        // {
        //   $unwind: {
        //     path: "$category_details",
        //     preserveNullAndEmptyArrays: true,
        //   },
        // },
        {
          $lookup: {
            from: "ProductSubCategory",
            localField: "productSubCategoryId",
            foreignField: "_id",
            as: "subcategory_details",
          },
        },
        {
          $lookup: {
            from: "ProductClassification",
            localField: "productClassifications",
            foreignField: "_id",
            as: "productClassifications_details",
          },
        },
        // {
        //   $unwind: {
        //     path: "$productClassifications_details",
        //     preserveNullAndEmptyArrays: true,
        //   },
        // },
        {
          $lookup: {
            from: "Supplier",
            localField: "supplierId",
            foreignField: "_id",
            as: "supplierDetails",
          },
        },
        {
          $unwind: {
            path: "$supplierDetails",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $match: query,
        },
        {
          $project: {
            _id: 1,
            productName: 1,
            productCategoryId: "$category_details",
            // productCategoryId: 1,
            productCategory: "$category_details.productCategoryName",
            productSubCategoryId: "$subcategory_details",
            productClassifications: "$productClassifications_details",
            supplierName: "$supplierDetails.basicInfo.founderName",
            supplierId: 1,
            productNameForListing: 1,
            keywords: 1,
            productImages: 1,
            productImageThumbnail: 1,
            productCDSCORegistration: 1,
            productCDSCORegistrationFiles: 1,
            productDimensions: 1,
            productDescription: 1,
            productTagline: 1,
            genericName: 1,
            specificUse: 1,
            productVideo: 1,
            uploadCertificateDetails: 1,
            otherFeature: 1,
            specification: 1,
            compatibleDevices: 1,
            typeOfconsumables: 1,
            productInstallation: 1,
            maintainainceOffer: 1,
            accesoriesRequirement: 1,
            productWarranty: 1,
            maintenance: 1,
            accessories: 1,
            productWarrantyPeriod: 1,
            consumables: 1,
            consumableRequirement: 1,
            otherRelevantInformation: 1,
            uploadProductBrochure: 1,
            typeOfDemo: 1,
            awardRecognition: 1,
            shippingPreference: 1,
            productPrice: 1,
            priceByAdmin: 1,
            productMinDelivery: 1,
            productDeliveryPreference: 1,
            productPaymentMode: 1,
            createdAt: 1,
            certificates: 1,
            status: 1,
            productStatus: 1,
            submitStatus: 1,
            approvedStatus: 1,
            cancelStatus: 1,
            contractStatus: 1,
            contractFiles: 1,
            customerListStatus: 1,
            commisionAddedByAdmin: 1,
            productCode: 1,
            productWeight: 1,
            isDemo: 1,
            categoryType: 1,
            productQuantity: 1,
            productUniqueId: 1,
            sku: 1,
            hsnNo: 1,
            isFullPayment: 1,
            isPartPayment: 1,
            installments: 1,
            partPayment: 1,
            shipmentType: 1,
            isRead: 1,
          },
        },
        {
          $sort: {
            createdAt: -1,
          },
        },
      ];

      const options = {
        allowDiskUse: true,
      };
      logger.info("agg......query", JSON.stringify(agg));
      let myAggregate = productModel.aggregate(agg);

      const result = await productModel.aggregatePaginate(myAggregate, options);
      console.log({
        result,
      });

      if (result.docs.length > 0) {
        let productList = result.docs;
        let totalResult = result.totalDocs;

        if (productList.length > 0) {
          await Promise.all(
            productList.map(async function (item) {
              if (item.productImages.length > 0) {
                let productImages = [];
                for (let i = 0; i < item.productImages.length; i++) {
                  var fileExe = await Helper.getFileExtension(
                    item.productImages[i].imgName
                  );
                  productImages.push({
                    imgUrl:
                      process.env.IMAGE_URL +
                      "suppliers/" +
                      item.productImages[i].imgName,
                    imgName: item.productImages[i].imgName,
                    fileType: fileExe,
                  });
                }
                item.productImages = productImages;
              }
              if (
                item.productImageThumbnail != undefined &&
                item.productImageThumbnail.length > 0
              ) {
                let productImageThumbnail = [];
                for (let i = 0; i < item.productImageThumbnail.length; i++) {
                  var fileExe = await Helper.getFileExtension(
                    item.productImageThumbnail[i].imgName
                  );
                  productImageThumbnail.push({
                    imgUrl:
                      process.env.IMAGE_URL +
                      "suppliers/" +
                      item.productImageThumbnail[i].imgName,
                    imgName: item.productImageThumbnail[i].imgName,
                    fileType: fileExe,
                  });
                }
                item.productImageThumbnail = productImageThumbnail;
              }
              if (
                item.productVideo != undefined &&
                item.productVideo.length > 0
              ) {
                let productVideo = [];
                for (let i = 0; i < item.productVideo.length; i++) {
                  var fileExe = await Helper.getFileExtension(
                    item.productVideo[i].imgName
                  );
                  productVideo.push({
                    imgUrl:
                      process.env.IMAGE_URL +
                      "suppliers/" +
                      item.productVideo[i].imgName,
                    imgName: item.productVideo[i].imgName,
                    fileType: fileExe,
                  });
                }
                item.productVideo = productVideo;
              }
              if (
                item.uploadCertificateDetails !== undefined &&
                item.uploadCertificateDetails.length > 0
              ) {
                for (let i = 0; i < item.uploadCertificateDetails.length; i++) {
                  let uploadCertificateDetailsArr = [];

                  if (
                    item.uploadCertificateDetails[i].uploadCertificate !==
                      undefined &&
                    item.uploadCertificateDetails[i].uploadCertificate.length >
                      0
                  ) {
                    for (
                      let j = 0;
                      j <
                      item.uploadCertificateDetails[i].uploadCertificate.length;
                      j++
                    ) {
                      var fileExe = await Helper.getFileExtension(
                        item.uploadCertificateDetails[i].uploadCertificate[j]
                          .imgName
                      );

                      uploadCertificateDetailsArr.push({
                        imgUrl:
                          process.env.IMAGE_URL +
                          "suppliers/" +
                          item.uploadCertificateDetails[i].uploadCertificate[j]
                            .imgName,
                        imgName:
                          item.uploadCertificateDetails[i].uploadCertificate[j]
                            .imgName,
                        _id: item.uploadCertificateDetails[i].uploadCertificate[
                          j
                        ]._id,
                        fileType: fileExe,
                      });
                    }
                  }

                  item.uploadCertificateDetails[i].uploadCertificate =
                    uploadCertificateDetailsArr;
                }
              }
              if (
                item.uploadProductBrochure != undefined &&
                item.uploadProductBrochure.length > 0
              ) {
                let uploadProductBrochure = [];
                for (let i = 0; i < item.uploadProductBrochure.length; i++) {
                  var fileExe = await Helper.getFileExtension(
                    item.uploadProductBrochure[i].imgName
                  );
                  uploadProductBrochure.push({
                    imgUrl:
                      process.env.IMAGE_URL +
                      "suppliers/" +
                      item.uploadProductBrochure[i].imgName,
                    imgName: item.uploadProductBrochure[i].imgName,
                    fileType: fileExe,
                  });
                }
                item.uploadProductBrochure = uploadProductBrochure;
              }
              if (
                item.productCDSCORegistrationFiles &&
                item.productCDSCORegistrationFiles.length > 0
              ) {
                let productCDSCORegistrationFiles = [];
                for (
                  let i = 0;
                  i < item.productCDSCORegistrationFiles.length;
                  i++
                ) {
                  var fileExe = await Helper.getFileExtension(
                    item.productCDSCORegistrationFiles[i].imgName
                  );
                  productCDSCORegistrationFiles.push({
                    imgUrl:
                      process.env.IMAGE_URL +
                      "suppliers/" +
                      item.productCDSCORegistrationFiles[i].imgName,
                    imgName: item.productCDSCORegistrationFiles[i].imgName,
                    fileType: fileExe,
                  });
                }
                item.productCDSCORegistrationFiles =
                  productCDSCORegistrationFiles;
              }
              if (item.certificates && item.certificates.length > 0) {
                let certificates = [];
                for (let i = 0; i < item.certificates.length; i++) {
                  var fileExe = await Helper.getFileExtension(
                    item.certificates[i].imgName
                  );
                  certificates.push({
                    imgUrl:
                      process.env.IMAGE_URL +
                      "suppliers/" +
                      item.certificates[i].imgName,
                    imgName: item.certificates[i].imgName,
                    fileType: fileExe,
                  });
                }
                item.certificates = certificates;
              }
              if (item.contractFiles && item.contractFiles.length > 0) {
                let contractFiles = [];
                for (let i = 0; i < item.contractFiles.length; i++) {
                  var fileExe = await Helper.getFileExtension(
                    item.contractFiles[i].imgName
                  );
                  contractFiles.push({
                    imgUrl:
                      process.env.IMAGE_URL +
                      "suppliers/" +
                      item.contractFiles[i].imgName,
                    imgName: item.contractFiles[i].imgName,
                    fileType: fileExe,
                  });
                }
                item.contractFiles = contractFiles;
              }
              if (item.status == "Submitted") item.status = "Pending";
            })
          );
          let resData = {
            productList: productList[0],
          };
          Helper.response(res, 200, "Product fetched successfully.", resData);
        } else {
          Helper.response(res, CODES.STATUS_CODES.Not_Found, "No data found.", {
            productList: {},
          });
        }
      } else {
        Helper.response(
          res,
          CODES.STATUS_CODES.Not_Found,
          "Product list fetched successfully.",
          {
            productList: [],
          }
        );
      }
    } catch (err) {
      console.log(err);
      return Helper.response(res, 500, "Internal server error.");
    }
  },
  ChangeProductStatus: async (req, res) => {
    try {
      const productId = req.params.productId;
      if (req.body.status) {
        var msg = `Product ${req.body.status} Successfully`;
        var statusMsq = req.body.status;
      } else {
        var msg = `Product Updated Successfully`;
        var statusMsq = req.body.productStatus;
      }
      if (req.body.status == "Approved") {
        req.body.approvedStatus = {
          isApproved: true,
          approvedDate: moment().format(),
        };
        req.body.cancelStatus = {
          isCancel: false,
          cancelDate: moment().format(),
        };
        req.body.status = "Approved";
      }
      if (req.body.status == "Contract Signed") {
        req.body.contractStatus = {
          isContract: true,
          contractDate: moment().format(),
        };
        req.body.status = "Contract Signed";
      }
      if (req.body.status == "Pending") {
        req.body.approvedStatus = {
          isApproved: false,
          approvedDate: moment().format(),
        };
        req.body.status = "Submitted";
        req.body.productStatus = "Inactive";
      }
      const doesproductExist = await productModel.findById(productId);
      console.log({
        doesproductExist,
      });

      if (doesproductExist) {
        const updatedProductDetails = await productModel.findByIdAndUpdate(
          productId,
          {
            $set: req.body,
          },
          {
            new: true,
          }
        );
        var checkAvailable = await supplierModel.findOne({
          _id: updatedProductDetails.supplierId,
        });
        var html = `
            <p>Your product with product code ${updatedProductDetails.productUniqueId} is ${statusMsq} now.</p></br></br></br></br></br>`;
        await Helper.send365Email(
          process.env.MAIL_SEND_EMAIL,
          checkAvailable.basicInfo.emailId,
          " Product completion process",
          html,
          "text"
        );
        await Helper.sendNotification(
          updatedProductDetails.supplierId,
          "supplier",
          productId,
          `Your product with product code ${updatedProductDetails.productUniqueId} is ${statusMsq} now.`,
          `product ${statusMsq}`,
          `Product Status Confirmation`,
          updatedProductDetails.supplierId
        );
        if (!updatedProductDetails) {
          return Helper.response(res, 404, "Not found");
        }
        return Helper.response(res, 200, msg);
      } else {
        return Helper.response(res, 404, "Not found");
      }
    } catch (error) {
      console.log(error);
      return Helper.response(res, 500, "Internal error");
    }
  },
  deleteProductImg: async (req, res) => {
    try {
      let productId = new ObjectId(req.params.productId);
      let imageIdToDelete = req.body.imageIdToDelete;

      const result = await productModel.findOne({
        _id: productId,
      });
      console.log(imageIdToDelete, result.productImages, "ppppppppppppp");
      if (
        !result ||
        !result.productImages.some(
          (img) => img._id.toString() === imageIdToDelete
        )
      ) {
        return Helper.response(
          res,
          404,
          "Product not found or image not found for deletion."
        );
      }
      // Update the query to ensure case sensitivity
      await productModel.findOneAndUpdate(
        {
          _id: productId,
        },
        {
          $pull: {
            productImages: {
              _id: new ObjectId(imageIdToDelete),
            },
          },
        },
        {
          new: true,
        }
      );
      // Check if any document was updated

      // Provide a more detailed success message
      return Helper.response(
        res,
        CODES.STATUS_CODES.OK,
        "Image deleted successfully."
      );
    } catch (error) {
      console.log(error);
      return Helper.response(res, 500, MSG.api.fail[LOCALE || "en"]);
    }
  },
};
