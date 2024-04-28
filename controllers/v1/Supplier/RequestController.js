const productModel = require("../../../models/ProductModel");
const Helper = require("../../../config/helper");
const CODES = require("../../../config/status_codes/status_codes");
const mongoose = require("mongoose");
const serviceModel = require("../../../models/ServiceModel");
const supplierModel = require("../../../models/SupplierModel");
const OrderModel = require("../../../models/OrderModel");
const OrderDetailsModel = require("../../../models/OrderDetailsModel");
const ReviewModel = require("../../../models/ReviewModel");
const QueryModel = require("../../../models/QueryModel");
var _ = require("lodash");
const QueryChatModel = require("../../../models/queryChatModel");
const ObjectId = mongoose.Types.ObjectId;
module.exports = {
  listOfPendingProductService: async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit) : 25;
      const page = req.query.page ? parseInt(req.query.page) : 1;
      console.log(req.params.supplierId, "req.params.supplierId");
      let productQuery = {
        supplierId: new ObjectId(req.params.supplierId),
        // "approvedStatus.isApproved": false,
        // $or: [
        //   { "cancelStatus.isCancel": true },
        //   { "cancelStatus.isCancel": false },
        // ],
        // status: { $in: ["Submitted", "Cancel", "Contract Signed"] },
        productStatus: { $nin: ["Delete","Active"]},
      };
      console.log(productQuery);
      let serviceQuery = {
        supplierId: new ObjectId(req.params.supplierId),
        status: { $in: ["Inactive", "Cancel"] },
      };

      if (req.query.categoryType) {
        productQuery.categoryType = req.query.categoryType;
        serviceQuery.categoryType = req.query.categoryType;
      }
      if (req.query.search) {
        let searchObject = {
          $or: [{ productName: { $regex: req.query.search, $options: "i" } }],
        };
        Object.assign(query, searchObject);
      }
      let productAgg = [
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
        { $match: productQuery },
        {
          $project: {
            _id: 1,
            productName: 1,
            productCategoryId: "$category_details",
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
          },
        },
        { $sort: { createdAt: -1 } },
      ];
      let serviceAgg = [
        {
          $lookup: {
            from: "Supplier",
            localField: "supplierId",
            foreignField: "_id",
            as: "supplier_details",
          },
        },
        {
          $unwind: {
            path: "$supplier_details",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $lookup: {
            from: "ProductCategory",
            localField: "productCategoryId",
            foreignField: "_id",
            as: "product_details",
          },
        },
        {
          $lookup: {
            from: "ProductSubCategory",
            localField: "productSubCategoryId",
            foreignField: "_id",
            as: "subcategory_details",
          },
        },
        // {
        //   $unwind: {
        //     path: "$product_details",
        //     preserveNullAndEmptyArrays: true,
        //   },
        // },
        {
          $project: {
            supplierId: 1,
            supplierName: "$supplier_details.founderName",
            supplierContact: "$supplier_details.contactNo",
            serviceName: 1,
            productCategoryId: "$product_details",
            productSubCategoryId: "$subcategory_details",
            serviceDescription: 1,
            timeToInitiateService: 1,
            typeOfService: 1,
            preRequisiteOffering: 1,
            relevantCertifications: 1,
            awardRecognition: 1,
            otherInformation: 1,
            customizationAvailable: 1,
            categoryType: 1,
            submitStatus: 1,
            serviceUniqId: 1,
            durationOfService: 1,
            keywords: 1,
            companyProfileImage: 1,
            serviceImage: 1,
            serviceImageThumbnail: 1,
            price: 1,
            status: 1,
            createdAt: 1,
            updatedAt: 1,
          },
        },
        {
          $match: serviceQuery,
        },
        {
          $sort: {
            createdAt: -1,
          },
        },
      ];
      const options = {
        page: page,
        limit: limit,
        allowDiskUse: true,
      };
      let myProductAggregate = productModel.aggregate(productAgg);
      const productResult = await productModel.aggregatePaginate(
        myProductAggregate,
        options
      );
      let myServiceAggregate = serviceModel.aggregate(serviceAgg);
      const resultService = await serviceModel.aggregatePaginate(
        myServiceAggregate,
        options
      );
      if (productResult.docs.length > 0 || resultService.docs.length > 0) {
        let productList = productResult.docs;
        let totalProductResult = productResult.totalDocs;
        let serviceList = resultService.docs;
        let totalServiceResult = resultService.totalDocs;
        if (productList.length > 0 || serviceList.length > 0) {
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
                 item.productImageThumbnail != undefined && item.productImageThumbnail.length > 0
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
                    for (
                      let i = 0;
                      i < item.uploadCertificateDetails.length;
                      i++
                    ) {
                      let uploadCertificateDetailsArr = [];

                      if (
                        item.uploadCertificateDetails[i].uploadCertificate !==
                          undefined &&
                        item.uploadCertificateDetails[i].uploadCertificate
                          .length > 0
                      ) {
                        for (
                          let j = 0;
                          j <
                          item.uploadCertificateDetails[i].uploadCertificate
                            .length;
                          j++
                        ) {
                          var fileExe = await Helper.getFileExtension(
                            item.uploadCertificateDetails[i].uploadCertificate[
                              j
                            ].imgName
                          );

                          uploadCertificateDetailsArr.push({
                            imgUrl:
                              process.env.IMAGE_URL +
                              "suppliers/" +
                              item.uploadCertificateDetails[i]
                                .uploadCertificate[j].imgName,
                            imgName:
                              item.uploadCertificateDetails[i]
                                .uploadCertificate[j].imgName,
                            _id: item.uploadCertificateDetails[i]
                              .uploadCertificate[j]._id,
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
                item.productCDSCORegistrationFiles && item
                  .productCDSCORegistrationFiles.length > 0
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
              if (Number(item.productQuantity) == 0) {
                item.stockAvailability = "Out Of Stock";
              } else {
                item.stockAvailability = "In Stock";
              }
              var ratingCountRes = await ReviewModel.find({
                productId: item._id,
              });
              var ratingCount = 0;
              await Promise.all(
                ratingCountRes.map(async (ele) => {
                  ele = JSON.parse(JSON.stringify(ele));
                  ratingCount = ele.rating + ratingCount;
                })
              );
              if (ratingCountRes.length) {
                item.ratings = Math.round(ratingCount / ratingCountRes.length); // web not show float value thats why round off
              } else {
                item.ratings = 0;
              }
              item.reviews = ratingCountRes.length;
            })
          );
          await Promise.all(
            serviceList.map(async (item) => {
              if (item.serviceImage.length > 0) {
                let serviceImage = [];
                for (let i = 0; i < item.serviceImage.length; i++) {
                  var fileExe = await Helper.getFileExtension(
                    item.serviceImage[i].imgName
                  );
                  serviceImage.push({
                    imgUrl:
                      process.env.IMAGE_URL +
                      "suppliers/" +
                      item.serviceImage[i].imgName,
                    imgName: item.serviceImage[i].imgName,
                    fileType: fileExe,
                  });
                }
                item.serviceImage = serviceImage;
              }
              if (item.companyProfileImage.length > 0) {
                let companyProfileImage = [];
                for (let i = 0; i < item.companyProfileImage.length; i++) {
                  var fileExe = await Helper.getFileExtension(
                    item.companyProfileImage[i].imgName
                  );
                  companyProfileImage.push({
                    imgUrl:
                      process.env.IMAGE_URL +
                      "suppliers/" +
                      item.companyProfileImage[i].imgName,
                    imgName: item.companyProfileImage[i].imgName,
                    fileType: fileExe,
                  });
                }
                item.companyProfileImage = companyProfileImage;
              }
            })
          );
          let resData = {
            productList: productList,
            serviceList: serviceList,
            totalProductResult: totalProductResult,
            totalServiceResult: totalServiceResult,
            limit: limit,
          };
          Helper.response(
            res,
            200,
            "Pending request fetched successfully.",
            resData
          );
        } else {
          Helper.response(
            res,
            CODES.STATUS_CODES.Not_Found,
            "Pending request fetched successfully.",
            {
              productList: [],
              serviceList: [],
            }
          );
        }
      } else {
        Helper.response(
          res,
          CODES.STATUS_CODES.Not_Found,
          "Pending request fetched successfully.",
          {
            productList: [],
            serviceList: [],
          }
        );
      }
    } catch (err) {
      console.log(err, "errrrrr");
      return Helper.response(res, 500, "Internal server error.");
    }
  },
  listOfApprovedProductService: async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit) : 25;
      const page = req.query.page ? parseInt(req.query.page) : 1;
      let productQuery = {
        supplierId: new ObjectId(req.params.supplierId),
        productStatus: { $nin: ["Delete","Inactive"] },
        "approvedStatus.isApproved": true,
        "cancelStatus.isCancel" : false,
        status: { $ne: "Cancel" },
      };
      let serviceQuery = {
        supplierId: new ObjectId(req.params.supplierId),
        status: "Active",
      };
      if (req.query.categoryType) {
        productQuery.categoryType = req.query.categoryType;
        serviceQuery.categoryType = req.query.categoryType;
      }
      if (req.query.search) {
        let searchObject = {
          $or: [{ productName: { $regex: req.query.search, $options: "i" } }],
        };
        Object.assign(query, searchObject);
      }
      let productAgg = [
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
        { $match: productQuery },
        {
          $project: {
            _id: 1,
            productName: 1,
            productCategoryId: "$category_details",
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
            noOfUnitSold: {$cond:{ if: "$noOfUnitSold",then:"$noOfUnitSold",else: 0}},
          },
        },
        { $sort: { createdAt: -1 } },
      ];
      let serviceAgg = [
        {
          $lookup: {
            from: "Supplier",
            localField: "supplierId",
            foreignField: "_id",
            as: "supplier_details",
          },
        },
        {
          $unwind: {
            path: "$supplier_details",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $lookup: {
            from: "ProductCategory",
            localField: "productCategoryId",
            foreignField: "_id",
            as: "product_details",
          },
        },
        // {
        //   $unwind: {
        //     path: "$product_details",
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
          $project: {
            supplierId: 1,
            supplierName: "$supplier_details.founderName",
            supplierContact: "$supplier_details.contactNo",
            serviceName: 1,
            productCategoryId: "$product_details",
            productSubCategoryId: "$subcategory_details",
            serviceDescription: 1,
            timeToInitiateService: 1,
            typeOfService: 1,
            customizationAvailable: 1,
            preRequisiteOffering: 1,
            relevantCertifications: 1,
            awardRecognition: 1,
            otherInformation: 1,
            categoryType: 1,
            submitStatus: 1,
            serviceUniqId: 1,
            durationOfService: 1,
            keywords: 1,
            companyProfileImage: 1,
            serviceImage: 1,
            price: 1,
            status: 1,
            createdAt: 1,
            updatedAt: 1,
          },
        },
        {
          $match: serviceQuery,
        },
        {
          $sort: {
            createdAt: -1,
          },
        },
      ];
      const options = {
        page: page,
        limit: limit,
        allowDiskUse: true,
      };
      let myProductAggregate = productModel.aggregate(productAgg);
      const productResult = await productModel.aggregatePaginate(
        myProductAggregate,
        options
      );
      let myServiceAggregate = serviceModel.aggregate(serviceAgg);
      const resultService = await serviceModel.aggregatePaginate(
        myServiceAggregate,
        options
      );
      if (productResult.docs.length > 0 || resultService.docs.length > 0) {
        let productList = productResult.docs;
        let totalProductResult = productResult.totalDocs;
        let serviceList = resultService.docs;
        let totalServiceResult = resultService.totalDocs;
        if (productList.length > 0 || serviceList.length > 0) {
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
                 item.productImageThumbnail != undefined && item.productImageThumbnail.length > 0
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
              if (Number(item.productQuantity) == 0) {
                item.stockAvailability = "Out Of Stock";
              } else {
                item.stockAvailability = "In Stock";
              }
              var ratingCountRes = await ReviewModel.find({
                productId: item._id,
              });
              var ratingCount = 0;
              await Promise.all(
                ratingCountRes.map(async (ele) => {
                  ele = JSON.parse(JSON.stringify(ele));
                  ratingCount = ele.rating + ratingCount;
                })
              );
              if (ratingCountRes.length) {
                item.ratings = Math.round(
                  ratingCount / ratingCountRes.length
                ); // web not show float value thats why round off
              } else {
                item.ratings = 0;
              }
              item.reviews = ratingCountRes.length;
            })
          );
          await Promise.all(
            serviceList.map(async (item) => {
              if (item.serviceImage.length > 0) {
                let serviceImage = [];
                for (let i = 0; i < item.serviceImage.length; i++) {
                  var fileExe = await Helper.getFileExtension(
                    item.serviceImage[i].imgName
                  );
                  serviceImage.push({
                    imgUrl:
                      process.env.IMAGE_URL +
                      "suppliers/" +
                      item.serviceImage[i].imgName,
                    imgName: item.serviceImage[i].imgName,
                    fileType: fileExe,
                  });
                }
                item.serviceImage = serviceImage;
              }
              if (
                item.serviceImageThumbnail != undefined && item.serviceImageThumbnail.length > 0
              ) {
                let serviceImageThumbnail = [];
                for (let i = 0; i < item.serviceImageThumbnail.length; i++) {
                  var fileExe = await Helper.getFileExtension(
                    item.serviceImageThumbnail[i].imgName
                  );
                  serviceImageThumbnail.push({
                    imgUrl:
                      process.env.IMAGE_URL +
                      "suppliers/" +
                      item.serviceImageThumbnail[i].imgName,
                    imgName: item.serviceImageThumbnail[i].imgName,
                    fileType: fileExe,
                  });
                }
                item.serviceImageThumbnail = serviceImageThumbnail;
              }
              if (item.companyProfileImage.length > 0) {
                let companyProfileImage = [];
                for (let i = 0; i < item.companyProfileImage.length; i++) {
                  var fileExe = await Helper.getFileExtension(
                    item.companyProfileImage[i].imgName
                  );
                  companyProfileImage.push({
                    imgUrl:
                      process.env.IMAGE_URL +
                      "suppliers/" +
                      item.companyProfileImage[i].imgName,
                    imgName: item.companyProfileImage[i].imgName,
                    fileType: fileExe,
                  });
                }
                item.companyProfileImage = companyProfileImage;
              }
               if (
                 item.relevantCertifications !== undefined &&
                 item.relevantCertifications.length > 0
               ) {
                 for (let i = 0; i < item.relevantCertifications.length; i++) {
                   let relevantCertificationsArr = [];

                   if (
                     item.relevantCertifications[i].uploadCertificate !==
                       undefined &&
                     item.relevantCertifications[i].uploadCertificate.length > 0
                   ) {
                     for (
                       let j = 0;
                       j <
                       item.relevantCertifications[i].uploadCertificate.length;
                       j++
                     ) {
                       var fileExe = await Helper.getFileExtension(
                         item.relevantCertifications[i].uploadCertificate[j]
                           .imgName
                       );

                       relevantCertificationsArr.push({
                         imgUrl:
                           process.env.IMAGE_URL +
                           "suppliers/" +
                           item.relevantCertifications[i].uploadCertificate[j]
                             .imgName,
                         imgName:
                           item.relevantCertifications[i].uploadCertificate[j]
                             .imgName,
                         _id: item.relevantCertifications[i].uploadCertificate[
                           j
                         ]._id,
                         fileType: fileExe,
                       });
                     }
                   }

                   item.relevantCertifications[i].uploadCertificate =
                     relevantCertificationsArr;
                 }
               }
            })
          );
          let resData = {
            productList: productList,
            serviceList: serviceList,
            totalProductResult: totalProductResult,
            totalServiceResult: totalServiceResult,
            limit: limit,
          };
          Helper.response(
            res,
            200,
            "Approved request fetched successfully.",
            resData
          );
        } else {
          Helper.response(
            res,
            CODES.STATUS_CODES.Not_Found,
            "Approved request fetched successfully.",
            {
              productList: [],
              serviceList: [],
            }
          );
        }
      } else {
        Helper.response(
          res,
          CODES.STATUS_CODES.Not_Found,
          "Pending request fetched successfully.",
          {
            productList: [],
            serviceList: [],
          }
        );
      }
    } catch (err) {
      console.log(err, "errrrrr");
      return Helper.response(res, 500, "Internal server error.");
    }
  },
  getAllCounts: async (req, res) => {
    try {
      var supplierId = req.params.supplierId;
      var checkSupplier = await supplierModel.findOne({ _id: supplierId });
      if (!checkSupplier) {
        return Helper.response(res, "404", "No data found");
      }
      var orderCount = await OrderDetailsModel.find({
        supplierId: supplierId,
        orderStatus: { $ne: "DELETED" },
      })
    const uniqueOrdersArray = _.uniqBy(orderCount, (order) =>
      order.primaryOrderId.toString()
    );
      var queryCount = await QueryChatModel.find({
        supplierId,
        status: { $ne: "Delete" },
      }).count();
      var pendingRequestCount = await productModel
        .find({
          supplierId,
          // "approvedStatus.isApproved": false,
          // status: { $in: ["Submitted", "Cancel"] },
          productStatus: { $in: ["Inactive", "Cancel"] },
        })
        .count();
      var pendingServiceCount = await serviceModel
        .find({
          supplierId,
          status: { $in: ["Inactive", "Cancel"] },
        })
        .count();
      var approvedRequestCount = await productModel
        .find({
          supplierId,
          productStatus: { $ne: "Delete" },
          "approvedStatus.isApproved": true,
        })
        .count();
      var approvedServiceCount = await serviceModel
        .find({
          supplierId,
          status: "Active",
        })
        .count();
      var pendingReqProductService = pendingRequestCount + pendingServiceCount;
      var approvedReqProductService =
        approvedRequestCount + approvedServiceCount;
      var resData = {
        orderCounts: uniqueOrdersArray.length,
        queryCounts: queryCount,
        pendingProductServiceCount: pendingReqProductService,
        approvedProductServiceCount: approvedReqProductService,
      };
      return Helper.response(res, "200", "Count data fetched", {
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
