const productModel = require("../../../models/ProductModel");
const Helper = require("../../../config/helper");
const { logger } = require("../../../logger/winston");
const CODES = require("../../../config/status_codes/status_codes");
const MSG = require("../../../config/language/Messages");
const mongoose = require("mongoose");
const supplierModel = require("../../../models/SupplierModel");
const serviceModel = require("../../../models/ServiceModel");
const moment = require("moment-timezone");
const ObjectId = mongoose.Types.ObjectId;
const getUniqueProductId = async () => {
  let isDuplicate = true;
  let uniqueProductId = "";
  while (isDuplicate) {
    uniqueProductId = Helper.generateRandProductId();

    let isExist = await productModel.countDocuments({
      productUniqueId: "ecom-" + uniqueProductId,
    });

    if (isExist === 0) {
      isDuplicate = false;
      uniqueProductId = "ecom-" + uniqueProductId;
      break;
    }
  }

  return uniqueProductId;
};

const getUniqueProductCode = async () => {
  let isDuplicate = true;
  let uniqueProductId = "";
  while (isDuplicate) {
    uniqueProductId = Helper.generateRandProductId();

    let isExist = await productModel.countDocuments({
      productCode: "ecom-" + uniqueProductId,
    });

    if (isExist === 0) {
      isDuplicate = false;
      uniqueProductId = "ecom-" + uniqueProductId;
      break;
    }
  }

  return uniqueProductId;
};
module.exports = {
  addProduct: async (req, res) => {
    const { supplierId, productDetails } = req.body;
    try {
      const savedProducts = [];
      var checkAvailable = await supplierModel.findOne({
        _id: supplierId,
      });
      if (!checkAvailable) {
        return Helper.response(res, 404, "Supplier not found");
      }
      for (const productDetail of productDetails) {
        const product = new productModel({
          supplierId,
          productUniqueId: await Helper.generateProductUniqId(supplierId),
          // productUniqueId: await getUniqueProductId(),
          productCode: await getUniqueProductCode(),
          submitStatus: {
            isSubmitted: true,
            submitttedDate: moment().format(),
          },
          ...productDetail,
        });
        const savedProduct = await product.save();
        savedProducts.push(savedProduct);
      }
      var html = `
      <p>Thank you adding your product in . Admin will review the product and update.</p></br></br></br></br></br>
                `;
      // var htmlForAdmin = `Supplier name ${checkAvailable.basicInfo.founderName} added product please review supplier mail is <b> ${checkAvailable.basicInfo.emailId}</b>
      //   <p></p></br></br></br></br></br>
      // `
      await Helper.send365Email(
        process.env.MAIL_SEND_EMAIL,
        checkAvailable.basicInfo.emailId,
        " Product completion process",
        html,
        "text"
      );
      // await Helper.send365Email(checkAvailable.basicInfo.emailId,process.env.MAIL_SEND_EMAIL, 'Supplier added product', htmlForAdmin, "text")
      return Helper.response(res, 200, "Send for approval");
    } catch (error) {
      console.log(error);
      return Helper.response(res, 500, "Could not add products.");
    }
  },
  updateProduct: async (req, res) => {
    const { productId } = req.params;
    const { supplierId, updatedProductDetails } = req.body;
    try {
      const supplier = await supplierModel.findOne({
        _id: supplierId,
      });
      if (!supplier) {
        return Helper.response(res, 404, "Supplier not found");
      }

      const product = await productModel.findOne({
        _id: productId,
        supplierId: supplierId,
      });
      if (!product) {
        return Helper.response(res, 404, "Product not found");
      }

      // Update product details with the new data
      product.productCategoryId = req.body.productCategoryId;
      product.productName = req.body.productName;
      product.productSubCategoryId = req.body.productSubCategoryId;
      product.productNameForListing = req.body.productNameForListing;
      product.keywords = req.body.keywords;
      product.productClassifications = req.body.productClassifications;
      product.productImages = req.body.productImages;
      product.productImageThumbnail = req.body.productImageThumbnail;
      product.productQuantity = req.body.productQuantity;
      product.productCDSCORegistration = req.body.productCDSCORegistration;
      product.productCDSCORegistrationFiles =
        req.body.productCDSCORegistrationFiles;
      product.productDimensions = req.body.productDimensions;
      product.productDescription = req.body.productDescription;
      product.productPrice = req.body.productPrice;
      product.priceByAdmin = req.body.priceByAdmin;
      product.productMinDelivery = req.body.productMinDelivery;
      product.productDeliveryPreference = req.body.productDeliveryPreference;
      product.productPaymentMode = req.body.productPaymentMode;
      product.certificates = req.body.certificates;
      product.sku = req.body.sku;
      product.productWeight = req.body.productWeight;
      product.isDemo = req.body.isDemo;
      product.hsnNo = req.body.hsnNo;
      product.updatedAt = moment().format();
      product.productTagline = req.body.productTagline;
      product.genericName = req.body.genericName;
      product.specificUse = req.body.specificUse;
      product.productVideo = req.body.productVideo;
      product.uploadCertificateDetails = req.body.uploadCertificateDetails;
      product.otherFeature = req.body.otherFeature;
      product.specification = req.body.specification;
      product.compatibleDevices = req.body.compatibleDevices;
      product.typeOfconsumables = req.body.typeOfconsumables;
      product.productInstallation = req.body.productInstallation;
      product.maintainainceOffer = req.body.maintainainceOffer;
      product.accesoriesRequirement = req.body.accesoriesRequirement;
      product.productWarranty = req.body.productWarranty;
      product.maintenance = req.body.maintenance;
      product.accessories = req.body.accessories;
      product.productWarrantyPeriod = req.body.productWarrantyPeriod;
      product.consumables = req.body.consumables;
      product.consumableRequirement = req.body.consumableRequirement;
      product.otherRelevantInformation = req.body.otherRelevantInformation;
      product.uploadProductBrochure = req.body.uploadProductBrochure;
      product.typeOfDemo = req.body.typeOfDemo;
      product.awardRecognition = req.body.awardRecognition;
      product.shippingPreference = req.body.shippingPreference;
      console.log(req.body.isEdit, "req.body.isEdit");
      if (req.body.isEdit != "admin") {
        product.approvedStatus = {
          isApproved: false,
          approvedDate: new Date(),
        };
        product.productStatus = "Inactive";
        product.status = "Submitted";
        product.isEdit = "supplier";
        product.isRead = false;
      } else {
        product.isEdit = "admin";
      }

      // Save the updated product
      const updatedProduct = await product.save();
      var html = `
      <p>Your product has been updated.</b></p> </br></br></br>
      `;
      await Helper.send365Email(
        process.env.MAIL_SEND_EMAIL,
        supplier.basicInfo.emailId,
        " Product update process",
        html,
        "text"
      );
      return Helper.response(res, 200, "Product updated successfully");
    } catch (error) {
      console.log(error);
      return Helper.response(res, 500, "Could not update the product.");
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
      const _id = req.params.productId;
      const doesproductExist = await productModel.findById(_id);
      if (doesproductExist) {
        if (req.body.productStatus) {
          var msg = req.body.productStatus;
        } else {
          var msg = req.body.status;
        }
        if (req.body.status == "Cancel") {
          req.body.cancelStatus = {
            isCancel: true,
            cancelDate: moment().format(),
          };
          req.body.approvedStatus = {
            isApproved: false,
            approvedDate: moment().format(),
          };
          req.body.productStatus = "Inactive";
        }
        const productData = await productModel.findByIdAndUpdate(
          _id,
          {
            $set: req.body,
          },
          {
            new: true,
          }
        );
        console.log({
          productData,
        });
        if (!productData) {
          return Helper.response(res, 404, "Not found");
        }
        return Helper.response(res, 200, `Product ${msg} successfully`);
      } else {
        return Helper.response(res, 404, "Not found");
      }
    } catch (error) {
      console.log(error);
      return Helper.response(res, 500, "Internal error");
    }
  },
  updateProductQuantity: async (req, res) => {
    try {
      const _id = req.params.productId;
      const doesproductExist = await productModel.findById(_id);
      if (doesproductExist) {
        const productData = await productModel.findByIdAndUpdate(
          _id,
          {
            $set: req.body,
          },
          {
            new: true,
          }
        );
        if (!productData) {
          return Helper.response(res, 404, "Not found");
        }
        return Helper.response(
          res,
          200,
          `Product quantity updated successfully`
        );
      } else {
        return Helper.response(res, 404, "Not found");
      }
    } catch (error) {
      console.log(error);
      return Helper.response(res, 500, "Internal error");
    }
  },
};
