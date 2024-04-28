const customerModel = require("../../../models/CustomerModel");
const Helper = require("../../../config/helper");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET;
const CODES = require("../../../config/status_codes/status_codes");
const ProductCategoryModel = require("../../../models/ProductCategoryModel");
const ServiceModel = require("../../../models/ServiceModel");
const ProductModel = require("../../../models/ProductModel");
const MSG = require("../../../config/language/Messages");
const BannerModel = require("../../../models/BannerModel");
const { logger } = require("../../../logger/winston");
const faqsModel = require("../../../models/FaqsModel");
const OrderModel = require("../../../models/OrderModel");
const QueryModel = require("../../../models/QueryModel");
const SupportModel = require("../../../models/SupportModel");
const CartModel = require("../../../models/CartModel");
const AchievementModel = require("../../../models/AchievementModel");
const WishlistModel = require("../../../models/WishListModel");
const ProductSubCategoryModel = require("../../../models/ProductSubCategoryModel");
const ReviewModel = require("../../../models/ReviewModel");
const customerMiddlewares = require("../../../middlewares/customerAuth");
const { ObjectId } = mongoose.Types;
module.exports = {
  categories: async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit) : 25;
      const page = req.query.page ? parseInt(req.query.page) : 1;
      var query = {
        categoryType: req.query.categoryType,
        productCategoryStatus: "Active",
      };
      if (req.query.productCategoryStatus) {
        query.productCategoryStatus = {
          $eq: req.query.productCategoryStatus,
        };
      }
      if (req.query.search) {
        let searchObject = {
          $or: [
            {
              productCategoryName: {
                $regex: req.query.search,
                $options: "i",
              },
            },
          ],
        };
        Object.assign(query, searchObject);
      }
      let agg = [
        {
          $match: query,
        },
        {
          $project: {
            _id: 1,
            productCategoryName: 1,
            productCategoryStatus: 1,
            productCategoryImage: 1,
            categoryType: 1,
            orderPosition: 1,
            createdAt: 1,
          },
        },
        {
          $sort: {
            orderPosition: 1,
          },
        },
      ];
      const options = {
        page: page,
        limit: limit,
        allowDiskUse: true,
      };
      let myAggregate = ProductCategoryModel.aggregate(agg);
      ProductCategoryModel.aggregatePaginate(
        myAggregate,
        options,
        async function (err, result) {
          if (err) {
            console.log(err, "<<<<,err");
            return Helper.response(res, 500, "Internal server error.", err);
          } else {
            if (result.docs.length > 0) {
              let categoryList = result.docs;
              let totalResult = result.totalDocs;

              await Promise.all(
                categoryList.map(async function (item) {
                  let productCategoryImageArr = [];
                  for (let i = 0; i < item.productCategoryImage.length; i++) {
                    var fileExe = await Helper.getFileExtension(
                      item.productCategoryImage[i]
                    );
                    productCategoryImageArr.push({
                      imgUrl:
                        process.env.IMAGE_URL +
                        "productCategory/" +
                        item.productCategoryImage[i],
                      imgName: item.productCategoryImage[i],
                      fileType: fileExe,
                    });
                  }
                  var productSubCategoryArr =
                    await ProductSubCategoryModel.find({
                      productCategoryId: item._id,
                      status: "Active",
                    });
                  item.productCategoryImage = productCategoryImageArr;
                  item.productSubCategory = productSubCategoryArr;
                })
              );
              let resData = {
                data: categoryList,
                totalResult: totalResult,
                limit: limit,
              };
              Helper.response(
                res,
                200,
                "Category list fetched successfully.",
                resData
              );
            } else {
              Helper.response(
                res,
                CODES.STATUS_CODES.Not_Found,
                "Category list fetched successfully.",
                {
                  data: [],
                }
              );
            }
          }
        }
      );
    } catch (err) {
      console.log(err);
      return Helper.response(res, 500, "Internal server error.");
    }
  },
  categorieWiseProduct: async (req, res) => {
    try {
      const { authorization } = req.headers;
      var query = {
        productCategoryStatus: "Active",
        categoryType: "Product",
      };
      var categoryDetails = await ProductCategoryModel.find(query, {
        productCategoryName: 1,
      }).lean();
      if (categoryDetails.length > 0) {
        await Promise.all(
          categoryDetails.map(async (category) => {
            var productDetailOnCategory = await ProductModel.find({
              productCategoryId: category._id,
              productStatus: "Active",
            });
            category.productDetails = productDetailOnCategory;
            category.totalProducts = productDetailOnCategory.length;
          })
        );
        await Promise.all(
          categoryDetails.map(async (item) => {
            let productFilesArr = [];
            await Promise.all(
              item.productDetails.map(async (productFiles) => {
                productFiles = JSON.parse(JSON.stringify(productFiles));
                if (productFiles.productImages.length > 0) {
                  let productImages = [];
                  for (let i = 0; i < productFiles.productImages.length; i++) {
                    var fileExe = await Helper.getFileExtension(
                      productFiles.productImages[i].imgName
                    );

                    productImages.push({
                      imgUrl:
                        process.env.IMAGE_URL +
                        "suppliers/" +
                        productFiles.productImages[i].imgName,
                      imgName: productFiles.productImages[i].imgName,
                      fileType: fileExe,
                    });
                  }
                  productFiles.productImages = productImages;
                }
                if (
                  productFiles.productImageThumbnail != undefined &&
                  productFiles.productImageThumbnail.length > 0
                ) {
                  let productImageThumbnail = [];
                  for (
                    let i = 0;
                    i < productFiles.productImageThumbnail.length;
                    i++
                  ) {
                    var fileExe = await Helper.getFileExtension(
                      productFiles.productImageThumbnail[i].imgName
                    );

                    productImageThumbnail.push({
                      imgUrl:
                        process.env.IMAGE_URL +
                        "suppliers/" +
                        productFiles.productImageThumbnail[i].imgName,
                      imgName: productFiles.productImageThumbnail[i].imgName,
                      fileType: fileExe,
                    });
                  }
                  productFiles.productImageThumbnail = productImageThumbnail;
                }
                if (
                  productFiles.productVideo != undefined &&
                  productFiles.productVideo.length > 0
                ) {
                  let productVideo = [];
                  for (let i = 0; i < productFiles.productVideo.length; i++) {
                    var fileExe = await Helper.getFileExtension(
                      productFiles.productVideo[i].imgName
                    );

                    productVideo.push({
                      imgUrl:
                        process.env.IMAGE_URL +
                        "suppliers/" +
                        productFiles.productVideo[i].imgName,
                      imgName: productFiles.productVideo[i].imgName,
                      fileType: fileExe,
                    });
                  }
                  productFiles.productVideo = productVideo;
                }
                if (
                  productFiles.uploadCertificateDetails !== undefined &&
                  productFiles.uploadCertificateDetails.length > 0
                ) {
                  for (
                    let i = 0;
                    i < productFiles.uploadCertificateDetails.length;
                    i++
                  ) {
                    let uploadCertificateDetailsArr = [];

                    if (
                      productFiles.uploadCertificateDetails[i]
                        .uploadCertificate !== undefined &&
                      productFiles.uploadCertificateDetails[i].uploadCertificate
                        .length > 0
                    ) {
                      for (
                        let j = 0;
                        j <
                        productFiles.uploadCertificateDetails[i]
                          .uploadCertificate.length;
                        j++
                      ) {
                        var fileExe = await Helper.getFileExtension(
                          productFiles.uploadCertificateDetails[i]
                            .uploadCertificate[j].imgName
                        );

                        uploadCertificateDetailsArr.push({
                          imgUrl:
                            process.env.IMAGE_URL +
                            "suppliers/" +
                            productFiles.uploadCertificateDetails[i]
                              .uploadCertificate[j].imgName,
                          imgName:
                            productFiles.uploadCertificateDetails[i]
                              .uploadCertificate[j].imgName,
                          _id: productFiles.uploadCertificateDetails[i]
                            .uploadCertificate[j]._id,
                          fileType: fileExe,
                        });
                      }
                    }

                    productFiles.uploadCertificateDetails[i].uploadCertificate =
                      uploadCertificateDetailsArr;
                  }
                }
                if (
                  productFiles.uploadProductBrochure != undefined &&
                  productFiles.uploadProductBrochure.length > 0
                ) {
                  let uploadProductBrochure = [];
                  for (
                    let i = 0;
                    i < productFiles.uploadProductBrochure.length;
                    i++
                  ) {
                    var fileExe = await Helper.getFileExtension(
                      productFiles.uploadProductBrochure[i].imgName
                    );

                    uploadProductBrochure.push({
                      imgUrl:
                        process.env.IMAGE_URL +
                        "suppliers/" +
                        productFiles.uploadProductBrochure[i].imgName,
                      imgName: productFiles.uploadProductBrochure[i].imgName,
                      fileType: fileExe,
                    });
                  }
                  productFiles.uploadProductBrochure = uploadProductBrochure;
                }
                if (
                  productFiles.productCDSCORegistrationFiles.length &&
                  productFiles.productCDSCORegistrationFiles.length > 0
                ) {
                  let productCDSCORegistrationFiles = [];
                  for (
                    let i = 0;
                    i < productFiles.productCDSCORegistrationFiles.length;
                    i++
                  ) {
                    var fileExe = await Helper.getFileExtension(
                      productFiles.productCDSCORegistrationFiles[i].imgName
                    );
                    productCDSCORegistrationFiles.push({
                      imgUrl:
                        process.env.IMAGE_URL +
                        "suppliers/" +
                        productFiles.productCDSCORegistrationFiles[i].imgName,
                      imgName:
                        productFiles.productCDSCORegistrationFiles[i].imgName,
                      fileType: fileExe,
                    });
                  }
                  productFiles.productCDSCORegistrationFiles =
                    productCDSCORegistrationFiles;
                }
                if (
                  productFiles.certificates &&
                  productFiles.certificates.length > 0
                ) {
                  let certificates = [];
                  for (let i = 0; i < productFiles.certificates.length; i++) {
                    var fileExe = await Helper.getFileExtension(
                      productFiles.certificates[i].imgName
                    );
                    certificates.push({
                      imgUrl:
                        process.env.IMAGE_URL +
                        "suppliers/" +
                        productFiles.certificates[i].imgName,
                      imgName: productFiles.certificates[i].imgName,
                      fileType: fileExe,
                    });
                  }
                  productFiles.certificates = certificates;
                }
                if (
                  productFiles.contractFiles &&
                  productFiles.contractFiles.length > 0
                ) {
                  let contractFiles = [];
                  for (let i = 0; i < productFiles.contractFiles.length; i++) {
                    var fileExe = await Helper.getFileExtension(
                      productFiles.contractFiles[i].imgName
                    );
                    contractFiles.push({
                      imgUrl:
                        process.env.IMAGE_URL +
                        "suppliers/" +
                        productFiles.contractFiles[i].imgName,
                      imgName: productFiles.contractFiles[i].imgName,
                      fileType: fileExe,
                    });
                  }
                  productFiles.contractFiles = contractFiles;
                }
                if (productFiles.status == "Submitted")
                  productFiles.status = "Pending";
                if (Number(productFiles.productQuantity) == 0) {
                  productFiles.stockAvailability = "Out Of Stock";
                } else {
                  productFiles.stockAvailability = "In Stock";
                }
                if (authorization != undefined) {
                  var data = await verifyToken(authorization);
                  var result = await WishlistModel.findOne({
                    customerId: new ObjectId(data),
                    productId: productFiles._id,
                  });
                  var checkCart = await CartModel.findOne({
                    customerId: new ObjectId(data),
                    productId: productFiles._id,
                  });
                  if (checkCart) {
                    productFiles.isCart = true;
                  } else {
                    productFiles.isCart = false;
                  }
                  if (result) {
                    productFiles.isWishListed = true;
                  } else {
                    productFiles.isWishListed = false;
                  }
                } else {
                  productFiles.isWishListed = false;
                  productFiles.isCart = false;
                }
                var ratingCountRes = await ReviewModel.find({
                  productId: productFiles._id,
                });
                var ratingCount = 0;
                await Promise.all(
                  ratingCountRes.map(async (ele) => {
                    ele = JSON.parse(JSON.stringify(ele));
                    ratingCount = ele.rating + ratingCount;
                  })
                );
                if (ratingCountRes.length) {
                  productFiles.ratings = Math.round(
                    ratingCount / ratingCountRes.length
                  ); // web not show float value thats why round off
                } else {
                  productFiles.ratings = 0;
                }
                productFiles.reviews = ratingCountRes.length;
                productFilesArr.push(productFiles);
              })
            );
            item.productDetails = productFilesArr;
          })
        );
      } else {
        Helper.response(
          res,
          CODES.STATUS_CODES.Not_Found,
          "No category added yet.",
          {
            productList: [],
          }
        );
      }
      let resData = {
        productList: categoryDetails,
      };
      Helper.response(res, 200, "Product list fetched successfully.", resData);
    } catch (err) {
      console.log(err);
      return Helper.response(res, 500, "Internal server error.");
    }
  },

  categorieWiseService: async (req, res) => {
    try {
      var query = {
        productCategoryStatus: "Active",
        categoryType: "Service",
      };
      var categoryDetails = await ProductCategoryModel.find(query, {
        productCategoryName: 1,
      }).lean();
      if (categoryDetails.length > 0) {
        await Promise.all(
          categoryDetails.map(async (category) => {
            var serviceDetailsOnCategory = await ServiceModel.find({
              productCategoryId: category._id,
              status: "Active",
            });
            category.serviceDetails = serviceDetailsOnCategory;
            category.totalProducts = serviceDetailsOnCategory.length;
          })
        );
        await Promise.all(
          categoryDetails.map(async (item) => {
            let serviceFleArr = [];
            await Promise.all(
              item.serviceDetails.map(async (serviceFile) => {
                serviceFile = JSON.parse(JSON.stringify(serviceFile));
                if (serviceFile.serviceImage.length > 0) {
                  let serviceImage = [];
                  for (let i = 0; i < serviceFile.serviceImage.length; i++) {
                    serviceImage.push({
                      imgUrl:
                        process.env.IMAGE_URL +
                        "suppliers/" +
                        serviceFile.serviceImage[i].imgName,
                      imgName: serviceFile.serviceImage[i].imgName,
                    });
                  }
                  serviceFile.serviceImage = serviceImage;
                }
                if (
                  serviceFile.serviceImageThumbnail != undefined &&
                  serviceFile.serviceImageThumbnail.length > 0
                ) {
                  let serviceImageThumbnail = [];
                  for (
                    let i = 0;
                    i < serviceFile.serviceImageThumbnail.length;
                    i++
                  ) {
                    serviceImageThumbnail.push({
                      imgUrl:
                        process.env.IMAGE_URL +
                        "suppliers/" +
                        serviceFile.serviceImageThumbnail[i].imgName,
                      imgName: serviceFile.serviceImageThumbnail[i].imgName,
                    });
                  }
                  serviceFile.serviceImageThumbnail = serviceImageThumbnail;
                }
                if (serviceFile.companyProfileImage.length > 0) {
                  let companyProfileImage = [];
                  for (
                    let i = 0;
                    i < serviceFile.companyProfileImage.length;
                    i++
                  ) {
                    companyProfileImage.push({
                      imgUrl:
                        process.env.IMAGE_URL +
                        "suppliers/" +
                        serviceFile.companyProfileImage[i].imgName,
                      imgName: serviceFile.companyProfileImage[i].imgName,
                    });
                  }
                  serviceFile.companyProfileImage = companyProfileImage;
                }
                if (
                  serviceFile.relevantCertifications !== undefined &&
                  serviceFile.relevantCertifications.length > 0
                ) {
                  for (
                    let i = 0;
                    i < serviceFile.relevantCertifications.length;
                    i++
                  ) {
                    let relevantCertificationsArr = [];

                    if (
                      serviceFile.relevantCertifications[i]
                        .uploadCertificate !== undefined &&
                      serviceFile.relevantCertifications[i].uploadCertificate
                        .length > 0
                    ) {
                      for (
                        let j = 0;
                        j <
                        serviceFile.relevantCertifications[i].uploadCertificate
                          .length;
                        j++
                      ) {
                        var fileExe = await Helper.getFileExtension(
                          serviceFile.relevantCertifications[i]
                            .uploadCertificate[j].imgName
                        );

                        relevantCertificationsArr.push({
                          imgUrl:
                            process.env.IMAGE_URL +
                            "suppliers/" +
                            serviceFile.relevantCertifications[i]
                              .uploadCertificate[j].imgName,
                          imgName:
                            serviceFile.relevantCertifications[i]
                              .uploadCertificate[j].imgName,
                          _id: serviceFile.relevantCertifications[i]
                            .uploadCertificate[j]._id,
                          fileType: fileExe,
                        });
                      }
                    }

                    serviceFile.relevantCertifications[i].uploadCertificate =
                      relevantCertificationsArr;
                  }
                }
                serviceFleArr.push(serviceFile);
              })
            );
            item.serviceDetails = serviceFleArr;
          })
        );
      } else {
        Helper.response(
          res,
          CODES.STATUS_CODES.Not_Found,
          "No category added yet.",
          {
            serviceList: [],
          }
        );
      }
      let resData = {
        serviceList: categoryDetails,
      };
      Helper.response(res, 200, "Service list fetched successfully.", resData);
    } catch (err) {
      console.log(err);
      return Helper.response(res, 500, "Internal server error.");
    }
  },
  viewProduct: async (req, res) => {
    try {
      const { authorization } = req.headers;
      const limit = req.query.limit ? parseInt(req.query.limit) : 25;
      const page = req.query.page ? parseInt(req.query.page) : 1;
      var query = {
        productStatus: "Active",
      };
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
      // Add filtering for price range
      if (req.query.minPrice && req.query.maxPrice) {
        query.productPrice = {
          $gte: parseFloat(req.query.minPrice),
          $lte: parseFloat(req.query.maxPrice),
        };
      }
      // Add filtering for availability of product
      if (req.query.availability == "1") {
        query.productQuantity = {
          $ne: "0",
        };
      }
      let sortOption = {};

      if (req.query.sortBy === "alphabetical") {
        sortOption = {
          productNameUpper: 1,
        };
      } else if (req.query.sortBy === "priceLowToHigh") {
        sortOption = {
          productPrice: 1,
        };
      } else if (req.query.sortBy === "priceHighToLow") {
        sortOption = {
          productPrice: -1,
        };
      } else {
        // Default sorting by createdAt in descending order
        sortOption = {
          createdAt: 1,
        };
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
              productNameForListing: {
                $regex: req.query.search,
                $options: "i",
              },
            },
            {
              keywords: {
                $regex: req.query.search,
                $options: "i",
              },
            },
          ],
        };
        Object.assign(query, searchObject);
      }
      let query2 = {};
      if (req.query.ratings) {
        let ratings = req.query.ratings;
        var rateData = ratings.split(",");
        let rateArr = [];
        rateData.forEach((rate) => {
          rateArr.push(Number(rate));
        });
        query2.averageRating = { $in: rateArr };
      }
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
          $lookup: {
            from: "Review",
            localField: "_id",
            foreignField: "productId",
            as: "reviewDetails",
          },
        },
        { $match: query },
        {
          $project: {
            _id: "$_id",
            productName: "$productName",
            productNameUpper: { $toUpper: "$productName" },
            productCategoryId: "$productCategoryId",
            productCategory: "$category_details.productCategoryName",
            productSubCategory: "$subcategory_details.subCategoryName",
            productSubCategoryId: "$productSubCategoryId",
            productNameForListing: "$productNameForListing",
            keywords: "$keywords",
            productImages: "$productImages",
            productImageThumbnail: "$productImageThumbnail",
            productCDSCORegistrationFiles: "$productCDSCORegistrationFiles",
            productClassifications: "$productClassifications_details",
            supplierName: "$supplierDetails.basicInfo.founderName",
            supplierId: "$supplierId",
            productDimensions: "$productDimensions",
            productDescription: "$productDescription",
            certificates: "$certificates",
            contractFiles: "$contractFiles",
            productPrice: "$productPrice",
            priceByAdmin: "$priceByAdmin",
            productMinDelivery: "$productMinDelivery",
            productDeliveryPreference: "$productDeliveryPreference",
            productPaymentMode: "$productPaymentMode",
            isFullPayment: "$isFullPayment",
            isPartPayment: "$isPartPayment",
            partPayment: "$partPayment",
            installments: "$installments",
            shipmentType: "$shipmentType",
            createdAt: "$createdAt",
            status: "$status",
            productStatus: "$productStatus",
            submitStatus: "$submitStatus",
            approvedStatus: "$approvedStatus",
            cancelStatus: "$cancelStatus",
            contractStatus: "$contractStatus",
            commisionAddedByAdmin: "$commisionAddedByAdmin",
            productCode: "$productCode",
            productWeight: "$productWeight",
            isDemo: "$isDemo",
            typeOfDemo: "$typeOfDemo",
            categoryType: "$categoryType",
            productQuantity: "$productQuantity",
            productUniqueId: "$productUniqueId",
            sku: "$sku",
            hsnNo: "$hsnNo",
            uploadProductBrochure: "$uploadProductBrochure",
            uploadCertificateDetails: "$uploadCertificateDetails",
            // reviewDetails: "$reviewDetails",
            averageRating: {
              $cond: {
                if: { $eq: [{ $size: "$reviewDetails" }, 0] },
                then: 0,
                else: { $toInt: { $avg: "$reviewDetails.rating" } },
              },
            },
          },
        },
        { $match: query2 },
        { $sort: sortOption },
      ];
      const options = {
        page: page,
        limit: limit,
        allowDiskUse: true,
      };
      logger.info("agg......query", JSON.stringify(agg));
      let myAggregate = ProductModel.aggregate(agg);
      console.log({
        myAggregate,
      });

      const result = await ProductModel.aggregatePaginate(myAggregate, options);
      console.log({
        result,
      });

      if (result.docs.length > 0) {
        let productList = result.docs;
        let totalResult = result.totalDocs;
        if (productList.length > 0) {
          await Promise.all(
            productList.map(async (productFiles) => {
              if (productFiles.productImages.length > 0) {
                let productImages = [];
                for (let i = 0; i < productFiles.productImages.length; i++) {
                  var fileExe = await Helper.getFileExtension(
                    productFiles.productImages[i].imgName
                  );

                  productImages.push({
                    imgUrl:
                      process.env.IMAGE_URL +
                      "suppliers/" +
                      productFiles.productImages[i].imgName,
                    imgName: productFiles.productImages[i].imgName,
                    fileType: fileExe,
                  });
                }
                productFiles.productImages = productImages;
              }
              if (
                productFiles.productImageThumbnail != undefined &&
                productFiles.productImageThumbnail.length > 0
              ) {
                let productImageThumbnail = [];
                for (
                  let i = 0;
                  i < productFiles.productImageThumbnail.length;
                  i++
                ) {
                  var fileExe = await Helper.getFileExtension(
                    productFiles.productImageThumbnail[i].imgName
                  );

                  productImageThumbnail.push({
                    imgUrl:
                      process.env.IMAGE_URL +
                      "suppliers/" +
                      productFiles.productImageThumbnail[i].imgName,
                    imgName: productFiles.productImageThumbnail[i].imgName,
                    fileType: fileExe,
                  });
                }
                productFiles.productImageThumbnail = productImageThumbnail;
              }
              if (
                productFiles.uploadCertificateDetails !== undefined &&
                productFiles.uploadCertificateDetails.length > 0
              ) {
                for (
                  let i = 0;
                  i < productFiles.uploadCertificateDetails.length;
                  i++
                ) {
                  let uploadCertificateDetailsArr = [];

                  if (
                    productFiles.uploadCertificateDetails[i]
                      .uploadCertificate !== undefined &&
                    productFiles.uploadCertificateDetails[i].uploadCertificate
                      .length > 0
                  ) {
                    for (
                      let j = 0;
                      j <
                      productFiles.uploadCertificateDetails[i].uploadCertificate
                        .length;
                      j++
                    ) {
                      var fileExe = await Helper.getFileExtension(
                        productFiles.uploadCertificateDetails[i]
                          .uploadCertificate[j].imgName
                      );

                      uploadCertificateDetailsArr.push({
                        imgUrl:
                          process.env.IMAGE_URL +
                          "suppliers/" +
                          productFiles.uploadCertificateDetails[i]
                            .uploadCertificate[j].imgName,
                        imgName:
                          productFiles.uploadCertificateDetails[i]
                            .uploadCertificate[j].imgName,
                        _id: productFiles.uploadCertificateDetails[i]
                          .uploadCertificate[j]._id,
                        fileType: fileExe,
                      });
                    }
                  }

                  productFiles.uploadCertificateDetails[i].uploadCertificate =
                    uploadCertificateDetailsArr;
                }
              }
              if (
                productFiles.uploadProductBrochure != undefined &&
                productFiles.uploadProductBrochure.length > 0
              ) {
                let uploadProductBrochure = [];
                for (
                  let i = 0;
                  i < productFiles.uploadProductBrochure.length;
                  i++
                ) {
                  var fileExe = await Helper.getFileExtension(
                    productFiles.uploadProductBrochure[i].imgName
                  );

                  uploadProductBrochure.push({
                    imgUrl:
                      process.env.IMAGE_URL +
                      "suppliers/" +
                      productFiles.uploadProductBrochure[i].imgName,
                    imgName: productFiles.uploadProductBrochure[i].imgName,
                    fileType: fileExe,
                  });
                }
                productFiles.uploadProductBrochure = uploadProductBrochure;
              }
              if (
                productFiles.productVideo != undefined &&
                productFiles.productVideo.length > 0
              ) {
                let productVideo = [];
                for (let i = 0; i < productFiles.productVideo.length; i++) {
                  var fileExe = await Helper.getFileExtension(
                    productFiles.productVideo[i].imgName
                  );

                  productVideo.push({
                    imgUrl:
                      process.env.IMAGE_URL +
                      "suppliers/" +
                      productFiles.productVideo[i].imgName,
                    imgName: productFiles.productVideo[i].imgName,
                    fileType: fileExe,
                  });
                }
                productFiles.productVideo = productVideo;
              }
              if (
                productFiles.productCDSCORegistrationFiles &&
                productFiles.productCDSCORegistrationFiles.length > 0
              ) {
                let productCDSCORegistrationFiles = [];
                for (
                  let i = 0;
                  i < productFiles.productCDSCORegistrationFiles.length;
                  i++
                ) {
                  var fileExe = await Helper.getFileExtension(
                    productFiles.productCDSCORegistrationFiles[i].imgName
                  );
                  productCDSCORegistrationFiles.push({
                    imgUrl:
                      process.env.IMAGE_URL +
                      "suppliers/" +
                      productFiles.productCDSCORegistrationFiles[i].imgName,
                    imgName:
                      productFiles.productCDSCORegistrationFiles[i].imgName,
                    fileType: fileExe,
                  });
                }
                productFiles.productCDSCORegistrationFiles =
                  productCDSCORegistrationFiles;
              }
              if (
                productFiles.certificates &&
                productFiles.certificates.length > 0
              ) {
                let certificates = [];
                for (let i = 0; i < productFiles.certificates.length; i++) {
                  var fileExe = await Helper.getFileExtension(
                    productFiles.certificates[i].imgName
                  );
                  certificates.push({
                    imgUrl:
                      process.env.IMAGE_URL +
                      "suppliers/" +
                      productFiles.certificates[i].imgName,
                    imgName: productFiles.certificates[i].imgName,
                    fileType: fileExe,
                  });
                }
                productFiles.certificates = certificates;
              }
              if (
                productFiles.contractFiles &&
                productFiles.contractFiles.length > 0
              ) {
                let contractFiles = [];
                for (let i = 0; i < productFiles.contractFiles.length; i++) {
                  var fileExe = await Helper.getFileExtension(
                    productFiles.contractFiles[i].imgName
                  );
                  contractFiles.push({
                    imgUrl:
                      process.env.IMAGE_URL +
                      "suppliers/" +
                      productFiles.contractFiles[i].imgName,
                    imgName: productFiles.contractFiles[i].imgName,
                    fileType: fileExe,
                  });
                }
                productFiles.contractFiles = contractFiles;
              }
              if (productFiles.status == "Submitted")
                productFiles.status = "Pending";
              if (Number(productFiles.productQuantity) == 0) {
                productFiles.stockAvailability = "Out Of Stock";
              } else {
                productFiles.stockAvailability = "In Stock";
              }
              if (authorization != undefined) {
                var data = await verifyToken(authorization);
                var result = await WishlistModel.findOne({
                  customerId: new ObjectId(data),
                  productId: productFiles._id,
                });
                var checkCart = await CartModel.findOne({
                  customerId: new ObjectId(data),
                  productId: productFiles._id,
                });
                if (checkCart) {
                  productFiles.isCart = true;
                } else {
                  productFiles.isCart = false;
                }
                if (result) {
                  productFiles.isWishListed = true;
                } else {
                  productFiles.isWishListed = false;
                }
              } else {
                productFiles.isWishListed = false;
                productFiles.isCart = false;
                productFiles.isCart = false;
              }
              var ratingCountRes = await ReviewModel.find({
                productId: productFiles._id,
              });
              var ratingCount = 0;
              await Promise.all(
                ratingCountRes.map(async (ele) => {
                  ele = JSON.parse(JSON.stringify(ele));
                  ratingCount = ele.rating + ratingCount;
                })
              );
              if (ratingCountRes.length) {
                productFiles.ratings = Math.round(
                  ratingCount / ratingCountRes.length
                ); // web not show float value thats why round off
              } else {
                productFiles.ratings = 0;
              }
              productFiles.reviews = ratingCountRes.length;
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
      console.log(err);
      return Helper.response(res, 500, "Internal server error.");
    }
  },
  viewService: async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit) : 25;
      const page = req.query.page ? parseInt(req.query.page) : 1;
      var query = {
        status: "Active",
      };
      // if (req.query.productCategoryIds) {
      //   let ServiceCategoryIds = req.query.productCategoryIds;
      //   var ServiceCatId = ServiceCategoryIds.split(",");
      //   var arrayCatId = [];
      //   ServiceCatId.forEach((id) => {
      //     arrayCatId.push(new ObjectId(id));
      //   });

      //   query.productCategoryId = {
      //     $in: arrayCatId,
      //   };
      // }
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
      // Add filtering for price range
      if (req.query.minPrice && req.query.maxPrice) {
        query.price = {
          $gte: parseFloat(req.query.minPrice),
          $lte: parseFloat(req.query.maxPrice),
        };
      }
      let sortOption = {};

      if (req.query.sortBy === "alphabetical") {
        sortOption = {
          serviceNameUpper: 1,
        };
      } else if (req.query.sortBy === "priceLowToHigh") {
        sortOption = {
          price: 1,
        };
      } else if (req.query.sortBy === "priceHighToLow") {
        sortOption = {
          price: -1,
        };
      } else {
        // Default sorting by createdAt in descending order
        sortOption = {
          createdAt: 1,
        };
      }
      if (req.query.search) {
        const searchObject = {
          $or: [
            {
              serviceName: {
                $regex: req.query.search,
                $options: "i",
              },
            },
            {
              keywords: {
                $regex: req.query.search,
                $options: "i",
              },
            },
            {
              serviceUniqId: {
                $regex: req.query.search,
                $options: "i",
              },
            },
            {
              supplierName: {
                $regex: req.query.search,
                $options: "i",
              },
            },
            {
              supplierContact: {
                $regex: req.query.search,
                $options: "i",
              },
            },
            {
              "product_details.productCategoryName": {
                $regex: req.query.search,
                $options: "i",
              },
            },
          ],
        };
        Object.assign(query, searchObject);
      }
      console.log(query, "query.......");
      let agg = [
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
          $match: query,
        },
        {
          $project: {
            supplierId: 1,
            supplierName: "$supplier_details.basicInfo.founderName",
            supplierContact: "$supplier_details.basicInfo.contactNo",
            productCategoryId: 1,
            productCategory: "$product_details.productCategoryName",
            productSubCategoryId: 1,
            productSubCategory: "$subcategory_details.subCategoryName",
            serviceName: 1,
            serviceNameUpper: { $toUpper: "$serviceName" },
            serviceDescription: 1,
            timeToInitiateService: 1,
            typeOfService: 1,
            customizationAvailable: 1,
            preRequisiteOffering: 1,
            relevantCertifications: 1,
            awardRecognition: 1,
            otherInformation: 1,
            categoryType: 1,
            durationOfService: 1,
            keywords: 1,
            serviceImage: 1,
            companyProfileImage: 1,
            serviceUniqId: 1,
            price: 1,
            submitStatus: 1,
            status: 1,
            createdAt: 1,
            updatedAt: 1,
          },
        },
        {
          $sort: sortOption,
        },
      ];
      const options = {
        page: page,
        limit: limit,
        allowDiskUse: true,
      };

      logger.info("agg......query", JSON.stringify(agg));
      console.log("agg......query", JSON.stringify(agg), "vvvvvvv");
      let myAggregate = ServiceModel.aggregate(agg);
      console.log({
        myAggregate,
      });

      const result = await ServiceModel.aggregatePaginate(myAggregate, options);
      if (result.docs.length > 0) {
        let ServiceList = result.docs;
        let totalResult = result.totalDocs;
        if (ServiceList.length > 0) {
          await Promise.all(
            ServiceList.map(async (item) => {
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
                item.serviceImageThumbnail != undefined &&
                item.serviceImageThumbnail.length > 0
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
                        _id: item.relevantCertifications[i].uploadCertificate[j]
                          ._id,
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
            ServiceList: ServiceList,
            totalResult: totalResult,
            limit: limit,
          };
          Helper.response(
            res,
            200,
            "Service list fetched successfully.",
            resData
          );
        } else {
          Helper.response(
            res,
            CODES.STATUS_CODES.Not_Found,
            "Service list fetched successfully.",
            {
              ServiceList: [],
            }
          );
        }
      } else {
        Helper.response(
          res,
          CODES.STATUS_CODES.Not_Found,
          "Service list fetched successfully.",
          {
            ServiceList: [],
          }
        );
      }
    } catch (err) {
      console.log(err);
      return Helper.response(res, 500, "Internal server error.");
    }
  },
  bannerListing: async (req, res) => {
    try {
      const result = await BannerModel.find(
        {
          status: "Active",
        },
        {
          isPrimary: 1,
          status: 1,
          adminId: 1,
          title: 1,
          description: 1,
          bannerImgName: 1,
        }
      )
        .sort({
          createdAt: -1,
        })
        // .sort({ isPrimary: -1 })
        .lean();
      if (result.length > 0) {
        await Promise.all(
          result.map(async (item) => {
            item.imgUrl =
              process.env.IMAGE_URL + "bannerManagement/" + item.bannerImgName;
          })
        );

        return Helper.response(res, "200", "List fetched successfully", {
          bannerList: result,
        });
      } else {
        return Helper.response(res, "404", "Not found", {
          bannerList: [],
        });
      }
    } catch (error) {
      console.error(error);
      Helper.response(
        res,
        CODES.STATUS_CODES.Internal_Server_Error,
        MSG.serverError[LOCALE || "en"]
      );
    }
  },
  getAllFaq: (req, res) => {
    const query = {
      status: "Active",
    };
    const col = {
      _id: 1,
      faqId: "$_id",
      faqArr: 1,
      title: 1,
      orderPosition: 1,
      status: 1,
    }; //,'updatedDate': -1
    faqsModel
      .paginate(query, {
        sort: {
          orderPosition: 1,
        },
        select: col,
      })
      .then((result) => {
        let faqList = result.docs;
        if (faqList.length > 0) {
          let resData = {
            faqList: faqList,
          };
          return Helper.response(
            res,
            200,
            "FAQ list fetched successfully",
            resData
          );
        } else {
          return Helper.response(res, 404, "No data found", {
            faqList: [],
          });
        }
      })
      .catch((err) => {
        console.log(err);
        Helper.response(res, 500, "Internal Server Error");
      });
  },
  getAllCounts: async (req, res) => {
    try {
      var customerId = req.params.customerId;
      var checkCustomer = await customerModel.findOne({
        _id: customerId,
      });
      if (!checkCustomer) {
        return Helper.response(res, "404", "No data found");
      }
      var orderCount = await OrderModel.find({
        customerId,
        orderStatus: {
          $ne: "DELETED",
        },
      }).count();
      var queryCount = await QueryModel.find({
        customerId,
        status: {
          $ne: "Delete",
        },
      }).count();
      var cartCount = await CartModel.find({
        customerId,
        status: {
          $ne: "Delete",
        },
      }).count();
      var wishlistCounts = await WishlistModel.find({
        customerId,
        status: {
          $ne: "Delete",
        },
      }).count();
      var resData = {
        orderCounts: orderCount,
        queryCounts: queryCount,
        cartCounts: cartCount,
        wishlistCounts: wishlistCounts,
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
  getAllAchievement: (req, res) => {
    const query = {
      status: "Active",
    };
    const col = {
      _id: 1,
      achievementId: "$_id",
      states: 1,
      innovationsListed: 1,
      sales: 1,
      providers: 1,
      status: 1,
      createdAt: 1,
      uodatedAt: 1,
    }; //,'updatedDate': -1
    AchievementModel.paginate(query, {
      sort: {
        createdAt: -1,
      },
      select: col,
    })
      .then((result) => {
        let achievementList = result.docs;
        if (achievementList.length > 0) {
          let resData = {
            achievementList: achievementList,
          };
          return Helper.response(
            res,
            CODES.STATUS_CODES.OK,
            "Achievement list fetched successfully",
            resData
          );
        } else {
          return Helper.response(res, 404, "No data found", {
            faqList: [],
          });
        }
      })
      .catch((err) => {
        Helper.response(
          res,
          CODES.STATUS_CODES.Internal_Server_Error,
          MSG.api.fail[LOCALE || "en"]
        );
      });
  },
  addSupport: async (req, res) => {
    try {
      const support = new SupportModel(req.body);
      const saveSupport = await support.save();

      if (saveSupport) {
        return Helper.response(
          res,
          CODES.STATUS_CODES.OK,
          "Support added successfully"
        );
      } else {
        return Helper.response(
          res,
          CODES.STATUS_CODES.Internal_Server_Error,
          MSG.api.fail[LOCALE]
        );
      }
    } catch (error) {
      logger.error(error);
      console.log(error);
      return Helper.response(
        res,
        CODES.STATUS_CODES.Internal_Server_Error,
        MSG.api.fail[LOCALE]
      );
    }
  },
  searchSuggestion: async (req, res) => {
    try {
      const query1 = {};
      const query2 = {};
      let serviceData = [];
      let productSuggestionData = [];
      console.log(req.query.categoryType, req.query.search, "ggggg");
      if (
        req.query.categoryType === "Product" ||
        req.query.categoryType === "All"
      ) {
        query1.productStatus = "Active";
        if (req.query.search) {
          const searchObject = {
            $or: [
              { productName: { $regex: req.query.search, $options: "i" } },
              {
                keywords: {
                  $regex: req.query.search,
                  $options: "i",
                },
              },
            ],
          };
          Object.assign(query1, searchObject);
        }
        productSuggestionData = await ProductModel.find(query1, {
          productName: 1,
          keywords: 1,
          categoryType: 1,
        });
      }

      if (
        req.query.categoryType === "Service" ||
        req.query.categoryType === "All"
      ) {
        query2.status = "Active";
        if (req.query.search) {
          const searchObject = {
            $or: [
              { serviceName: { $regex: req.query.search, $options: "i" } },
              {
                keywords: {
                  $regex: req.query.search,
                  $options: "i",
                },
              },
            ],
          };
          Object.assign(query2, searchObject);
        }
        serviceData = await ServiceModel.find(query2, {
          serviceName: 1,
          categoryType: 1,
          keywords: 1,
        });
      }

      const combineData = [...productSuggestionData, ...serviceData];
      Helper.response(res, 200, "Product list fetched successfully.", {
        productList: combineData,
      });
    } catch (err) {
      console.error(err);
      Helper.response(res, 500, "Internal server error.");
    }
  },
};
async function verifyToken(authorization) {
  if (!authorization) {
    return Helper.response(res, 401, "you must be logged in");
  }
  const token = authorization;
  var userId;
  jwt.verify(token, JWT_SECRET, (err, payload) => {
    console.log(err);
    // return false;
    if (err) {
      console.log("you must be logged in");
    }
    const { _id } = payload;
    userId = _id;
  });
  return userId;
}
