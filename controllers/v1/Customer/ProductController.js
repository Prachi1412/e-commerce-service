const mongoose = require("mongoose");
const { ObjectId } = mongoose.Types;
const Helper = require("../../../config/helper");
const {
  getSyncSignedUrl,
  getSyncSignedProdUrl,
} = require("../../../lib/s3-services");
const productImage = Helper.upload_space("products").single("productImages");
const customerModel = require("../../../models/CustomerModel");
const productModel = require("../../../models/ProductModel");
const cartModel = require("../../../models/CartModel");
const ReviewModel = require("../../../models/ReviewModel");
const logisticsModel = require("../../../models/LogisticsModel");
const discountModel = require("../../../models/DiscountModel");
const WishlistModel = require("../../../models/WishListModel");
const RecentlyVeiwedModel = require("../../../models/RecentlyVeiwedModel");
const CODES = require("../../../config/status_codes/status_codes");
const MSG = require("../../../config/language/Messages");
var _ = require("lodash");
const ServiceModel = require("../../../models/ServiceModel");

module.exports = {
  addCart: async (req, res) => {
    try {
      const { productId, quantity, price } = req.body;
      const customerId = req.user._id;
      var productObj = {
        customerId,
        productId,
        quantity,
        price,
      };
      const product = await productModel.findOne({ _id: productId });
      if (!product) {
        // If the product does not exist, return an error response
        return Helper.response(res, 404, "Product not found!", {
          productList: [],
        });
      } else {
        // Check if the product is already in the cart collection

        const cartItem = await cartModel.findOne({ customerId, productId });

        if (cartItem) {
          // If the product is already in the cart collection, update the quantity
          var result = await cartModel.findOneAndUpdate(
            { customerId, productId },
            { $set: { quantity: quantity, price: price } },
            { new: true, useFindAndModify: false }
          );
          return Helper.response(res, 200, "Product added to cart", {
            result: result,
          });
        } else {
          // If the product is not in the cart collection, insert a new document
          const checkCusCount = await cartModel.find({ customerId }).count();
          if (checkCusCount == process.env.CARTLIMIT) {
            return Helper.response(res, 404, "You can add only 10 products.");
          }
          const cart = new cartModel(productObj);
          cart
            .save()
            .then(async (result) => {
              if (result) {
                return Helper.response(res, 200, "Product added to cart.", {
                  result: result,
                });
              }
            })
            .catch((error) => {
              res.status(400).json({ error: error });
            });
        }
      }
    } catch (err) {
      console.log(err);
      return Helper.response(res, 500, "Server error.", err);
    }
  },
  deleteCart: async (req, res) => {
    try {
      const cartId = req.params.id;
      const isCheck = await cartModel.findOne({ _id: cartId });
      if (isCheck) {
        await cartModel.findOneAndDelete({ _id: cartId });
        return Helper.response(res, 200, "Cart item removed successfully");
      } else {
        return Helper.response(res, 402, "Incorrect cart id.");
      }
    } catch (error) {
      console.log(error, "error");
      return Helper.response(res, 500, "Server error.", error);
    }
  },
  getCartDetails: async (req, res) => {
    const limit = req.query.limit ? parseInt(req.query.limit) : 15;
    const page = req.query.page ? parseInt(req.query.page) : 1;
    const query = { status: { $ne: "Delete" } };
    const customerId = req.user._id;
    const discountStatus = req.user.isDiscount;
    var isShipping = await logisticsModel.findOne({}, { amount: 1 });
    var isDiscount = await discountModel.findOne({}, { amount: 1 });
    let agg = [
      { $match: { customerId: customerId } },
      {
        $lookup: {
          from: "Product",
          localField: "productId",
          foreignField: "_id",
          as: "productDetails",
        },
      },
      { $unwind: "$productDetails" },
      {
        $lookup: {
          from: "Supplier",
          localField: "productDetails.supplierId",
          foreignField: "_id",
          as: "supplierDetail",
        },
      },
      { $unwind: "$supplierDetail" },
      { $match: query },
      {
        $project: {
          quantity: 1,
          status: 1,
          price: 1,
          productDetails: {
            $mergeObjects: [
              "$productDetails",
              { pickup_postcode: "$supplierDetail.address.pinCode" },
            ],
          },
        },
      },
    ];

    const options = {
      page: page,
      limit: limit,
      allowDiskUse: true,
    };
    let myAggregate = cartModel.aggregate(agg);
    cartModel.aggregatePaginate(
      myAggregate,
      options,
      async function (err, result) {
        if (err) {
          console.log(err, "err");
          return Helper.response(res, 500, "Internal server error.");
        } else {
          if (result.docs.length > 0) {
            let cartItems = result.docs;
            let totalResult = result.totalDocs;
            if (cartItems.length > 0) {
              await Promise.all(
                cartItems.map(async function (item) {
                  if (item.productDetails.productImages.length > 0) {
                    let productImages = [];
                    for (
                      let i = 0;
                      i < item.productDetails.productImages.length;
                      i++
                    ) {
                      productImages.push({
                        imgUrl:
                          process.env.IMAGE_URL +
                          "suppliers/" +
                          item.productDetails.productImages[i].imgName,
                      });
                    }
                    item.productDetails.productImages = productImages;
                  }
                  if (
                    item.productDetails.productImageThumbnail != undefined &&
                    item.productDetails.productImageThumbnail.length > 0
                  ) {
                    let productImageThumbnail = [];
                    for (
                      let i = 0;
                      i < item.productDetails.productImageThumbnail.length;
                      i++
                    ) {
                      productImageThumbnail.push({
                        imgUrl:
                          process.env.IMAGE_URL +
                          "suppliers/" +
                          item.productDetails.productImageThumbnail[i].imgName,
                      });
                    }
                    item.productDetails.productImageThumbnail =
                      productImageThumbnail;
                  }
                  var ratingCountRes = await ReviewModel.find({
                    productId: item.productDetails._id,
                  });
                  var ratingCount = 0;
                  await Promise.all(
                    ratingCountRes.map(async (ele) => {
                      ele = JSON.parse(JSON.stringify(ele));
                      ratingCount = ele.rating + ratingCount;
                    })
                  );
                  if (ratingCountRes.length) {
                    item.productDetails.ratings = Math.round(
                      ratingCount / ratingCountRes.length
                    ); // web not show float value thats why round off
                  } else {
                    item.productDetails.ratings = 0;
                  }
                  var result = await WishlistModel.findOne({
                    customerId: req.user._id,
                    productId: item.productDetails._id,
                  });

                  if (result) {
                    item.productDetails.isWishListed = true;
                  } else {
                    item.productDetails.isWishListed = false;
                  }
                  item.productDetails.reviews = ratingCountRes.length;
                  // delete item.rating;
                  // item.totalPrice = item.price.toString();
                  // delete item.price;
                })
              );

              let resData = {
                cartList: cartItems,
                totalResult: totalResult,
                limit: limit,
                deliveryCharges: isShipping ? isShipping.amount : 0,
                discount: isDiscount ? isDiscount.amount : 0,
                isDiscount: discountStatus,
              };
              return Helper.response(
                res,
                200,
                "Cart details fetched successfully..",
                resData
              );
            } else {
              return Helper.response(res, 200, "Cart is empty!", {
                cartList: [],
              });
            }
          } else {
            Helper.response(res, 200, "Cart is empty!", { cartList: [] });
          }
        }
      }
    );
  },
  singleProduct: async (req, res) => {
    try {
      let query = {
        _id: new ObjectId(req.params.productId),
        status: { $ne: "Delete" },
      };
      let agg = [
        {
          $lookup: {
            from: "ProductCategory",
            localField: "productCategoryId",
            foreignField: "_id",
            as: "category_details",
          },
        },
        {
          $unwind: {
            path: "$category_details",
            preserveNullAndEmptyArrays: true,
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
        {
          $lookup: {
            from: "ProductClassification",
            localField: "productClassifications",
            foreignField: "_id",
            as: "productClassifications_details",
          },
        },
        {
          $unwind: {
            path: "$productClassifications_details",
            preserveNullAndEmptyArrays: true,
          },
        },
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
        { $match: query },
        {
          $project: {
            _id: 1,
            productName: 1,
            productCategoryId: "$category_details",
            productSubCategoryId: "$subcategory_details",
            productClassifications: "$productClassifications_details",
            supplierName: "$supplierDetails.basicInfo.founderName",
            supplierPincode: "$supplierDetails.address.pinCode",
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

      const options = {
        allowDiskUse: true,
      };
      let myAggregate = productModel.aggregate(agg);

      const result = await productModel.aggregatePaginate(myAggregate, options);
      console.log({ result });

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
              if (req.user._id) {
                var result = await WishlistModel.findOne({
                  customerId: new ObjectId(req.user._id),
                  productId: item._id,
                });
                var checkCart = await cartModel.findOne({
                  customerId: new ObjectId(req.user._id),
                  productId: item._id,
                });
                if (checkCart) {
                  item.isCart = true;
                } else {
                  item.isCart = false;
                }

                if (result) {
                  item.isWishListed = true;
                } else {
                  item.isWishListed = false;
                }
              } else {
                item.isWishListed = false;
                item.isCart = false;
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
              item.ratings = Math.round(ratingCount / ratingCountRes.length); // web not show float value thats why round off
              item.reviews = ratingCountRes.length;
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
          { productList: [] }
        );
      }
    } catch (err) {
      console.log(err);
      return Helper.response(res, 500, "Internal server error.");
    }
  },
  addRecentlyView: async (req, res) => {
    try {
      const { viewedId, categoryType } = req.body;
      const customerId = req.user._id;
      req.body.customerId = customerId;
      req.body.updatedAt = new Date();
      var checkInrecent = await RecentlyVeiwedModel.findOne({
        viewedId,
        customerId,
      });
      if (checkInrecent) {
        await RecentlyVeiwedModel.findOneAndUpdate(
          { viewedId, customerId },
          { $set: req.body },
          { new: true }
        );
        return Helper.response(res, 200, "Data add in recent view");
      } else {
        const recentVeiwData = new RecentlyVeiwedModel(req.body);
        const saveRecentReviewData = await recentVeiwData.save();
        return Helper.response(res, 200, "Data add in recent view");
      }
    } catch (error) {
      logger.error(error);
      console.log(error);
      return Helper.response(res, 500, "Internal error");
    }
  },
  getRecentViewProduct: async (req, res) => {
    try {
      const customerId = req.user._id;
      req.body.customerId = customerId;
      req.body.updatedAt = new Date();
      //10 days back data should view only in recent view
      var tenDayBackDate = new Date();
      tenDayBackDate.setDate(tenDayBackDate.getDate() - 11);
      var checkInrecent = await RecentlyVeiwedModel.find({
        customerId,
        categoryType: "Product",
        updatedAt: { $gte: tenDayBackDate, $lte: new Date() },
      });
      var productIds = [];

      await Promise.all(
        checkInrecent.map(async function (item) {
          productIds.push(item.viewedId);
        })
      );
      var productDetails = await productModel
        .find({
          _id: { $in: productIds },
          productStatus: "Active",
        })
        .lean();
      await Promise.all(
        productDetails.map(async function (item) {
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
          if (item.productVideo != undefined && item.productVideo.length > 0) {
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
                item.uploadCertificateDetails[i].uploadCertificate.length > 0
              ) {
                for (
                  let j = 0;
                  j < item.uploadCertificateDetails[i].uploadCertificate.length;
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
                    _id: item.uploadCertificateDetails[i].uploadCertificate[j]
                      ._id,
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
            item.productCDSCORegistrationFiles = productCDSCORegistrationFiles;
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

      return Helper.response(res, 200, "Recently viewed products", {
        data: productDetails,
      });
    } catch (error) {
      console.log(error);
      return Helper.response(res, 500, "Internal error");
    }
  },
  getRecentViewService: async (req, res) => {
    try {
      const customerId = req.user._id;
      req.body.customerId = customerId;
      req.body.updatedAt = new Date();
      //10 days back data should view only in recent view
      var tenDayBackDate = new Date();
      tenDayBackDate.setDate(tenDayBackDate.getDate() - 11);
      var checkInrecent = await RecentlyVeiwedModel.find({
        customerId,
        categoryType: "Service",
        updatedAt: { $gte: tenDayBackDate, $lte: new Date() },
      });
      var serviceId = [];
      await Promise.all(
        checkInrecent.map(async function (item) {
          serviceId.push(item.viewedId);
        })
      );
      var serviceList = await ServiceModel.find({
        _id: { $in: serviceId },
        status: "Active",
      }).lean();
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
                _id: item.serviceImage[i]._id,
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
                _id: item.serviceImageThumbnail[i]._id,
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
                _id: item.companyProfileImage[i]._id,
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
                  j < item.relevantCertifications[i].uploadCertificate.length;
                  j++
                ) {
                  var fileExe = await Helper.getFileExtension(
                    item.relevantCertifications[i].uploadCertificate[j].imgName
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
      return Helper.response(res, 200, "Recently viewed", {
        data: serviceList,
      });
    } catch (error) {
      logger.error(error);
      console.log(error);
      return Helper.response(res, 500, "Internal error");
    }
  },
  getRecentAddedProduct: async (req, res) => {
    try {
      var tenDayBackDate = new Date();
      tenDayBackDate.setDate(tenDayBackDate.getDate() - 15);
      var productDetails = await productModel
        .find({
          productStatus: "Active",
          createdAt: { $gte: tenDayBackDate, $lte: new Date() },
        })
        .lean();
      await Promise.all(
        productDetails.map(async function (item) {
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
          if (item.productVideo != undefined && item.productVideo.length > 0) {
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
                item.uploadCertificateDetails[i].uploadCertificate.length > 0
              ) {
                for (
                  let j = 0;
                  j < item.uploadCertificateDetails[i].uploadCertificate.length;
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
                    _id: item.uploadCertificateDetails[i].uploadCertificate[j]
                      ._id,
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
            item.productCDSCORegistrationFiles = productCDSCORegistrationFiles;
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

      return Helper.response(res, 200, "Recently added products", {
        data: productDetails,
      });
    } catch (error) {
      console.log(error);
      return Helper.response(res, 500, "Internal error");
    }
  },
};
