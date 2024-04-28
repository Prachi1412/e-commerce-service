const CODES = require("../../../config/status_codes/status_codes");
const MSG = require("../../../config/language/Messages");
const mongoose = require("mongoose");
const { ObjectId } = mongoose.Types;
const Helper = require("../../../config/helper");
const customer_list = require("../../../helper/excel-generator/customer_list");
const buyer_list = require("../../../helper/excel-generator/buyer_performance");
const seller_list = require("../../../helper/excel-generator/seller_performance");
const service_list = require("../../../helper/excel-generator/service_list");
const service_sales_list = require("../../../helper/excel-generator/service_sales");
const supplier_list = require("../../../helper/excel-generator/supplier_list");
const order_list = require("../../../helper/excel-generator/order_list");
const order_Details_list = require("../../../helper/excel-generator/orderDetails");
const revenue_report = require("../../../helper/excel-generator/revenue_report");
const product_list = require("../../../helper/excel-generator/product_list");
const product_performance_list = require("../../../helper/excel-generator/product_performance");
const product_accessories = require("../../../helper/excel-generator/product_accessories");
const product_review = require("../../../helper/excel-generator/product_review");
const product_category_wise_list = require("../../../helper/excel-generator/productCategory_wise");
const sellerProduct_list = require("../../../helper/excel-generator/seller_product");
const query_resolution = require("../../../helper/excel-generator/query_resolution");
const installation_pending = require("../../../helper/excel-generator/installation_pending");
const orderReturn_report = require("../../../helper/excel-generator/orderReturn_report");
const serviceModel = require("../../../models/ServiceModel");
const supplierModel = require("../../../models/SupplierModel");
const { logger } = require("../../../logger/winston");
const productModel = require("../../../models/ProductModel");
const customerModel = require("../../../models/CustomerModel");
const ReviewModel = require("../../../models/ReviewModel");
const orderModel = require("../../../models/OrderModel");
const ProductSubCategoryModel = require("../../../models/ProductSubCategoryModel");
const ProductCategoryModel = require("../../../models/ProductCategoryModel");
const ProfessionsModel = require("../../../models/ProfessionModel");
const InstitutionModel = require("../../../models/InstitutionModel");
const orderDetailsModel = require("../../../models/OrderDetailsModel");
const returnOrderModel = require("../../../models/returnOrderModel");
const SupportModel = require("../../../models/SupportModel");
const orderTrackModel = require("../../../models/orderTrackModel");
module.exports = {
  CustomerExcelsheet: async (req, res) => {
    const limit = req.query.limit ? parseInt(req.query.limit) : 2000;
    const page = req.query.page ? parseInt(req.query.page) : 1;
    const status = req.query.status ? req.query.status : "";
    let query = { status: { $ne: "Delete" } };
    if (status) {
      query = { status: { $eq: status } };
    }
    var fileType = req.query.fileType ? req.query.fileType : "excel";
    var file_extension = "excel";
    if (fileType) {
      if (fileType == "csv" || fileType == "excel") file_extension = fileType;
    }
    const col = { jwtToken: 0, otp: 0, isOtpVerified: 0 };
    if (req.query.search) {
      var searchObject = {
        $or: [{ name: { $regex: req.query.search, $options: "i" } }],
      };
      Object.assign(query, searchObject);
    }
    var startsDate = req.query.startDate ? req.query.startDate : null;
    var endsDate = req.query.endDate ? req.query.endDate : null;
    endsDate = Helper.modifyDate(endsDate, 1);

    if (startsDate && endsDate) {
      let dateFilter = {
        createdAt: { $gte: new Date(startsDate), $lte: new Date(endsDate) },
      };
      Object.assign(query, dateFilter);
    }
    customerModel
      .paginate(query, {
        page: page,
        sort: { createdAt: -1 },
        limit: limit,
        select: col,
      })
      .then(async (result) => {
        var serviceList = result.docs;
        if (serviceList.length > 0) {
          let cartItems = serviceList;
          if (cartItems.length > 0) {
            let leaveBalanceArrayFormat = [
              { start: { row: 1, column: 1 }, end: { row: 1, column: 11 } },
              { start: { row: 2, column: 1 }, end: { row: 2, column: 11 } },
              // { start: { row: 3, column: 1 }, end: { row: 3, column: 8 } }
            ];
            var i = 3; // Start row
            var l = 3; // start column
            var mainArray = [];
            for await (let ls of cartItems) {
              // if (i !== ls.orderProducts.length) {
              //     i = l;
              //     i = i + 1;
              // } else {
              //     i = i + 1;
              // }
              l = l + ls.length;
              //For Column
              for (let index = 1; index <= 11; index++) {
                leaveBalanceArrayFormat.push({
                  start: { row: i, column: index },
                  end: { row: l, column: index },
                });
              }
              ls = JSON.parse(JSON.stringify(ls));
              var orderData = await orderModel.find({
                customerId: ls._id,
                orderStatus: { $ne: "DELETE" },
              });
              let orderValueCount = 0;
              orderData.forEach((ele) => {
                orderValueCount = orderValueCount + Number(ele.totalPrice);
              });
              let noOfReturnReplacedCount = await returnOrderModel
                .find({ customerId: ls._id })
                .count();
              ls.orderCount = orderData.length.toString();
              ls.orderValue = orderValueCount.toString();
              ls.typeOfOrder = "NOT";
              ls.noOfReturnReplaced = noOfReturnReplacedCount.toString();
              if (ls.institutionId) {
                let institution = await InstitutionModel.findById({
                  _id: ls.institutionId,
                });
                if (institution) {
                  ls.institutionId = institution._id;
                  if (institution.name == "Others (specify)") {
                    ls.institutionName = institution.name;
                  } else {
                    ls.institutionName = institution.name;
                  }
                } else {
                  ls.institutionId = "";
                  ls.institutionName = "";
                }
              } else {
                ls.institutionId = "";
                ls.institutionName = "";
              }
              if (ls.professionId) {
                let profession = await ProfessionsModel.findById({
                  _id: ls.professionId,
                });
                if (profession) {
                  ls.professionId = profession._id;
                  if (profession.name == "Others (specify)") {
                    ls.professionName = ls.other;
                  } else {
                    ls.professionName = profession.name;
                  }
                } else {
                  ls.professionId = "";
                  ls.professionName = "";
                }
              } else {
                ls.professionId = "";
                ls.professionName = "";
              }
              let productCategoryId = ls.productCategoryId;
              let productSubCategoryId = ls.productSubCategoryId;
              if (productCategoryId && productCategoryId.length > 0) {
                var productDetails = await ProductCategoryModel.find(
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
                var catArr = [];
                productDetails.forEach((ele) => {
                  catArr.push(ele.productCategoryName);
                });
                ls.productCategory = catArr;
              }
              if (productSubCategoryId && productSubCategoryId.length > 0) {
                var subCategoryName = await ProductSubCategoryModel.find(
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
                var subCatArr = [];
                subCategoryName.forEach((ele) => {
                  subCatArr.push(ele.subCategoryName);
                });
                ls.subCategory = subCatArr;
              }
              if (ls.productCategory == undefined) {
                ls.productCategory = "--";
              }
              if (ls.subCategory == undefined) {
                ls.subCategory = "--";
              }
              let addressArr = [];
              if (ls.address) addressArr.push(ls.address);
              if (ls.city) addressArr.push(ls.city);
              if (ls.state) addressArr.push(ls.state);
              if (ls.zipCode) addressArr.push(ls.zipCode);
              ls.address = addressArr;
              mainArray.push(ls);
              // await Promise.all(await ls.map(async(subLs) => {
              //     mainArray.push({...ls, ...subLs })
              //     return;
              // }));
              delete ls;
            }
            // let resData = { orderList: cartItems, totalResult: totalResult, limit: limit };
            var recodeResponse = await buyer_list.makeExcelSheetWithData(
              mainArray,
              leaveBalanceArrayFormat
            );
            // You can then return this straight
            return res
              .attachment("buyer-performance.xlsx")
              .send(recodeResponse);
            // Helper.response(res, 200, "Order details fetched successfully..", resData);
          } else {
            Helper.response(res, 404, "Customer not found", {
              customerList: [],
            });
          }
        } else {
          Helper.response(res, 404, "Customer not found", { customerList: [] });
        }
      })
      .catch((err) => {
        console.log(err);
        return Helper.response(
          res,
          CODES.STATUS_CODES.Internal_Server_Error,
          MSG.serverError[LOCALE || "en"]
        );
      });
  },
  SupplierExcelsheet: async (req, res) => {
    const limit = req.query.limit ? parseInt(req.query.limit) : 2000;
    const page = req.query.page ? parseInt(req.query.page) : 1;
    let query = { accountStatus: { $ne: "Delete" } };

    if (req.query.status) {
      query.accountStatus = { $eq: req.query.status };
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
          { "basicInfo.address": { $regex: req.query.search, $options: "i" } },
          {
            "basicInfo.contactNo": { $regex: req.query.search, $options: "i" },
          },
          { "basicInfo.emailId": { $regex: req.query.search, $options: "i" } },
          { "basicInfo.website": { $regex: req.query.search, $options: "i" } },
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
    let startsDate = req.query.startDate ? req.query.startDate : null;
    let endsDate = req.query.endDate ? req.query.endDate : null;
    endsDate = Helper.modifyDate(endsDate, 1);

    if (startsDate && endsDate) {
      const dateFilter = {
        createdAt: { $gte: new Date(startsDate), $lte: new Date(endsDate) },
      };
      Object.assign(query, dateFilter);
    }

    const result = await supplierModel.paginate(query, {
      page: page,
      sort: { createdAt: -1 },
      limit: limit,
      select: { JWT_Token: 0, "basicInfo.password": 0 },
    });
    const supplierList = result.docs;
    const totalResult = result.totalDocs;

    if (supplierList.length > 0) {
      let leaveBalanceArrayFormat = [
        { start: { row: 1, column: 1 }, end: { row: 1, column: 13 } },
        { start: { row: 2, column: 1 }, end: { row: 2, column: 13 } },
        // { start: { row: 3, column: 1 }, end: { row: 3, column: 8 } }
      ];
      var i = 3; // Start row
      var l = 3; // start column
      var mainArray = [];
      for await (let ls of supplierList) {
        // if (i !== ls.orderProducts.length) {
        //     i = l;
        //     i = i + 1;
        // } else {
        //     i = i + 1;
        // }
        l = l + ls.length;
        //For Column
        for (let index = 1; index <= 11; index++) {
          leaveBalanceArrayFormat.push({
            start: { row: i, column: index },
            end: { row: l, column: index },
          });
        }
        registeredArr = [];
        ls.founderName = ls.basicInfo.founderName;
        ls.companyName = ls.basicInfo.companyName;
        ls.coFounderName = ls.basicInfo.coFounderNames;
        ls.emailId = ls.basicInfo.emailId;
        ls.isProfileStep = ls.isProfileStep;
        let addressArr = [];
        if (ls.address.address) addressArr.push(ls.address.address);
        if (ls.address.localTown) addressArr.push(ls.address.localTown);
        if (ls.address.city) addressArr.push(ls.address.city);
        if (ls.address.state) addressArr.push(ls.address.state);
        if (ls.address.pinCode) addressArr.push(ls.address.pinCode);
        ls.addressArr = addressArr;
        if (ls.registeredAddress.address)
          registeredArr.push(ls.registeredAddress.address);
        if (ls.registeredAddress.localTown)
          registeredArr.push(ls.registeredAddress.localTown);
        if (ls.registeredAddress.city)
          registeredArr.push(ls.registeredAddress.city);
        if (ls.registeredAddress.state)
          registeredArr.push(ls.registeredAddress.state);
        if (ls.registeredAddress.pinCode)
          registeredArr.push(ls.registeredAddress.pinCode);
        ls.registeredArr = registeredArr;
        ls.contactNo = ls.basicInfo.contactNo;
        if (ls.kycDetails.panNoData == "" || ls.kycDetails.panNoData == null) {
          ls.panNoData = "";
        } else {
          ls.panNoData = ls.kycDetails.panNoData;
        }
        if (ls.kycDetails.gstNoData == "" || ls.kycDetails.gstNoData == null) {
          ls.gstNoData = "";
        } else {
          ls.gstNoData = ls.kycDetails.gstNoData;
        }
        let productDetails = await productModel.find({
          supplierId: ls._id,
          accountStatus: { $ne: "Delete" },
        });
        let priceCount = 0,
          Revenue = 0,
          valueOfOrders = 0;

        let orderDetails = await orderDetailsModel.find({
          supplierId: ls._id,
          orderStatus: { $ne: "DELETE" },
        });
        productDetails.forEach((ele) => {
          Revenue = Revenue + Number(ele.commisionAddedByAdmin);
          priceCount = priceCount + Number(ele.productPrice);
        });
        orderDetails.forEach((ele) => {
          valueOfOrders = valueOfOrders + Number(ele.totalPrice);
        });
        ls.noOfProductListed = productDetails.length.toString();
        ls.totalPriceOfProducts = priceCount.toFixed(2).toString();
        ls.Revenue = Revenue.toFixed(2).toString();
        ls.NoOrdersProcessed = orderDetails.length.toString();
        ls.valueOfOrders = valueOfOrders.toFixed(2).toString();
        if (ls.valueOfOrders == "NaN") {
          ls.valueOfOrders = "0.00";
        }
        mainArray.push(ls);
        // await Promise.all(await ls.map(async(subLs) => {
        //     subLs.founderName = subLs.basicInfo.founderName;
        //     mainArray.push({subLs})
        // }));
        delete ls;
      }

      // let resData = { orderList: cartItems, totalResult: totalResult, limit: limit };
      var recodeResponse = await seller_list.makeExcelSheetWithData(
        mainArray,
        leaveBalanceArrayFormat
      );
      // You can then return this straight
      return res.attachment("seller-performance.xlsx").send(recodeResponse);
      // Helper.response(res, 200, "Order details fetched successfully..", resData);
    } else {
      Helper.response(res, 404, "Supplier not found", {
        supplierList: [],
      });
    }
  },
  ProductCategoryWiseExcelsheet: async (req, res) => {
    const limit = req.query.limit ? parseInt(req.query.limit) : 2000;
    const page = req.query.page ? parseInt(req.query.page) : 1;

    let query = { productStatus: { $ne: "Delete" } };
    if (req.query.status == "Active" || req.query.status == "Inactive") {
      query.productStatus = { $eq: req.query.status };
    } else if (req.query.status == "Pending") {
      query = {
        productStatus: { $ne: "Delete" },
        "approvedStatus.isApproved": false,
      };
    } else if (req.query.status == "Approved") {
      query = {
        productStatus: { $ne: "Delete" },
        "approvedStatus.isApproved": true,
      };
    }
    if (req.query.search) {
      let searchObject = {
        $or: [
          { productName: { $regex: req.query.search, $options: "i" } },
          { productUniqueId: { $regex: req.query.search, $options: "i" } },
          {
            "productClassifications_details.productClassificationName": {
              $regex: req.query.search,
              $options: "i",
            },
          },
        ],
      };
      Object.assign(query, searchObject);
    }
    let productCategoryId = req.query.productCategoryId
      ? new ObjectId(req.query.productCategoryId)
      : null;
    if (productCategoryId) {
      query.productCategoryId = productCategoryId;
    }

    let subCategoryId = req.query.productSubCategoryId
      ? new ObjectId(req.query.productSubCategoryId)
      : null;
    if (subCategoryId) {
      query.productSubCategoryId = subCategoryId;
    }
    let startsDate = req.query.startDate ? req.query.startDate : null;
    let endsDate = req.query.endDate ? req.query.endDate : null;
    endsDate = Helper.modifyDate(endsDate, 1);

    if (startsDate && endsDate) {
      const dateFilter = {
        createdAt: { $gte: new Date(startsDate), $lte: new Date(endsDate) },
      };
      Object.assign(query, dateFilter);
    }
    console.log({ query });
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
      //   {
      //     $unwind: {
      //       path: "$subcategory_details",
      //       preserveNullAndEmptyArrays: true,
      //     },
      //   },
      { $match: query },
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
          supplierUniqId: "$supplierDetails.supplierUniqId",
          supplierId: 1,
          productCDSCORegistration: 1,
          productCDSCORegistrationFiles: 1,
          keywords: 1,
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
          categoryType: 1,
          productQuantity: 1,
          isDemo: 1,
          productUniqueId: 1,
          sku: 1,
          hsnNo: 1,
        },
      },
      { $sort: { createdAt: -1 } },
    ];

    const options = {
      page: page,
      limit: limit,
      allowDiskUse: true,
    };
    logger.info("agg......query", JSON.stringify(agg));
    let myAggregate = productModel.aggregate(agg);
    productModel.aggregatePaginate(
      myAggregate,
      options,
      async function (err, result) {
        if (err) {
          console.log(err, "errrr");
          return Helper.response(res, 500, "Internal server error.");
        } else {
          if (result.docs.length > 0) {
            let productList = result.docs;
            if (productList.length > 0) {
              let cartItems = productList;
              if (cartItems.length > 0) {
                let leaveBalanceArrayFormat = [
                  { start: { row: 1, column: 1 }, end: { row: 1, column: 11 } },
                  { start: { row: 2, column: 1 }, end: { row: 2, column: 11 } },
                  // { start: { row: 3, column: 1 }, end: { row: 3, column: 8 } }
                ];
                var i = 3; // Start row
                var l = 3; // start column
                var mainArray = [];
                for await (let ls of cartItems) {
                  l = l + ls.length;
                  //For Column
                  for (let index = 1; index <= 11; index++) {
                    leaveBalanceArrayFormat.push({
                      start: { row: i, column: index },
                      end: { row: l, column: index },
                    });
                  }
                  // ls.productClassificationName =
                  //   ls.productClassifications.productClassificationName;
                  if (ls.approvedStatus.isApproved == true) {
                    ls.approved = "Approved";
                  } else {
                    ls.approved = "Pending";
                  }
                  if (ls.contractStatus.isContract == true) {
                    ls.contractSigned = "Contract Signed";
                  } else {
                    ls.contractSigned = "Pending";
                  }
                  if (ls.maintenance == undefined) {
                    ls.maintenance = "--";
                  }
                  if (ls.maintainainceOffer == undefined) {
                    ls.maintainainceOffer = "--";
                  }
                  if (ls.otherFeature == undefined) {
                    ls.otherFeature = "--";
                  }
                  if (ls.otherRelevantInformation == undefined) {
                    ls.otherRelevantInformation = "--";
                  }
                  if (ls.productInstallation == undefined) {
                    ls.productInstallation = "--";
                  }
                  if (ls.productWarranty == undefined) {
                    ls.productWarranty = "--";
                  }
                  if (ls.productWarrantyPeriod == undefined) {
                    ls.productWarrantyPeriod = "--";
                  }
                  if (ls.specification == undefined) {
                    ls.specification = "--";
                  }
                  if (ls.specificUse == undefined) {
                    ls.specificUse = "--";
                  }
                  if (ls.typeOfconsumables == undefined) {
                    ls.typeOfconsumables = "--";
                  }
                  if (ls.typeOfDemo == undefined) {
                    ls.typeOfDemo = "--";
                  }
                  if (ls.accesoriesRequirement == undefined) {
                    ls.accesoriesRequirement = "--";
                  }
                  if (ls.awardRecognition == undefined) {
                    ls.awardRecognition = "--";
                  }
                  if (ls.compatibleDevices == undefined) {
                    ls.compatibleDevices = "--";
                  }
                  if (ls.consumableRequirement == undefined) {
                    ls.consumableRequirement = "--";
                  }
                  if (ls.consumables == undefined) {
                    ls.consumables = "--";
                  }
                  if (ls.genericName == undefined) {
                    ls.genericName = "--";
                  }
                  if (ls.isDemo == undefined) {
                    ls.isDemo = "--";
                  }
                  if (ls.keywords == undefined) {
                    ls.keywords = "--";
                  }
                  if (ls.accessories == undefined) {
                    ls.accessories = "--";
                  }
                  ls.unitInStock = ls.productQuantity.toString();
                  if (ls.unitInStock < 0) {
                    ls.unitInStock = "0";
                  }
                  ls.productPrice = ls.productPrice.toString();
                  ls.productMinDelivery = ls.productMinDelivery.toString();
                  mainArray.push(ls);
                  // await Promise.all(await ls.map(async(subLs) => {
                  //     mainArray.push({...ls, ...subLs })
                  //     return;
                  // }));
                  delete ls;
                }

                // let resData = { orderList: cartItems, totalResult: totalResult, limit: limit };
                var recodeResponse =
                  await product_category_wise_list.makeExcelSheetWithData(
                    mainArray,
                    leaveBalanceArrayFormat
                  );
                // You can then return this straight
                return res
                  .attachment("product-category-wise.xlsx")
                  .send(recodeResponse);
                // Helper.response(res, 200, "Order details fetched successfully..", resData);
              } else {
                Helper.response(res, 404, "product not found", {
                  productList: [],
                });
              }
            } else {
              Helper.response(res, 404, "product not found", {
                productList: [],
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
        }
      }
    );
  },
  SellerAndProductListExcelsheet: async (req, res) => {
    const limit = req.query.limit ? parseInt(req.query.limit) : 2000;
    const page = req.query.page ? parseInt(req.query.page) : 1;

    let query = { productStatus: { $ne: "Delete" } };
    let startsDate = req.query.startDate ? req.query.startDate : null;
    let endsDate = req.query.endDate ? req.query.endDate : null;
    endsDate = Helper.modifyDate(endsDate, 1);

    if (startsDate && endsDate) {
      const dateFilter = {
        createdAt: { $gte: new Date(startsDate), $lte: new Date(endsDate) },
      };
      Object.assign(query, dateFilter);
    }
    console.log({ query });
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
      //   {
      //     $unwind: {
      //       path: "$subcategory_details",
      //       preserveNullAndEmptyArrays: true,
      //     },
      //   },
      { $match: query },
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
          supplierUniqId: "$supplierDetails.supplierUniqId",
          supplierId: 1,
          productCDSCORegistration: 1,
          productCDSCORegistrationFiles: 1,
          keywords: 1,
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
          productInstallation: {
            $cond: {
              if: { $eq: ["$productInstallation", "yes"] },
              then: "Yes",
              else: "No",
            },
          },
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
          categoryType: 1,
          productQuantity: 1,
          isDemo: {
            $cond: {
              if: { $eq: ["$isDemo", true] },
              then: "Yes",
              else: "No",
            },
          },
          productUniqueId: 1,
          sku: 1,
          hsnNo: 1,
        },
      },
      { $sort: { createdAt: -1 } },
    ];

    const options = {
      page: page,
      limit: limit,
      allowDiskUse: true,
    };
    logger.info("agg......query", JSON.stringify(agg));
    let myAggregate = productModel.aggregate(agg);
    productModel.aggregatePaginate(
      myAggregate,
      options,
      async function (err, result) {
        if (err) {
          console.log(err, "errrr");
          return Helper.response(res, 500, "Internal server error.");
        } else {
          if (result.docs.length > 0) {
            let productList = result.docs;
            if (productList.length > 0) {
              let cartItems = productList;
              if (cartItems.length > 0) {
                let leaveBalanceArrayFormat = [
                  { start: { row: 1, column: 1 }, end: { row: 1, column: 13 } },
                  { start: { row: 2, column: 1 }, end: { row: 2, column: 13 } },
                  // { start: { row: 3, column: 1 }, end: { row: 3, column: 8 } }
                ];
                var i = 3; // Start row
                var l = 3; // start column
                var mainArray = [];
                for await (let ls of cartItems) {
                  l = l + ls.length;
                  //For Column
                  for (let index = 1; index <= 11; index++) {
                    leaveBalanceArrayFormat.push({
                      start: { row: i, column: index },
                      end: { row: l, column: index },
                    });
                  }
                  if (ls.productInstallation == undefined) {
                    ls.productInstallation = "--";
                  }
                  if (ls.isDemo == undefined) {
                    ls.isDemo = "--";
                  }
                  ls.unitInStock = ls.productQuantity.toString();
                  if (ls.unitInStock < 0) {
                    ls.unitInStock = "0";
                  }
                  ls.productMinDelivery = ls.productMinDelivery.toString();
                  let certificateArr = [];
                  if (ls.uploadCertificateDetails) {
                    await Promise.all(
                      await ls.uploadCertificateDetails.map(async (subLs) => {
                        certificateArr.push(subLs.certificateName);
                        return;
                      })
                    );
                  }
                  ls.certificateArr = certificateArr;
                  if (ls.productPrice == null) {
                    ls.productPrice = "--";
                  }
                  mainArray.push(ls);
                  delete ls;
                }

                // let resData = { orderList: cartItems, totalResult: totalResult, limit: limit };
                var recodeResponse =
                  await sellerProduct_list.makeExcelSheetWithData(
                    mainArray,
                    leaveBalanceArrayFormat
                  );
                // You can then return this straight
                return res
                  .attachment("seller-product-list.xlsx")
                  .send(recodeResponse);
                // Helper.response(res, 200, "Order details fetched successfully..", resData);
              } else {
                Helper.response(res, 404, "product not found", {
                  productList: [],
                });
              }
            } else {
              Helper.response(res, 404, "product not found", {
                productList: [],
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
        }
      }
    );
  },
  ProductExcelsheet: async (req, res) => {
    const limit = req.query.limit ? parseInt(req.query.limit) : 2000;
    const page = req.query.page ? parseInt(req.query.page) : 1;

    let query = { productStatus: { $ne: "Delete" } };
    if (req.query.status == "Active" || req.query.status == "Inactive") {
      query.productStatus = { $eq: req.query.status };
    } else if (req.query.status == "Pending") {
      query = {
        productStatus: { $ne: "Delete" },
        "approvedStatus.isApproved": false,
      };
    } else if (req.query.status == "Approved") {
      query = {
        productStatus: { $ne: "Delete" },
        "approvedStatus.isApproved": true,
      };
    }
    if (req.query.search) {
      let searchObject = {
        $or: [
          { productName: { $regex: req.query.search, $options: "i" } },
          { productUniqueId: { $regex: req.query.search, $options: "i" } },
          {
            "productClassifications_details.productClassificationName": {
              $regex: req.query.search,
              $options: "i",
            },
          },
        ],
      };
      Object.assign(query, searchObject);
    }
    let productCategoryId = req.query.productCategoryId
      ? new ObjectId(req.query.productCategoryId)
      : null;
    if (productCategoryId) {
      query.productCategoryId = productCategoryId;
    }

    let subCategoryId = req.query.productSubCategoryId
      ? new ObjectId(req.query.productSubCategoryId)
      : null;
    if (subCategoryId) {
      query.productSubCategoryId = subCategoryId;
    }
    let startsDate = req.query.startDate ? req.query.startDate : null;
    let endsDate = req.query.endDate ? req.query.endDate : null;
    endsDate = Helper.modifyDate(endsDate, 1);

    if (startsDate && endsDate) {
      const dateFilter = {
        createdAt: { $gte: new Date(startsDate), $lte: new Date(endsDate) },
      };
      Object.assign(query, dateFilter);
    }
    console.log({ query });
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
      //   {
      //     $unwind: {
      //       path: "$subcategory_details",
      //       preserveNullAndEmptyArrays: true,
      //     },
      //   },
      { $match: query },
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
          supplierUniqId: "$supplierDetails.supplierUniqId",
          supplierId: 1,
          productCDSCORegistration: 1,
          productCDSCORegistrationFiles: 1,
          keywords: 1,
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
          categoryType: 1,
          productQuantity: 1,
          noOfUnitSold: 1,
          isDemo: 1,
          productUniqueId: 1,
          sku: 1,
          hsnNo: 1,
        },
      },
      { $sort: { createdAt: -1 } },
    ];

    const options = {
      page: page,
      limit: limit,
      allowDiskUse: true,
    };
    logger.info("agg......query", JSON.stringify(agg));
    let myAggregate = productModel.aggregate(agg);
    productModel.aggregatePaginate(
      myAggregate,
      options,
      async function (err, result) {
        if (err) {
          console.log(err, "errrr");
          return Helper.response(res, 500, "Internal server error.");
        } else {
          if (result.docs.length > 0) {
            let productList = result.docs;
            if (productList.length > 0) {
              let cartItems = productList;
              if (cartItems.length > 0) {
                let leaveBalanceArrayFormat = [
                  { start: { row: 1, column: 1 }, end: { row: 1, column: 11 } },
                  { start: { row: 2, column: 1 }, end: { row: 2, column: 11 } },
                  // { start: { row: 3, column: 1 }, end: { row: 3, column: 8 } }
                ];
                var i = 3; // Start row
                var l = 3; // start column
                var mainArray = [];
                for await (let ls of cartItems) {
                  l = l + ls.length;
                  //For Column
                  for (let index = 1; index <= 11; index++) {
                    leaveBalanceArrayFormat.push({
                      start: { row: i, column: index },
                      end: { row: l, column: index },
                    });
                  }
                  // ls.productClassificationName =
                  //   ls.productClassifications.productClassificationName;
                  if (ls.approvedStatus.isApproved == true) {
                    ls.approved = "Approved";
                  } else {
                    ls.approved = "Pending";
                  }
                  if (ls.contractStatus.isContract == true) {
                    ls.contractSigned = "Contract Signed";
                  } else {
                    ls.contractSigned = "Pending";
                  }
                  if (ls.maintenance == undefined) {
                    ls.maintenance = "--";
                  }
                  if (ls.maintainainceOffer == undefined) {
                    ls.maintainainceOffer = "--";
                  }
                  if (ls.otherFeature == undefined) {
                    ls.otherFeature = "--";
                  }
                  if (ls.otherRelevantInformation == undefined) {
                    ls.otherRelevantInformation = "--";
                  }
                  if (ls.productInstallation == undefined) {
                    ls.productInstallation = "--";
                  }
                  if (ls.productWarranty == undefined) {
                    ls.productWarranty = "--";
                  }
                  if (ls.productWarrantyPeriod == undefined) {
                    ls.productWarrantyPeriod = "--";
                  }
                  if (ls.specification == undefined) {
                    ls.specification = "--";
                  }
                  if (ls.specificUse == undefined) {
                    ls.specificUse = "--";
                  }
                  if (ls.typeOfconsumables == undefined) {
                    ls.typeOfconsumables = "--";
                  }
                  if (ls.typeOfDemo == undefined) {
                    ls.typeOfDemo = "--";
                  }
                  if (ls.accesoriesRequirement == undefined) {
                    ls.accesoriesRequirement = "--";
                  }
                  if (ls.awardRecognition == undefined) {
                    ls.awardRecognition = "--";
                  }
                  if (ls.compatibleDevices == undefined) {
                    ls.compatibleDevices = "--";
                  }
                  if (ls.consumableRequirement == undefined) {
                    ls.consumableRequirement = "--";
                  }
                  if (ls.consumables == undefined) {
                    ls.consumables = "--";
                  }
                  if (ls.genericName == undefined) {
                    ls.genericName = "--";
                  }
                  if (ls.isDemo == undefined) {
                    ls.isDemo = "--";
                  }
                  if (ls.keywords == undefined) {
                    ls.keywords = "--";
                  }
                  if (ls.accessories == undefined) {
                    ls.accessories = "--";
                  }
                  ls.unitInStock = ls.productQuantity.toString();
                  if (ls.unitInStock < 0) {
                    ls.unitInStock = "0";
                  }
                  ls.noOfUnitSold = ls.noOfUnitSold;
                  if (ls.noOfUnitSold < 0 || ls.noOfUnitSold == undefined) {
                    ls.noOfUnitSold = "0";
                  }
                  ls.productMinDelivery = ls.productMinDelivery.toString();
                  let orderDetails = await orderDetailsModel.find({
                    productId: ls._id,
                    orderStatus: { $ne: "DELETE" },
                  });
                  let totalSalesValue = 0;
                  orderDetails.forEach((ele) => {
                    totalSalesValue = totalSalesValue + Number(ele.totalPrice);
                  });
                  ls.noOfOrder = orderDetails.length.toString();
                  ls.totalSalesValue = totalSalesValue.toString();
                  ls.Revenue = ls.commisionAddedByAdmin.toFixed(2).toString();
                  mainArray.push(ls);
                  // await Promise.all(await ls.map(async(subLs) => {
                  //     mainArray.push({...ls, ...subLs })
                  //     return;
                  // }));
                  delete ls;
                }

                // let resData = { orderList: cartItems, totalResult: totalResult, limit: limit };
                var recodeResponse =
                  await product_performance_list.makeExcelSheetWithData(
                    mainArray,
                    leaveBalanceArrayFormat
                  );
                // You can then return this straight
                return res
                  .attachment("product-performance.xlsx")
                  .send(recodeResponse);
                // Helper.response(res, 200, "Order details fetched successfully..", resData);
              } else {
                Helper.response(res, 404, "product not found", {
                  productList: [],
                });
              }
            } else {
              Helper.response(res, 404, "product not found", {
                productList: [],
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
        }
      }
    );
  },
  ServiceExcelsheet: async (req, res) => {
    const limit = req.query.limit ? parseInt(req.query.limit) : 2000;
    const page = req.query.page ? parseInt(req.query.page) : 1;
    var query = { status: { $ne: "Delete" } };
    // const col = { createdAt: 0, updatedAt: 0, __v: 0 };
    if (req.query.status) {
      query.status = { $eq: req.query.status };
    }
    if (req.query.search) {
      const searchObject = {
        $or: [
          { serviceName: { $regex: req.query.search, $options: "i" } },
          { serviceUniqId: { $regex: req.query.search, $options: "i" } },
          { supplierName: { $regex: req.query.search, $options: "i" } },
          { supplierContact: { $regex: req.query.search, $options: "i" } },
        ],
      };
      Object.assign(query, searchObject);
    }
    const agg = [
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
      {
        $project: {
          supplierId: 1,
          supplierName: "$supplier_details.basicInfo.founderName",
          supplierUniqId: "$supplier_details.supplierUniqId",
          supplierContact: "$supplier_details.basicInfo.contactNo",
          productCategoryId: 1,
          productCategory: "$product_details.productCategoryName",
          productSubCategory: "$subcategory_details.subCategoryName",
          // commisionAddedByAdmin: "$product_details.commisionAddedByAdmin",
          productSubCategoryId: 1,
          serviceName: 1,
          serviceDescription: 1,
          timeToInitiateService: 1,
          customizationAvailable: 1,
          typeOfService: 1,
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
        $match: query,
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

    logger.info("agg......query", JSON.stringify(agg));
    let myAggregate = serviceModel.aggregate(agg);
    console.log({ myAggregate });

    const result = await serviceModel.aggregatePaginate(myAggregate, options);
    // console.log({ result });

    const serviceList = result.docs;
    const totalResult = result.totalDocs;

    if (serviceList.length > 0) {
      let cartItems = serviceList;
      if (cartItems.length > 0) {
        let leaveBalanceArrayFormat = [
          { start: { row: 1, column: 1 }, end: { row: 1, column: 11 } },
          { start: { row: 2, column: 1 }, end: { row: 2, column: 11 } },
          // { start: { row: 3, column: 1 }, end: { row: 3, column: 8 } }
        ];
        var i = 3; // Start row
        var l = 3; // start column
        var mainArray = [];
        for await (let ls of cartItems) {
          l = l + ls.length;
          //For Column
          for (let index = 1; index <= 11; index++) {
            leaveBalanceArrayFormat.push({
              start: { row: i, column: index },
              end: { row: l, column: index },
            });
          }
          if (ls.awardRecognition == undefined) {
            ls.awardRecognition = "--";
          }
          if (ls.customizationAvailable == undefined) {
            ls.customizationAvailable = "--";
          }
          if (ls.keywords == undefined) {
            ls.keywords = "--";
          }
          if (ls.otherInformation == undefined) {
            ls.otherInformation = "--";
          }
          if (ls.typeOfService == undefined) {
            ls.typeOfService = "--";
          }
          if (ls.preRequisiteOffering == undefined) {
            ls.preRequisiteOffering = "--";
          }
          if (ls.price == undefined) {
            ls.price == "";
          } else {
            ls.price = ls.price.toString();
          }
          ls.commisionAddedByAdmin = "";
          console.log(ls, "lsssss");
          mainArray.push(ls);
          // await Promise.all(await ls.map(async(subLs) => {
          //     mainArray.push({...ls, ...subLs })
          //     return;
          // }));
          delete ls;
        }

        // let resData = { orderList: cartItems, totalResult: totalResult, limit: limit };
        var recodeResponse = await service_sales_list.makeExcelSheetWithData(
          mainArray,
          leaveBalanceArrayFormat
        );
        // You can then return this straight
        return res.attachment("service-sales.xlsx").send(recodeResponse);
        // Helper.response(res, 200, "Order details fetched successfully..", resData);
      } else {
        Helper.response(res, 404, "product not found", {
          productList: [],
        });
      }
    } else {
      Helper.response(res, 404, "product not found", {
        productList: [],
      });
    }
  },
  OrderExcelsheet: async (req, res) => {
    // const limit = req.query.limit ? parseInt(req.query.limit) : 25;
    const role = req.query.role;
    const page = req.query.page ? parseInt(req.query.page) : 1;
    var status = req.query.status ? req.query.status : null;
    var fileType = req.query.fileType ? req.query.fileType : "excel";
    var file_extension = "excel";
    if (fileType) {
      if (fileType == "csv" || fileType == "excel") file_extension = fileType;
    }
    var query = { orderStatus: { $ne: "DELETE" } };

    var startsDate = req.query.startDate ? req.query.startDate : null;
    var endsDate = req.query.endDate ? req.query.endDate : null;

    if (startsDate && endsDate) {
      startsDate = new Date(startsDate);
      startsDate.setUTCHours(0, 0, 0, 0);
      endsDate = new Date(endsDate);
      endsDate.setDate(endsDate.getDate() + 1);
      endsDate.setUTCHours(0, 0, 0, 0);
      // console.log(startsDate,'===',endsDate);return
      let dateFilter = {
        createdAt: { $gte: new Date(startsDate), $lte: new Date(endsDate) },
      };
      Object.assign(query, dateFilter);
    }

    if (status) {
      status = { orderStatus: status };
      Object.assign(query, status);
    } else {
      status = { orderStatus: { $ne: "DELETE" } };
      Object.assign(query, status);
    }

    if (req.query.search) {
      let searchObject = {
        $or: [
          {
            "customerDetails.name": { $regex: req.query.search, $options: "i" },
          },
          {
            "customerDetails.mobile": {
              $regex: req.query.search,
              $options: "i",
            },
          },
          {
            "productDetails.productName": {
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
        $lookup: {
          from: "OrderDetails",
          localField: "_id",
          foreignField: "primaryOrderId",
          as: "OrderDetails",
        },
      },
      { $unwind: "$OrderDetails" },
      {
        $lookup: {
          from: "Product",
          localField: "OrderDetails.productId",
          foreignField: "_id",
          as: "productDetails",
        },
      },
      { $unwind: "$productDetails" },
      {
        $lookup: {
          from: "Supplier",
          localField: "OrderDetails.supplierId",
          foreignField: "_id",
          as: "supplierDetails",
        },
      },
      { $unwind: "$supplierDetails" },
      {
        $lookup: {
          from: "Customer",
          localField: "customerId",
          foreignField: "_id",
          as: "customerDetails",
        },
      },
      { $unwind: "$customerDetails" },
      {
        $lookup: {
          from: "Address",
          localField: "addressId",
          foreignField: "_id",
          as: "addressDetails",
        },
      },
      { $unwind: "$addressDetails" },
      { $match: query },
      {
        $group: {
          _id: "$_id",
          orderId: { $first: "$parentOrderId" },
          customerId: { $first: "$customerDetails.customerUniqId" },
          customerName: { $first: "$customerDetails.name" },
          customerMobile: { $first: "$customerDetails.contactNo" },
          companyName: { $first: "$productDetails.companyName" },
          address: { $first: "$addressDetails.address" },
          state: { $first: "$addressDetails.state" },
          city: { $first: "$addressDetails.city" },
          pinCode: { $first: "$addressDetails.pinCode" },
          landMark: { $first: "$addressDetails.landMark" },
          street: { $first: "$addressDetails.street" },
          // Order Details
          deliveryMode: { $first: "$deliveryMode" },
          totalPrice: { $first: "$totalPrice" },
          paymentStatus: { $first: "$paymentStatus" },
          orderStatus: { $first: "$orderStatus" },
          paymentId: { $first: "$paymentId" },
          trackingId: { $first: "$trackingId" },
          createdAt: { $first: "$createdAt" },
          orderProducts: {
            $push: {
              productID: "$productDetails.productCode",
              // "productID": { $first: "$productDetails._id" },
              productName: "$productDetails.productName",
              productQuantity: "$productDetails.productQuantity",
              isDemo: "$productDetails.isDemo",
              OrderQuantity: "$OrderDetails.quantity",
              OrderTestResult: "$OrderDetails.testResult",
              OrderTotalPrice: "$OrderDetails.totalPrice",
              shippingCharges: "$OrderDetails.shippingCharge",
              productskuId: "$productDetails.skuId",
              serviceCategoryId: "$productDetails.serviceCategoryId",
              productType: "$productDetails.productType",
              commisionAddedByAdmin: {
                $toString: "$productDetails.commisionAddedByAdmin",
              },
              supplierUniqId: "$supplierDetails.supplierUniqId",
              supplierName: "$supplierDetails.basicInfo.founderName",
              supplierCity: "$supplierDetails.address.city",
            },
          },
        },
      },
      {
        $addFields: {
          typeOfOrder: {
            $cond: {
              if: { $gt: ["$totalPrice", 200000] },
              then: "Moderate",
              else: "Auto",
            },
          },
        },
      },
      {
        $addFields: {
          zipCode: { $toString: "$postalCode" },
        },
      },
      {
        $project: {
          orderId: 1,
          customerId: 1,
          customerName: 1,
          companyId: 1,
          customerMobile: 1,
          companyName: 1,
          unitNumber: 1,
          state: 1,
          city: 1,
          pinCode: 1,
          landMark: 1,
          address: 1,
          street: 1,
          deliveryMode: 1,
          totalPrice: 1,
          typeOfOrder: 1,
          paymentStatus: 1,
          orderStatus: 1,
          paymentId: 1,
          trackingId: 1,
          createdAt: 1,
          orderProducts: 1,
        },
      },
      { $sort: { createdAt: -1 } },
    ];
    const options = {
      page: page,
      // limit: limit,
      allowDiskUse: true,
    };
    let myAggregate = orderModel.aggregate(agg);

    orderModel.aggregatePaginate(
      myAggregate,
      options,
      async function (err, result) {
        if (err) {
          console.log(err);
          return Helper.response(res, 500, "Internal server error.");
        } else {
          if (result.docs.length > 0) {
            let cartItems = result.docs;
            // console.log(cartItems);
            // return;
            // let totalResult = result.totalDocs;
            if (cartItems.length > 0) {
              let leaveBalanceArrayFormat = [
                { start: { row: 1, column: 1 }, end: { row: 1, column: 15 } },
                { start: { row: 2, column: 1 }, end: { row: 2, column: 15 } },
                // { start: { row: 3, column: 1 }, end: { row: 3, column: 8 } }
              ];
              var i = 3; // Start row
              var l = 3; // start column
              var mainArray = [];
              for await (let ls of cartItems) {
                // if (i !== ls.orderProducts.length) {
                //   i = l;
                //   i = i + 1;
                // } else {
                //   i = i + 1;
                // }
                // l = l + ls.orderProducts.length;
                //For Column
                for (let index = 1; index <= 11; index++) {
                  leaveBalanceArrayFormat.push({
                    start: { row: i, column: index },
                    end: { row: l, column: index },
                  });
                }
                ls = JSON.parse(JSON.stringify(ls));
                let addressArr = [];
                if (ls.address) addressArr.push(ls.address);
                if (ls.street) addressArr.push(ls.street);
                if (ls.landMark) addressArr.push(ls.landMark);
                if (ls.city) addressArr.push(ls.city);
                if (ls.state) addressArr.push(ls.state);
                if (ls.pinCode) addressArr.push(ls.pinCode);
                ls.deliveryAddress = addressArr;
                ls.totalPrice = ls.totalPrice.toFixed(2).toString();
                await Promise.all(
                  await ls.orderProducts.map(async (subLs) => {
                    mainArray.push({ ...ls, ...subLs });
                    return;
                  })
                );

                delete ls.orderProducts;
              }
              // console.log(mainArray);
              // return;
              // let resData = { orderList: cartItems, totalResult: totalResult, limit: limit };
              var recodeResponse =
                await order_Details_list.makeExcelSheetWithData(
                  mainArray,
                  leaveBalanceArrayFormat
                );
              // You can then return this straight
              return res.attachment("orderDetails.xlsx").send(recodeResponse);
              // Helper.response(res, 200, "Order details fetched successfully..", resData);
            } else {
              Helper.response(res, 404, "Order not found", { orderList: [] });
            }
          } else {
            Helper.response(res, 404, "Order not found", { orderList: [] });
          }
        }
      }
    );
  },
  QueryResolution: async (req, res) => {
    try {
      var query = {
        status: { $ne: "Delete" },
      };
      var startsDate = req.query.startDate ? req.query.startDate : null;
      var endsDate = req.query.endDate ? req.query.endDate : null;

      if (startsDate && endsDate) {
        startsDate = new Date(startsDate);
        startsDate.setUTCHours(0, 0, 0, 0);
        endsDate = new Date(endsDate);
        endsDate.setDate(endsDate.getDate() + 1);
        endsDate.setUTCHours(0, 0, 0, 0);
        // console.log(startsDate,'===',endsDate);return
        let dateFilter = {
          createdAt: {
            $gte: new Date(startsDate),
            $lte: new Date(endsDate),
          },
        };
        Object.assign(query, dateFilter);
      }
      let supportData = await SupportModel.find(query).sort({ createdAt: -1 });
      if (supportData.length > 0) {
        let leaveBalanceArrayFormat = [
          { start: { row: 1, column: 1 }, end: { row: 1, column: 4 } },
          { start: { row: 2, column: 1 }, end: { row: 2, column: 4 } },
          // { start: { row: 3, column: 1 }, end: { row: 3, column: 8 } }
        ];
        var i = 3; // Start row
        var l = 3; // start column

        // console.log(mainArray);
        // return;
        // let resData = { orderList: cartItems, totalResult: totalResult, limit: limit };
        var mainArray = [];
        for await (let ls of supportData) {
          ls.dateOfResoluton = !ls.dateOfResoluton
            ? "--"
            : new Date(ls.dateOfResoluton);
          ls.status = ls.status == "resolve" ? "Resolved" : ls.status;
          mainArray.push(ls);
        }
        var recodeResponse = await query_resolution.makeExcelSheetWithData(
          supportData,
          leaveBalanceArrayFormat
        );
        // You can then return this straight
        return res.attachment("queryResolution.xlsx").send(recodeResponse);
        // Helper.response(res, 200, "Order details fetched successfully..", resData);
      } else {
        Helper.response(res, 404, "Support not found", {
          orderList: [],
        });
      }
    } catch (error) {
      console.log(error);
      logger.error(error);
      return Helper.response(res, 500, "Something went wrong.");
    }
  },
  RevenueReport: async (req, res) => {
    var query = { status: { $ne: "DELETE" } };
    let startsDate = req.query.startDate ? req.query.startDate : null;
    let endsDate = req.query.endDate ? req.query.endDate : null;
    endsDate = Helper.modifyDate(endsDate, 1);

    if (startsDate && endsDate) {
      const dateFilter = {
        createdAt: { $gte: new Date(startsDate), $lte: new Date(endsDate) },
      };
      Object.assign(query, dateFilter);
    }
    const agg = [
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
          from: "Product",
          localField: "productId",
          foreignField: "_id",
          as: "product_details",
        },
      },
      {
        $unwind: {
          path: "$product_details",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "Order",
          localField: "primaryOrderId",
          foreignField: "_id",
          as: "orderData",
        },
      },
      {
        $unwind: {
          path: "$orderData",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          supplierId: 1,
          supplierName: "$supplier_details.basicInfo.founderName",
          supplierUniqId: "$supplier_details.supplierUniqId",
          productId: 1,
          productName: "$product_details.productName",
          productPrice: "$product_details.productPrice",
          Revenue: "$product_details.commisionAddedByAdmin",
          shippingCharge: 1,
          gstAmount: "$orderData.gstAmount",
          orderId: 1,
          quantity: 1,
          totalPrice: 1,
          invoiceNumber: "$orderData.invoiceNumber",
          status: 1,
          createdAt: 1,
          updatedAt: 1,
        },
      },
      {
        $match: query,
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
    let myAggregate = orderDetailsModel.aggregate(agg);
    console.log({ myAggregate });

    const result = await orderDetailsModel.aggregatePaginate(
      myAggregate,
      options
    );
    // console.log({ result });

    const orderDetails = result.docs;
    const totalResult = result.totalDocs;

    if (orderDetails.length > 0) {
      let cartItems = orderDetails;
      if (cartItems.length > 0) {
        let leaveBalanceArrayFormat = [
          { start: { row: 1, column: 1 }, end: { row: 1, column: 11 } },
          { start: { row: 2, column: 1 }, end: { row: 2, column: 11 } },
          // { start: { row: 3, column: 1 }, end: { row: 3, column: 8 } }
        ];
        var i = 3; // Start row
        var l = 3; // start column
        var mainArray = [];
        for await (let ls of cartItems) {
          l = l + ls.length;
          //For Column
          for (let index = 1; index <= 11; index++) {
            leaveBalanceArrayFormat.push({
              start: { row: i, column: index },
              end: { row: l, column: index },
            });
          }
          mainArray.push(ls);
          // await Promise.all(await ls.map(async(subLs) => {
          //     mainArray.push({...ls, ...subLs })
          //     return;
          // }));
          delete ls;
        }

        // let resData = { orderList: cartItems, totalResult: totalResult, limit: limit };
        var recodeResponse = await revenue_report.makeExcelSheetWithData(
          mainArray,
          leaveBalanceArrayFormat
        );
        // You can then return this straight
        return res.attachment("revenueReport.xlsx").send(recodeResponse);
        // Helper.response(res, 200, "Order details fetched successfully..", resData);
      } else {
        Helper.response(res, 404, "product not found", {
          productList: [],
        });
      }
    } else {
      Helper.response(res, 404, "product not found", {
        productList: [],
      });
    }
  },
  InstallationPending: async (req, res) => {
    var query = { status: { $ne: "DELETE" } };
    let startsDate = req.query.startDate ? req.query.startDate : null;
    let endsDate = req.query.endDate ? req.query.endDate : null;
    endsDate = Helper.modifyDate(endsDate, 1);

    if (startsDate && endsDate) {
      const dateFilter = {
        createdAt: { $gte: new Date(startsDate), $lte: new Date(endsDate) },
      };
      Object.assign(query, dateFilter);
    }
    const agg = [
      {
        $lookup: {
          from: "Product",
          localField: "productId",
          foreignField: "_id",
          as: "product_details",
        },
      },
      {
        $unwind: {
          path: "$product_details",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "Order",
          localField: "primaryOrderId",
          foreignField: "_id",
          as: "orderData",
        },
      },
      {
        $unwind: {
          path: "$orderData",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "Customer",
          localField: "orderData.customerId",
          foreignField: "_id",
          as: "customerData",
        },
      },
      {
        $unwind: {
          path: "$customerData",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          _id: 1,
          productId: 1,
          productName: "$product_details.productName",
          productUniqueId: "$product_details.productUniqueId",
          productPrice: "$product_details.productPrice",
          orderId: 1,
          customerName: "$customerData.name",
          customerId: "$customerData.customerUniqId",
          createdAt: 1,
          updatedAt: 1,
        },
      },
      {
        $match: query,
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
    let myAggregate = orderDetailsModel.aggregate(agg);
    console.log({ myAggregate });

    const result = await orderDetailsModel.aggregatePaginate(
      myAggregate,
      options
    );
    // console.log({ result });

    const orderDetails = result.docs;
    const totalResult = result.totalDocs;

    if (orderDetails.length > 0) {
      let cartItems = orderDetails;
      if (cartItems.length > 0) {
        let leaveBalanceArrayFormat = [
          { start: { row: 1, column: 1 }, end: { row: 1, column: 21 } },
          { start: { row: 2, column: 1 }, end: { row: 2, column: 21 } },
          // { start: { row: 3, column: 1 }, end: { row: 3, column: 8 } }
        ];
        var i = 3; // Start row
        var l = 3; // start column
        var mainArray = [];
        for await (let ls of cartItems) {
          l = l + ls.length;
          //For Column
          for (let index = 1; index <= 11; index++) {
            leaveBalanceArrayFormat.push({
              start: { row: i, column: index },
              end: { row: l, column: index },
            });
          }
          var orderTrackData = await orderTrackModel.find({ orderId: ls._id });
          orderTrackData.forEach((orderTrack) => {
            if (orderTrack.orderStatus == "INSTALLATION REQUESTED") {
              ls.installationRequestData = orderTrack.orderStatusDate;
            } else {
              ls.installationRequestData = "";
            }
            if (orderTrack.orderStatus == "DELIVERED") {
              ls.dateOfDelivery = orderTrack.orderStatusDate;
            } else {
              ls.dateOfDelivery = "";
            }
          });
          mainArray.push(ls);
          // await Promise.all(await ls.map(async(subLs) => {
          //     mainArray.push({...ls, ...subLs })
          //     return;
          // }));
          delete ls;
        }

        // let resData = { orderList: cartItems, totalResult: totalResult, limit: limit };
        var recodeResponse = await installation_pending.makeExcelSheetWithData(
          mainArray,
          leaveBalanceArrayFormat
        );
        // You can then return this straight
        return res.attachment("installation-pending.xlsx").send(recodeResponse);
        // Helper.response(res, 200, "Order details fetched successfully..", resData);
      } else {
        Helper.response(res, 404, "product not found", {
          productList: [],
        });
      }
    } else {
      Helper.response(res, 404, "product not found", {
        productList: [],
      });
    }
  },
  OrderReturnRequest: async (req, res) => {
    var query = { status: { $ne: "DELETE" } };
    let startsDate = req.query.startDate ? req.query.startDate : null;
    let endsDate = req.query.endDate ? req.query.endDate : null;
    endsDate = Helper.modifyDate(endsDate, 1);

    if (startsDate && endsDate) {
      const dateFilter = {
        createdAt: { $gte: new Date(startsDate), $lte: new Date(endsDate) },
      };
      Object.assign(query, dateFilter);
    }
    const agg = [
      {
        $lookup: {
          from: "Customer",
          localField: "customerId",
          foreignField: "_id",
          as: "customerData",
        },
      },
      {
        $unwind: {
          path: "$customerData",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "OrderDetails",
          localField: "orderId",
          foreignField: "_id",
          as: "orderDetail",
        },
      },
      {
        $unwind: {
          path: "$orderDetail",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "Product",
          localField: "orderDetail.productId",
          foreignField: "_id",
          as: "productDetail",
        },
      },
      {
        $unwind: {
          path: "$productDetail",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "Supplier",
          localField: "orderDetail.supplierId",
          foreignField: "_id",
          as: "supplierDetail",
        },
      },
      {
        $unwind: {
          path: "$supplierDetail",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          _id: 1,
          orderId: 1,
          orderUniqId: "$orderDetail.orderId",
          customerName: "$customerData.name",
          customerUniqId: "$customerData.customerUniqId",
          supplierName: "$supplierDetail.basicInfo.founderName",
          supplierUniqId: "$supplierDetail.supplierUniqId",
          productName: "$productDetail.productName",
          productUniqueId: "$productDetail.productUniqueId",
          reason: 1,
          returnRequestDate: 1,
          createdAt: 1,
          updatedAt: 1,
        },
      },
      {
        $match: query,
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
    let myAggregate = returnOrderModel.aggregate(agg);
    console.log({ myAggregate });

    const result = await returnOrderModel.aggregatePaginate(
      myAggregate,
      options
    );
    // console.log({ result });

    const orderDetails = result.docs;
    const totalResult = result.totalDocs;

    if (orderDetails.length > 0) {
      let cartItems = orderDetails;
      if (cartItems.length > 0) {
        let leaveBalanceArrayFormat = [
          { start: { row: 1, column: 1 }, end: { row: 1, column: 11 } },
          { start: { row: 2, column: 1 }, end: { row: 2, column: 11 } },
          // { start: { row: 3, column: 1 }, end: { row: 3, column: 8 } }
        ];
        var i = 3; // Start row
        var l = 3; // start column
        var mainArray = [];
        for await (let ls of cartItems) {
          l = l + ls.length;
          //For Column
          for (let index = 1; index <= 11; index++) {
            leaveBalanceArrayFormat.push({
              start: { row: i, column: index },
              end: { row: l, column: index },
            });
          }
          var orderTrackData = await orderTrackModel.find({
            orderId: ls.orderId,
          });
          await Promise.all(
            orderTrackData.map(async function (orderTrack) {
              if (orderTrack.orderStatus === "PICKED UP") {
                ls.dateReturnPickUp = await orderTrack.orderStatusDate;
              } else {
                ls.dateReturnPickUp = "";
              }
              if (orderTrack.orderStatus === "DELIVERED") {
                ls.dateOfDelivery = await orderTrack.orderStatusDate;
              } else {
                ls.dateOfDelivery = "";
              }
            })
          );
          mainArray.push(ls);
          // await Promise.all(await ls.map(async(subLs) => {
          //     mainArray.push({...ls, ...subLs })
          //     return;
          // }));
          delete ls;
        }

        // let resData = { orderList: cartItems, totalResult: totalResult, limit: limit };
        var recodeResponse = await orderReturn_report.makeExcelSheetWithData(
          mainArray,
          leaveBalanceArrayFormat
        );
        // You can then return this straight
        return res.attachment("order-return-report.xlsx").send(recodeResponse);
        // Helper.response(res, 200, "Order details fetched successfully..", resData);
      } else {
        Helper.response(res, 404, "product not found", {
          productList: [],
        });
      }
    } else {
      Helper.response(res, 404, "product not found", {
        productList: [],
      });
    }
  },
  ProductReview: async (req, res) => {
    var query = { status: { $ne: "DELETE" } };
    let startsDate = req.query.startDate ? req.query.startDate : null;
    let endsDate = req.query.endDate ? req.query.endDate : null;
    endsDate = Helper.modifyDate(endsDate, 1);

    if (startsDate && endsDate) {
      const dateFilter = {
        createdAt: { $gte: new Date(startsDate), $lte: new Date(endsDate) },
      };
      Object.assign(query, dateFilter);
    }

    const agg = [
      {
        $lookup: {
          from: "Supplier",
          localField: "supplierId",
          foreignField: "_id",
          as: "supplierDetail",
        },
      },
      {
        $unwind: {
          path: "$supplierDetail",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "OrderDetails",
          localField: "productId",
          foreignField: "_id",
          as: "orderDetails",
        },
      },
      {
        $project: {
          _id: 1,
          supplierName: "$supplierDetail.basicInfo.founderName",
          supplierUniqId: "$supplierDetail.supplierUniqId",
          productName: 1,
          productUniqueId: 1,
          productQuantity: 1,
          noOfUnitSold: 1,
          noOfOrder: { $sum: "$orderDetails" },
          totalSalesValue: { $sum: "$orderDetails.totalPrice" },
          createdAt: 1,
          updatedAt: 1,
        },
      },
      {
        $match: query,
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
    console.log({ myAggregate });

    const result = await productModel.aggregatePaginate(myAggregate, options);
    // console.log({ result });

    const orderDetails = result.docs;
    const totalResult = result.totalDocs;

    if (orderDetails.length > 0) {
      let cartItems = orderDetails;
      if (cartItems.length > 0) {
        let leaveBalanceArrayFormat = [
          { start: { row: 1, column: 1 }, end: { row: 1, column: 10 } },
          { start: { row: 2, column: 1 }, end: { row: 2, column: 10 } },
          // { start: { row: 3, column: 1 }, end: { row: 3, column: 8 } }
        ];
        var i = 3; // Start row
        var l = 3; // start column
        var mainArray = [];
        for await (let ls of cartItems) {
          l = l + ls.length;
          //For Column
          for (let index = 1; index <= 11; index++) {
            leaveBalanceArrayFormat.push({
              start: { row: i, column: index },
              end: { row: l, column: index },
            });
          }
          var ratingCountRes = await ReviewModel.find({
            productId: ls._id,
          });
          var ratingCount = 0;
          await Promise.all(
            ratingCountRes.map(async (ele) => {
              ele = JSON.parse(JSON.stringify(ele));
              ratingCount = ele.rating + ratingCount;
            })
          );
          if (ratingCountRes.length) {
            ls.overallRating = Math.round(ratingCount / ratingCountRes.length); // web not show float value thats why round off
          } else {
            ls.overallRating = 0;
          }
          ls.noOfReview = ratingCountRes.length;
          ls.noOfUnitSold = ls.noOfUnitSold;
          if (ls.noOfUnitSold < 0 || ls.noOfUnitSold == undefined) {
            ls.noOfUnitSold = "0";
          }
          mainArray.push(ls);
          // await Promise.all(await ls.map(async(subLs) => {
          //     mainArray.push({...ls, ...subLs })
          //     return;
          // }));
          delete ls;
        }

        // let resData = { orderList: cartItems, totalResult: totalResult, limit: limit };
        var recodeResponse = await product_review.makeExcelSheetWithData(
          mainArray,
          leaveBalanceArrayFormat
        );
        // You can then return this straight
        return res
          .attachment("product-review-report.xlsx")
          .send(recodeResponse);
        // Helper.response(res, 200, "Order details fetched successfully..", resData);
      } else {
        Helper.response(res, 404, "product not found", {
          productList: [],
        });
      }
    } else {
      Helper.response(res, 404, "product not found", {
        productList: [],
      });
    }
  },
  ProductAccessories: async (req, res) => {
    var query = { status: { $ne: "DELETE" } };
    let startsDate = req.query.startDate ? req.query.startDate : null;
    let endsDate = req.query.endDate ? req.query.endDate : null;
    endsDate = Helper.modifyDate(endsDate, 1);

    if (startsDate && endsDate) {
      const dateFilter = {
        createdAt: { $gte: new Date(startsDate), $lte: new Date(endsDate) },
      };
      Object.assign(query, dateFilter);
    }

    const agg = [
      {
        $lookup: {
          from: "Supplier",
          localField: "supplierId",
          foreignField: "_id",
          as: "supplierDetail",
        },
      },
      {
        $unwind: {
          path: "$supplierDetail",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "OrderDetails",
          localField: "productId",
          foreignField: "_id",
          as: "orderDetails",
        },
      },
      {
        $project: {
          _id: 1,
          supplierName: "$supplierDetail.basicInfo.founderName",
          supplierUniqId: "$supplierDetail.supplierUniqId",
          productName: 1,
          productUniqueId: 1,
          productQuantity: 1,
          noOfUnitSold: 1,
          accesoriesRequirement: 1,
          accessories: 1,
          noOfOrder: { $sum: "$orderDetails" },
          totalSalesValue: { $sum: "$orderDetails.totalPrice" },
          createdAt: 1,
          updatedAt: 1,
        },
      },
      {
        $match: query,
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
    console.log({ myAggregate });

    const result = await productModel.aggregatePaginate(myAggregate, options);
    // console.log({ result });

    const orderDetails = result.docs;
    const totalResult = result.totalDocs;

    if (orderDetails.length > 0) {
      let cartItems = orderDetails;
      if (cartItems.length > 0) {
        let leaveBalanceArrayFormat = [
          { start: { row: 1, column: 1 }, end: { row: 1, column: 9 } },
          { start: { row: 2, column: 1 }, end: { row: 2, column: 9 } },
          // { start: { row: 3, column: 1 }, end: { row: 3, column: 8 } }
        ];
        var i = 3; // Start row
        var l = 3; // start column
        var mainArray = [];
        for await (let ls of cartItems) {
          l = l + ls.length;
          //For Column
          for (let index = 1; index <= 11; index++) {
            leaveBalanceArrayFormat.push({
              start: { row: i, column: index },
              end: { row: l, column: index },
            });
          }
          if (ls.accesoriesRequirement == undefined) {
            ls.accesoriesRequirement = "--";
          }
          ls.noOfUnitSold = ls.noOfUnitSold;
          if (ls.noOfUnitSold < 0 || ls.noOfUnitSold == undefined) {
            ls.noOfUnitSold = "0";
          }
          mainArray.push(ls);
          // await Promise.all(await ls.map(async(subLs) => {
          //     mainArray.push({...ls, ...subLs })
          //     return;
          // }));
          delete ls;
        }

        // let resData = { orderList: cartItems, totalResult: totalResult, limit: limit };
        var recodeResponse = await product_accessories.makeExcelSheetWithData(
          mainArray,
          leaveBalanceArrayFormat
        );
        // You can then return this straight
        return res.attachment("product-accessories.xlsx").send(recodeResponse);
        // Helper.response(res, 200, "Order details fetched successfully..", resData);
      } else {
        Helper.response(res, 404, "product not found", {
          productList: [],
        });
      }
    } else {
      Helper.response(res, 404, "product not found", {
        productList: [],
      });
    }
  },
};
