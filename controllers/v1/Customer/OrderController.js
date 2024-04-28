const mongoose = require("mongoose");
const { ObjectId } = mongoose.Types;
const Helper = require("../../../config/helper");
const { getSyncSignedUrl } = require("../../../lib/s3-services");
const jwt = require("jsonwebtoken");
const querystring = require("querystring");
const JWT_SECRET = process.env.JWT_SECRET;
const customerModel = require("../../../models/CustomerModel");
const productModel = require("../../../models/ProductModel");
const cartModel = require("../../../models/CartModel");
const orderModel = require("../../../models/OrderModel");
const orderDetailsModel = require("../../../models/OrderDetailsModel");
const adminModel = require("../../../models/AdminModel");
const { logger } = require("../../../logger/winston");
const CategoryModel = require("../../../models/ProductCategoryModel");
const OrderTrackModel = require("../../../models/orderTrackModel");
const ReturnOrderModel = require("../../../models/returnOrderModel");
const AddressModel = require("../../../models/AddressModel");
const axios = require("axios");
var _ = require("lodash");
const supplierModel = require("../../../models/SupplierModel");
const TransactionModel = require("../../../models/TransactionModel");
const moment = require("moment-timezone");
const pdfGeneratorHelper = require("../../../config/pdfGenerator");

module.exports = {
  order: async (req, res) => {
    try {
      var cartList = req.body.cartList;
      var customerId = req.user._id;
      var customerUniqId = req.user.customerUniqId;
      var paymentMode = req.body.paymentMode;
      var companyId = req.body.companyId;
      var paymentId = req.body.paymentId;
      var paymentStatus = req.body.paymentStatus;
      var addressId = req.body.addressId;
      var deliveryInstruction = req.body.deliveryInstruction;
      let addressArr = [];
      let amountReceived = 0;

      // promotional discount functionality
      const appliedPromo = req.body.appliedPromo ? req.body.appliedPromo : "";
      const promoDiscountAmount = req.body.promoDiscountAmount
        ? req.body.promoDiscountAmount
        : "";

      const currentHrs = await Helper.getCurrentHours();
      const [hours, minutes] = currentHrs.split(":");

      const generateCartId = await Helper.generateOrderProductUniqId(
        customerUniqId
      );

      let status = "PENDING";

      const generateInvoice = await Helper.generateInvoice();
      console.log(generateInvoice, "generateInvoice");

      var addressDetails = await AddressModel.findOne({
        _id: req.body.addressId,
      });
      if (!addressDetails) {
        return Helper.response(res, 404, "Invalid address id");
      }
      if (addressDetails.address) addressArr.push(addressDetails.address);
      if (addressDetails.street) addressArr.push(addressDetails.street);
      if (addressDetails.landMark) addressArr.push(addressDetails.landMark);
      if (addressDetails.pinCode) addressArr.push(addressDetails.pinCode);
      if (addressDetails.city) addressArr.push(addressDetails.city);
      if (paymentStatus == "Success")
        amountReceived = req.body.totalPrice < 200000 ? req.body.totalPrice : 0;

      const newOrder = new orderModel({
        customerId,
        companyId,
        appliedPromo,
        amountReceived,
        promoDiscountAmount,
        totalPrice: req.body.totalPrice,
        deliveryMode: req.body.deliveryMode,
        paymentId,
        addressId,
        invoiceNumber: generateInvoice,
        paymentStatus,
        discount: req.body.discount ? req.body.discount : 0,
        productMrp: req.body.productMrp ? req.body.productMrp : 0,
        gstAmount: req.body.gst ? req.body.gst : 0,
        deliveryInstruction: deliveryInstruction ? deliveryInstruction : "",
        parentOrderId: generateCartId,
        deliveryCharges: req.body.deliveryCharges,
        deliveryDate: await Helper.dateFormat(new Date(), 1),
        orderStatus: status,
      });

      const result = await newOrder.save();

      if (result) {
        const primaryOrderId = result._id;
        var productNameArr = [],
          htmlOrder = ``;
        await Promise.all(
          cartList.map(async (item, i) => {
            const { quantity, totalPrice } = item;
            const productId = item.productId;
            const cartId = item._id;

            const product = await productModel.findOne({ _id: productId });

            if (!product) {
              return Helper.response(res, 404, "Product not found!");
            }
            if (Number(product.productQuantity) < Number(quantity)) {
              return Helper.response(res, 404, "Insufficient stock");
            }
            if (product) {
              product.productQuantity =
                Number(product.productQuantity) - Number(quantity);
              product.noOfUnitSold = product.noOfUnitSold + Number(quantity);
              await product.save();
            }
            var supplierData = await supplierModel.findOne({
              _id: product.supplierId,
            });
            // calling shiprocket service api
            const token = await Helper.generateToken();
            const headers = {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            };
            let serviceApiRes = {
              pickup_postcode: supplierData.address.pinCode,
              delivery_postcode: addressDetails.pinCode,
              weight: product.productWeight,
              cod: 0,
            };
            const requestConfig = {
              method: "GET",
              url: process.env.SHIPROCKET_URL + `/courier/serviceability/`,
              headers: headers,
              data: serviceApiRes,
            };
            const response = await axios(requestConfig);
            logger.info(
              `shiprocket get courier serviceability in order api ${JSON.stringify(
                response.data
              )}`
            );
            productNameArr.push(product.productName);
            const counterNumber = String(++i).padStart(3, "0");
            const orderId = generateCartId + "-" + counterNumber;
            const totalAmount = Number(quantity) * Number(totalPrice);
            var orderDetails = new orderDetailsModel({
              primaryOrderId,
              productId: product._id,
              supplierId: product.supplierId,
              productType: product.productType,
              quantity,
              paymentMode,
              orderId,
              shippingCharge:
                response.data.data.available_courier_companies[0].rate,
              courierId:
                response.data.data.available_courier_companies[0]
                  .courier_company_id,
              etd: response.data.data.available_courier_companies[0].etd,
              totalPrice: totalAmount,
            });

            var resultRes = await orderDetails.save();

            if (resultRes) {
              const subOrderId = resultRes._id;

              const checkOrderTrack = await OrderTrackModel.findOne({
                orderId: subOrderId,
                orderStatus: status,
              });
              if (checkOrderTrack) {
                await OrderTrackModel.findOneAndUpdate(
                  { orderId, orderStatus: status },
                  { $set: { orderStatusDate: moment().format() } },
                  { new: true }
                );
              } else {
                const orderTrack = new OrderTrackModel({
                  orderId: subOrderId,
                  orderStatus: status,
                  orderStatusDate: new Date(),
                });
                orderTrack.save();
              }
              await cartModel.deleteOne({ _id: cartId });
              if (paymentStatus === "Success") {
                await customerModel.findOneAndUpdate(
                  { _id: customerId },
                  { $set: { isDiscount: false } },
                  { new: true, useFindAndModify: false }
                );
              }

              await Helper.sendNotification(
                customerId,
                "customer",
                product._id,
                `Dear ${req.user.name}, your order for product ${product.productName} has been placed`,
                "order placed",
                "Order placed!",
                product.supplierId
              );
              await Helper.sendNotification(
                product.supplierId,
                "supplier",
                product._id,
                `You have a new order from ${req.user.name} for the product ${product.productName}`,
                "order received",
                "New order",
                customerId
              );
              htmlOrder += `<br>
                                        Product : ${product.productName}<br>
                                        Quantity: ${item.quantity} <br>
                                        Amount: ${item.totalPrice} <br><br>`;

              //--------------------------------------- seller email --------------------------------------
              var event = new Date(result.createdAt);
              var dateDetails = Helper.nextDayDate(event, "");

              let supplier = supplierData.basicInfo;
              //  Committed delivery time: ${await Helper.nextDayDate(  new Date(), 1   )}, 07:00 pm<br>
              var sellerHtml = `
                                Dear <b>${supplier.founderName},</b><br><br>
                                    You have received a new order for ${product.productName} on ${dateDetails}. Details of the received order is as: <br><br>
                                    Order id: ${result.parentOrderId}<br> 
                                    Amount: ${totalAmount} <br>
                                    Quantity: ${item.quantity} <br>
                                    Shipping Address: ${addressArr} <br>
                                    Customer name: ${req.user.name} <br><br>
                                To confirm the order and shipping committment. <a href="${process.env.SELLER_ORDER_LIST_URL}" type="button">Received Orders</a><br><br><br>`;

              if (supplier.emailId != "" && paymentStatus == "Success") {
                await Helper.send365Email(
                  process.env.MAIL_SEND_EMAIL,
                  supplier.emailId,
                  `New order received for ${product.productName} from project`,
                  sellerHtml,
                  "text"
                );
              }
            }
          })
        );

        //for buyer
        var event = new Date(result.createdAt);
        let date = JSON.stringify(event);
        var dateDetails = date.slice(1, 11);
        var html = `
                Dear <b>${req.user.name},</b><br><br>
                    Thank you for placing order with project. <br>
                    Your order for ${productNameArr} for amount of ₹ ${req.body.totalPrice} has been successfully placed. <br><br>
                    Order Number: ${result.parentOrderId}<br>
                    Order Date: ${dateDetails}<br>
                    Shipping Address: ${addressArr} <br>
                    Contact information: ${req.user.contactNo}<br>
                The details of the order is as-<br>`;
        // Loop through the products in result
        html += htmlOrder;
        html += `
                    <a href="${process.env.BUYER_ORDER_LIST_URL}" type="button">Your orders</a><br><br>
                    You will receive the next update when the items in your order are packed/shipped by the seller. Please note, sellers ship items based on their availability so they can reach you within the shortest possible time possible. Due this, you may get items from the same orders as different shipments and you can easily track them. 
                      <a href="${process.env.BUYER_ORDER_TRACK_URL}${result._id}" type="button">Track Your Order</a><br><br>
                    <br><br><br>`;
        if (paymentStatus == "Success") {
          await Helper.send365Email(
            process.env.MAIL_SEND_EMAIL,
            req.user.emailId,
            `Your order for ${productNameArr} has been successfully placed on project`,
            html,
            "text"
          );
        }

        return Helper.response(
          res,
          200,
          "Your order has been placed successfully!",
          {
            orderResponse: generateCartId,
            addressDetails,
            orderId: primaryOrderId,
          }
        );
      }
    } catch (err) {
      console.log(err, "Rr");
      logger.error(err);
      return Helper.response(res, 500, "Server error.", err);
    }
  },
  orderDetails: async (req, res) => {
    const limit = req.query.limit ? parseInt(req.query.limit) : 25;
    const page = req.query.page ? parseInt(req.query.page) : 1;
    const query = {
      status: {
        $ne: "Delete",
      },
    };
    const customerId = req.user._id;
    let agg = [
      {
        $match: {
          customerId: new ObjectId(customerId),
        },
      },
      {
        $lookup: {
          from: "OrderDetails",
          localField: "_id",
          foreignField: "primaryOrderId",
          as: "OrderDetails",
        },
      },
      {
        $unwind: "$OrderDetails",
      },
      {
        $lookup: {
          from: "Address",
          localField: "addressId",
          foreignField: "_id",
          as: "AddressDetails",
        },
      },
      {
        $unwind: "$AddressDetails",
      },
      {
        $lookup: {
          from: "Product",
          localField: "OrderDetails.productId",
          foreignField: "_id",
          as: "productDetails",
        },
      },
      {
        $unwind: "$productDetails",
      },
      {
        $addFields: {
          "OrderDetails.productDetails": "$productDetails",
          // "OrderDetails.companyName": "$companyDetails.companyName",
          // "OrderDetails.avgRating": {
          //     "$cond": {
          //         "if": { "$eq": [{ "$size": "$ratings" }, 0] },
          //         "then": 0,
          //         "else": { "$toInt": { "$avg": "$ratings.rating" } }
          //     }
          // },
          // "OrderDetails.ratingCount": { $size: "$ratings" },
          // "OrderDetails.testResult": {
          //     $cond: { if: { $eq: ["$OrderDetails.testResult", "FirstApproval"] }, then: "Pending", else: "$OrderDetails.testResult" }
          // },
        },
      },
      {
        $group: {
          _id: "$_id",
          orderDetails: {
            $push: "$OrderDetails",
          },
          cat_title: {
            $first: "$categorized",
          },
          subCategory: {
            $first: "$subCategory.subcategory_title",
          },
          deliveryMode: {
            $first: "$deliveryMode",
          },
          totalPrice: {
            $first: "$totalPrice",
          },
          deliveryCharges: {
            $first: "$deliveryCharges",
          },
          paymentStatus: {
            $first: "$paymentStatus",
          },
          orderStatus: {
            $first: "$orderStatus",
          },
          discount: {
            $first: "$discount",
          },
          paymentId: {
            $first: "$paymentId",
          },
          addressId: {
            $first: "$addressId",
          },
          addressDetails: {
            $first: "$AddressDetails",
          },
          deliveryInstruction: {
            $first: "$deliveryInstruction",
          },
          parentOrderId: {
            $first: "$parentOrderId",
          },
          attachmentFiles: {
            $first: "$attachmentFiles",
          },
          createdAt: {
            $first: "$createdAt",
          },
          companyDetails: {
            $first: "$companyDetails",
          },
          deliveryDate: {
            $first: "$deliveryDate",
          },
          appliedPromo: {
            $first: "$appliedPromo",
          },
          promoDiscountAmount: {
            $first: "$promoDiscountAmount",
          },
        },
      },
      {
        $project: {
          orderDetails: 1,
          addressDetails: 1,
          deliveryMode: 1,
          totalPrice: 1,
          deliveryCharges: 1,
          discount: 1,
          paymentStatus: 1,
          orderStatus: 1,
          paymentId: 1,
          addressId: 1,
          createdAt: 1,
          companyId: 1,
          parentOrderId: 1,
          attachmentFiles: 1,
          deliveryDate: 1,
          deliveryInstruction: {
            $cond: {
              if: "$deliveryInstruction",
              then: "$deliveryInstruction",
              else: "",
            },
          },
          appliedPromo: {
            $cond: {
              if: "$appliedPromo",
              then: "$appliedPromo",
              else: "",
            },
          },
          promoDiscountAmount: {
            $cond: {
              if: "$promoDiscountAmount",
              then: "$promoDiscountAmount",
              else: "",
            },
          },
        },
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
    var totalResult = await orderModel
      .find({
        customerId: new ObjectId(customerId),
      })
      .count();
    let myAggregate = await orderModel
      .aggregate(agg)
      .skip((page - 1) * limit)
      .limit(limit);
    let orderItems = myAggregate;
    if (orderItems.length > 0) {
      await Promise.all(
        orderItems.map(async function (element) {
          await Promise.all(
            element.orderDetails.map(async function (item) {
              if (item.productDetails.productImages.length > 0) {
                let productImages = [];
                for (
                  let i = 0;
                  i < item.productDetails.productImages.length;
                  i++
                ) {
                  console.log(process.env.IMAGE_URL);
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
                  console.log(process.env.IMAGE_URL);
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
              //deliveryDate
              element.deliveryDate = element.deliveryDate
                ? element.deliveryDate
                : await Helper.dateFormat(new Date(element.createdAt), 1);

              item.isResult = false; // result visible only test kit category
              let productCategoryId = item.productDetails.productCategoryId;
              if (productCategoryId) {
                let category = await CategoryModel.findOne(
                  {
                    _id: productCategoryId,
                  },
                  {
                    categoryName: 1,
                  }
                );
                item.isResult =
                  category.categoryName == "Test Kits" ? true : false;
              }
            })
          );
        })
      );
      let resData = {
        orderList: orderItems,
        totalResult: totalResult,
        limit: limit,
      };
      return Helper.response(
        res,
        200,
        "Order details fetched successfully..",
        resData
      );
    } else {
      return Helper.response(res, 404, "Order not found", {
        orderList: [],
      });
    }
  },
  cancelOrder: async (req, res) => {
    try {
      const orderId = req.params.orderId;
      const updateObj = {
        orderStatus: "CANCELED",
        isRead: false,
        isReadSeller: false,
      };
      const orderDetails = await orderDetailsModel.findOneAndUpdate(
        {
          _id: new ObjectId(orderId),
        },
        updateObj,
        { new: true }
      );
      if (!orderDetails) {
        return Helper.response(res, 404, "No data found");
      }
      await orderModel.findOneAndUpdate(
        {
          _id: new ObjectId(orderDetails.primaryOrderId),
        },
        {
          $set: updateObj,
        },
        {
          new: true,
        }
      );
      const product = await productModel.findOne({
        _id: orderDetails.productId,
      });

      if (product) {
        product.productQuantity =
          Number(product.productQuantity) + Number(orderDetails.quantity);
        product.noOfUnitSold =
          Number(product.noOfUnitSold) - Number(orderDetails.quantity);
        await product.save();
      } else {
        return Helper.response(res, 404, "Product not found!");
      }
      const checkOrderTrack = await OrderTrackModel.findOne({
        orderId,
        orderStatus: "CANCELED",
      });
      if (checkOrderTrack) {
        await OrderTrackModel.findOneAndUpdate(
          {
            orderId,
            orderStatus: "CANCELED",
          },
          {
            $set: {
              orderStatusDate: moment().format(),
            },
          },
          {
            new: true,
          }
        );
      } else {
        var orderTrack = new OrderTrackModel({
          orderId: orderId,
          orderStatus: "CANCELED",
          orderStatusDate: moment().format(),
        });
        orderTrack.save();
      }
      // const updatedOrder = await orderModel
      //   .findOneAndUpdate(
      //     {
      //       _id: new ObjectId(orderId),
      //     },
      //     {
      //       $set: updateObj,
      //     },
      //     {
      //       new: true,
      //     }
      //   )
      //   .lean();

      // if (!updatedOrder) {
      //   return Helper.response(res, 400, "No data found");
      // }

      Helper.response(res, 200, "Order Cancelled Successfully", {
        orderResponse: {
          _id: orderId,
          orderStatus: orderDetails.orderStatus,
        },
      });
    } catch (error) {
      console.error(error);
      Helper.response(res, 500, "Internal Server Error");
    }
  },
  getResult: async (req, res) => {
    try {
      let { orderId, productId } = req.query;
      if (!orderId) {
        return Helper.response(res, 500, "Order is required");
      }
      if (!productId) {
        return Helper.response(res, 500, "Product is required");
      }
      let filter = {
        orderId: ObjectId(orderId),
        productId: ObjectId(productId),
      };
      // console.log(req.query, "check")  // return
      // get the test result for the particular product
      const isExists = await testResultModel
        .find(filter, {
          __v: 0,
        })
        .lean()
        .exec();
      if (isExists.length > 0) {
        for await (ls of isExists) {
          let keynames = Object.keys(ls);
          for await (sub_ls of keynames) {
            let alpha_diversity = sub_ls.toString().replace(/_/g, " ");
            alpha_diversity = await Helper.CapitalizeWordString(
              alpha_diversity
            );
            let fil = {
              testParameter: {
                $eq: alpha_diversity.slice(),
              },
            };
            let data = await TestParameterModel.findOne(fil);
            if (sub_ls == "carb_&_fiber_score") {
              var isObject = {
                carbsFiber: ls[sub_ls],
              };
            }
            if (data) {
              ls[sub_ls + "_data"] = {
                result: ls[sub_ls],
                lowRange: data.lowRange,
                highRange: data.highRange,
                information: data.information,
              };
              delete ls[sub_ls];
            }
          }
        }

        // get nutrition products on the basis of result
        const isResult = await testResultModel
          .findOne(filter, {
            __v: 0,
          })
          .lean()
          .exec();
        let query = [
          {
            $match: {
              productType: "Nutrition",
              status: "Active",
            },
          },
          {
            $lookup: {
              from: "ProductRange",
              localField: "_id",
              foreignField: "productId",
              as: "ProductRange",
            },
          },
          {
            $unwind: "$ProductRange",
          },
          {
            $lookup: {
              from: "PetCategory",
              localField: "petCategoryId",
              foreignField: "_id",
              as: "petType",
            },
          },
          {
            $unwind: "$petType",
          },
          {
            $lookup: {
              from: "ProductRating",
              localField: "_id",
              foreignField: "productId",
              as: "ratings",
            },
          },
          {
            $addFields: {
              ratings: {
                $cond: {
                  if: {
                    $eq: [
                      {
                        $size: "$ratings",
                      },
                      0,
                    ],
                  },
                  then: 0,
                  else: {
                    $avg: "$ratings.rating",
                  },
                },
              },
              petType: "$petType.name",
            },
          },
        ];

        const nutritionProduct = await productModel.aggregate(query);
        var suggestedFood = [];
        await Promise.all(
          nutritionProduct.map(async function (item, i) {
            var isCount = 0;
            if (
              isResult.alpha_diversity >=
                item.ProductRange.alphaDiversityLowerLimit &&
              isResult.alpha_diversity <=
                item.ProductRange.alphaDiversityUpperLimit
            ) {
              isCount++;
            }
            if (
              isResult.evenness >= item.ProductRange.evennessLowerLimit &&
              isResult.evenness <= item.ProductRange.evennessUpperLimit
            ) {
              isCount++;
            }
            if (
              isResult.richness >= item.ProductRange.richnessLowerLimit &&
              isResult.richness <= item.ProductRange.richnessUpperLimit
            ) {
              isCount++;
            }
            if (
              isResult.protein_score >=
                item.ProductRange.proteinScoreLowerLimit &&
              isResult.protein_score <= item.ProductRange.proteinScoreUpperLimit
            ) {
              isCount++;
            }
            if (
              isResult.fat_score >= item.ProductRange.fatScoreLowerLimit &&
              isResult.fat_score <= item.ProductRange.fatScoreUpperLimit
            ) {
              isCount++;
            }
            if (
              isObject.carbsFiber >=
                item.ProductRange.carbFiberScoreLowerLimit &&
              isObject.carbsFiber <= item.ProductRange.carbFiberScoreUpperLimit
            ) {
              isCount++;
            }
            if (
              isResult.chondroitin_score >=
                item.ProductRange.chondroitinScoreLowerLimit &&
              isResult.chondroitin_score <=
                item.ProductRange.chondroitinScoreUpperLimit
            ) {
              isCount++;
            }
            if (
              isResult.gut_shield_score &&
              isResult.gut_shield_score >=
                item.ProductRange.gutShieldScoreLowerLimit &&
              isResult.gut_shield_score <=
                item.ProductRange.gutShieldScoreUpperLimit
            ) {
              isCount++;
            }
            delete item.ProductRange;
            // console.log(isCount, '<<isCount', i)
            if (isCount >= 4) {
              if (item.productImages.length > 0) {
                let productImages = [];
                for (let i = 0; i < item.productImages.length; i++) {
                  productImages.push({
                    imgUrl: getSyncSignedUrl(
                      item.productImages[i].imgS3Key,
                      "image/jpg"
                    ),
                    isPrimary: item.productImages[i].isPrimary,
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
                  productImageThumbnail.push({
                    imgUrl: getSyncSignedUrl(
                      item.productImageThumbnail[i].imgS3Key,
                      "image/jpg"
                    ),
                    isPrimary: item.productImageThumbnail[i].isPrimary,
                  });
                }
                item.productImageThumbnail = productImageThumbnail;
              }
              suggestedFood.push(item);
            }
          })
        );
        console.log(suggestedFood.length, "<<suggestedFood");
        Helper.response(res, 200, "Test result fetched successfully..", {
          testResultList: isExists,
          foodSuggestion: suggestedFood,
        });
      } else {
        Helper.response(res, 404, "No record found...", {
          testResultList: [],
        });
      }
    } catch (err) {
      console.log(err);
      return Helper.handlerMongooseErrorResponse(res, err);
    }
  },
  getCompanyDetails: async (req, res) => {
    const limit = req.query.limit ? parseInt(req.query.limit) : 5;
    const page = req.query.page ? parseInt(req.query.page) : 1;
    const status = req.query.status ? req.query.status : "";
    const companyId = req.query.companyId ? req.query.companyId : "";
    let query = {
      _id: ObjectId(companyId),
      status: {
        $ne: "Delete",
      },
      role: "company",
    };
    if (status) {
      query = {
        status: {
          $eq: status,
        },
      };
    }
    if (!companyId) {
      return Helper.response(res, 500, "Company id is required");
    }
    // console.log(query);
    const col = {
      password: 0,
      JWT_Token: 0,
      certificates: 0,
      license: 0,
    };
    if (req.query.search) {
      var searchObject = {
        $or: [
          {
            companyName: {
              $regex: req.query.search,
              $options: "i",
            },
          },
        ],
      };
      Object.assign(query, searchObject);
    }
    adminModel
      .paginate(query, {
        page: page,
        sort: {
          createdDate: -1,
        },
        limit: limit,
        select: col,
      })
      .then((result) => {
        var companyList = result.docs;
        var totalResult = result.total;
        if (companyList.length > 0) {
          var resData = {
            companyList: companyList,
            totalResult: totalResult,
            limit: limit,
          };
          Helper.response(
            res,
            CODES.STATUS_CODES.OK,
            "Company details fetch successfully",
            resData
          );
        } else {
          Helper.response(
            res,
            CODES.STATUS_CODES.Not_Found,
            MSG.company.fetch[LOCALE || "en"],
            {
              companyList: [],
            }
          );
        }
      })
      .catch((err) => {
        return Helper.response(
          res,
          CODES.STATUS_CODES.Internal_Server_Error,
          MSG.serverError[LOCALE || "en"]
        );
      });
  },
  gatewaySession: async (req, res) => {
    try {
      let { amount } = req.body;
      let data = JSON.stringify({
        amount: amount * 100,
        currency: "SGD",
        successUrl: "https://example.com/success",
        cancelUrl: "https://example.com/cancel",
      });

      let config = {
        method: "post",
        maxBodyLength: Infinity,
        url: paymentUrl,
        headers: {
          "Content-Type": "application/json",
          Authorization:
            "Basic QlBQX0FVVEhfVVNFUjokMmEkMTAkWG9FcDRVY0UwenI5YzQudEtkYnAwT3Z1cGp3cndxczhEeTlO",
          Cookie:
            "JSESSIONID=HxC31Cmj9nsgO6bxNClaQ07nRQSy0gy5iPD46w10.bppapp01",
        },
        data: data,
      };
      const response = await axios.request(config);
      logger.info(`Generate payment gateway api response: ${response.data} `);
      return Helper.response(res, 200, "Payment gateway response", {
        response: response.data,
      });
    } catch (error) {
      console.error(error);
      logger.error(`####### payment gateway ######### error: ${error} `);
      return Helper.response(res, 500, {
        error: error,
      });
    }
  },
  getPaymentStatus: async (req, res) => {
    try {
      const paymentId = req.query.paymentId;
      var name = _.capitalize(req.user.name);
      var device_token = req.user.device_Token;
      let data = JSON.stringify({
        paymentId: paymentId,
      });

      let config = {
        method: "post",
        maxBodyLength: Infinity,
        url: checkPaymentStatusUrl,
        headers: {
          "Content-Type": "application/json",
          Authorization:
            "Basic QlBQX0FVVEhfVVNFUjokMmEkMTAkWG9FcDRVY0UwenI5YzQudEtkYnAwT3Z1cGp3cndxczhEeTlO",
          Cookie:
            "JSESSIONID=FJThHapGvMG5252kOvIEkAQx03KXL7jINKnQa1H1.bppapp01",
        },
        data: data,
      };
      const response = await axios.request(config);
      var isUpdate = await orderModel
        .findOneAndUpdate(
          {
            paymentId,
            paymentStatus: "Pending",
          },
          {
            $set: {
              paymentStatus: response.data.status,
            },
          },
          {
            new: true,
            useFindAndModify: false,
          }
        )
        .lean();
      console.log("<<<isUpdate", isUpdate);
      logger.info(`MarketPlace paymentStatus api response: ${isUpdate} `);
      // if (response.data.status == "succeeded") {
      //     var title = "Order Placed Successfully"
      //     var msg = `Hi ${name}, Thank You for choosing Mobipetz. Your order (ID: ${isUpdate.parentOrderId}) of $${isUpdate.totalPrice} has been successfully placed. Thanks for being a part of our goodness journey.`
      // } else {
      //     var title = "Transaction Failed!"
      //     var msg = `We're sorry, but your transaction for order ${isUpdate.parentOrderId} has failed. Please check your payment details and try again.`
      // }
      // await Helper.sendPushNotification(serverKey, device_token, '0', title, msg)
      if (isUpdate && response.data.status != "succeeded") {
        const orderId = isUpdate._id;
        const orderDetails = await orderDetailsModel.find({
          primaryOrderId: orderId,
        });

        await Promise.all(
          orderDetails.map(async function (item) {
            const product = await productModel.findOne({
              _id: item.productId,
            });
            if (product) {
              product.productQuantity += item.quantity;
              await product.save();
            } else {
              return Helper.response(res, 404, "Product not found!");
            }
          })
        );
      } else {
        return Helper.response(
          res,
          200,
          "Payment status successfully updated!",
          response.data
        );
      }
      return Helper.response(res, 200, "Fetch payment status..", response.data);
    } catch (error) {
      console.error(error);
    }
  },
  verifyPromo: async (req, res) => {
    try {
      let { companyId, promoCode } = req.body;
      var date = new Date(req.currentDate);
      const query = {
        promoCode,
        companyId: ObjectId(companyId),
        status: "Active",
      };
      // console.log(query, "query")
      const promoBanners = await promoBannerModel.findOne(query, {
        title: 1,
        bannerName: 1,
        promoCode: 1,
        productCategoryId: 1,
        subCategoryId: 1,
        minAmountPurchase: 1,
        amountPercentage: 1,
        discountAmount: 1,
      });
      if (promoBanners) {
        const promo = await promoBannerModel.findOne({
          _id: promoBanners._id,
          startDate: {
            $lte: Helper.dateFormat(date),
          },
          endDate: {
            $gte: await Helper.dateFormat(date),
          },
        });
        if (promo) {
          console.log(promo, "Promo Applied"); //Promo Applied
          return Helper.response(res, 200, "Promo applied..", {
            isApplied: true,
            promo: promoBanners,
          });
        } else {
          console.log("expired!"); //Promo expired
          return Helper.response(res, 200, "Promo code is expired!", {
            isApplied: false,
          });
        }
      } else {
        console.log("not valid!");
        return Helper.response(res, 200, "Promo code is not valid!", {
          isApplied: false,
        });
      }
    } catch (error) {
      console.error(error);
      return Helper.response(res, 500, {
        error: error,
      });
    }
  },
  list: async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit) : 25;
      const page = req.query.page ? parseInt(req.query.page) : 1;
      var status = req.query.status ? req.query.status : null;
      var query = {};
      if (status) {
        var finalStatusArr = [];
        const statusArray = status.split(",");
        statusArray.forEach((ele) => {
          if (ele == "ORDER PLACED") {
            finalStatusArr.push("PENDING");
          } else {
            finalStatusArr.push(ele);
          }
        });
        status = {
          $in: finalStatusArr,
        };
        Object.assign(query, status);
      } else {
        status = {
          $nin: ["DELETE"],
        };
        Object.assign(query, status);
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
        {
          $unwind: "$OrderDetails",
        },
        { $match: { "OrderDetails.orderStatus": status } },
        {
          $lookup: {
            from: "Product",
            localField: "OrderDetails.productId",
            foreignField: "_id",
            as: "productDetail",
          },
        },
        {
          $unwind: "$productDetail",
        },
        {
          $lookup: {
            from: "OrderTrack",
            localField: "OrderDetails._id",
            foreignField: "orderId",
            as: "OrderTrackDetail",
          },
        },
        // {
        //   $unwind: "$OrderTrackDetail",
        // }
        {
          $addFields: {
            "OrderDetails.productDetails": {
              productName: "$productDetail.productName",
              productImages: "$productDetail.productImages",
              productPrice: "$productDetail.productPrice",
              categoryType: "$productDetail.categoryType",
              productCode: "$productDetail.productCode",
              productUniqueId: "$productDetail.productUniqueId",
              quantity: "$OrderDetails.quantity",
              shippingPreference: {
                $cond: {
                  if: "$OrderDetails.shippingPreference",
                  then: "OrderDetails.shippingPreference",
                  else: "self-managed",
                },
              },
            },
            "OrderDetails.orderStatus": {
              $cond: {
                if: { $eq: ["$OrderDetails.orderStatus", "PENDING"] },
                then: "ORDER PLACED",
                else: "$OrderDetails.orderStatus",
              },
            },
            "OrderDetails.orderTrackStatus": "$OrderTrackDetail",
          },
        },
        {
          $match: {
            orderStatus: {
              $ne: "Delete",
            },
            customerId: req.user._id,
          },
        },
        {
          $group: {
            _id: "$_id",
            orderDetails: {
              $push: "$OrderDetails",
            },
            addressId: {
              $first: "$addressId",
            },
            parentOrderId: {
              $first: "$parentOrderId",
            },
            createdAt: {
              $first: "$createdAt",
            },
            amountReceived: {
              $first: {
                $cond: {
                  if: "$amountReceived",
                  then: "$amountReceived",
                  else: 0,
                },
              },
            },
          },
        },
        // {
        //   $match: query
        // },
        {
          $project: {
            orderDetails: 1,
            // productDetails: "$productDetails",
            addressId: 1,
            parentOrderId: 1,
            createdAt: 1,
            orderCount: { $size: "$orderDetails" },
            amountReceived: 1,
          },
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

      let myAggregate = orderModel.aggregate(agg);
      orderModel.aggregatePaginate(
        myAggregate,
        options,
        async function (err, result) {
          if (err) {
            console.log("err", err);
            return Helper.response(res, 500, "Internal server error.");
          } else {
            if (result.docs.length > 0) {
              let cartItems = result.docs;
              let totalResult = result.totalDocs;
              if (cartItems.length > 0) {
                await Promise.all(
                  cartItems.map(async function (item) {
                    await Promise.all(
                      item.orderDetails.map(async function (orderDetail) {
                        if (
                          orderDetail.productDetails.productImages &&
                          orderDetail.productDetails.productImages.length > 0
                        ) {
                          let productImages = [];
                          for (
                            let i = 0;
                            i < orderDetail.productDetails.productImages.length;
                            i++
                          ) {
                            productImages.push({
                              imgUrl:
                                process.env.IMAGE_URL +
                                "suppliers/" +
                                orderDetail.productDetails.productImages[i]
                                  .imgName,
                              imgName:
                                orderDetail.productDetails.productImages[i]
                                  .imgName,
                            });
                          }
                          orderDetail.productDetails.productImages =
                            productImages;
                        }
                        orderDetail.orderTrackStatus.forEach((track) => {
                          if (track.orderStatus == "PENDING") {
                            track.orderStatus = "ORDER PLACED";
                          }
                        });
                        const token = await Helper.generateToken();
                        orderDetail.awbCode =
                          orderDetail && orderDetail.awbDetails
                            ? orderDetail.awbDetails.response.data.awb_code
                            : "";
                        if (orderDetail && orderDetail.awbCode != "") {
                          let awbTrackUrl = await Helper.orderTrackByAwb(
                            orderDetail.awbCode,
                            token
                          );
                          if (awbTrackUrl) {
                            orderDetail.shiprocketTrackUrl =
                              awbTrackUrl.tracking_data.track_url;
                          } else {
                            orderDetail.shiprocketTrackUrl = "";
                          }
                        } else {
                          orderDetail.shiprocketTrackUrl = "";
                        }
                        orderDetail.shipmentId =
                          orderDetail && orderDetail.shipmentDetails
                            ? orderDetail.shipmentDetails.shipment_id
                            : "";
                        delete orderDetail.shipmentDetails;
                        delete orderDetail.awbDetails;
                      })
                    );
                  })
                );
                let resData = {
                  orderList: cartItems,
                  totalResult: totalResult,
                  limit: limit,
                };
                Helper.response(
                  res,
                  200,
                  "Order details fetched successfully!",
                  resData
                );
              } else {
                Helper.response(res, 404, "Order not found", {
                  orderList: [],
                });
              }
            } else {
              Helper.response(res, 404, "Order not found", {
                orderList: [],
              });
            }
          }
        }
      );
    } catch (err) {
      logger.error(err);
      return Helper.response(res, 500, "Server error.", err);
    }
  },

  orderDetailById: async (req, res) => {
    try {
      const { authorization } = req.headers;
      var role = req.user.role;
      var _id = req.params.orderId ? new ObjectId(req.params.orderId) : null;
      if (authorization != undefined) {
        data = await verifyToken(authorization);
        if (data.role == "supplier") {
          var supplierId = new ObjectId(data._id);
          var query = {
            primaryOrderId: _id,
            supplierId,
          };
        } else {
          var query = {
            primaryOrderId: _id,
          };
        }
      } else {
        var query = {
          primaryOrderId: _id,
        };
      }
      if (req.query.status) {
        if (req.query.status == "ORDER PLACED") {
          Object.assign(query, { orderStatus: "PENDING" });
        } else {
          Object.assign(query, { orderStatus: status });
        }
      } else {
        Object.assign(query, { orderStatus: { $ne: "Delete" } });
      }
      if (data.role == "supplier") {
        await orderModel.findOneAndUpdate(
          { _id },
          { isReadSeller: true },
          { new: true }
        );
      }
      const findOrders = await orderModel
        .find(
          { orderStatus: { $ne: "Delete" }, _id },
          {
            _id: 1,
            parentOrderId: 1,
            createdAt: 1,
            addressId: 1,
            totalPrice: 1,
            deliveryCharges: 1,
            discount: 1,
            paymentStatus: 1,
            paymentId: 1,
            isRead: 1,
            isReadSeller: 1,
            amountReceived: {
              $cond: {
                if: "$amountReceived",
                then: "$amountReceived",
                else: 0,
              },
            },
          }
        )
        .populate("addressId")
        .sort({ createdAt: -1 })
        .lean();
      if (findOrders.length == 0) {
        return Helper.response(res, 404, "No data found");
      }
      const promises = findOrders.map(async (order) => {
        const orderDetails = await orderDetailsModel
          .find(query, {
            productId: 1,
            orderId: 1,
            primaryOrderId: 1,
            orderStatus: 1,
            quantity: 1,
            createdAt: 1,
            isRead: 1,
            totalPrice: 1,
            installationProcess: 1,
            awbDetails: 1,
            shipmentDetails: 1,
          })
          .sort({ createdAt: -1 })
          .lean();
        const orderArr = await Promise.all(
          orderDetails.map(async (orderDetail) => {
            const productData = await productModel
              .findOne(
                {
                  _id: orderDetail.productId,
                  // productStatus: "Active",
                },
                {
                  _id: 1,
                  productName: 1,
                  productUniqueId: 1,
                  productQuantity: 1,
                  productPrice: 1,
                  createdAt: 1,
                  productImages: 1,
                  productInstallation: 1,
                  shippingPreference: 1,
                  productStatus: 1,
                  hsnNo: 1,
                  sku: 1,
                }
              )
              .sort({ createdAt: -1 })
              .lean();

            if (
              productData &&
              productData.productImages &&
              productData.productImages.length > 0
            ) {
              const productImages = productData.productImages.map((img) => ({
                imgUrl: process.env.IMAGE_URL + "suppliers/" + img.imgName,
                imgName: img.imgName,
              }));
              productData.productImages = productImages;
            }
            if (productData) {
              orderDetail.productDetails = productData;
            } else {
              orderDetail.productDetails = {};
            }
            const orderTrackStatus = await OrderTrackModel.find({
              orderId: new ObjectId(orderDetail._id),
            })
              .sort({ createdAt: 1 })
              .lean();
            orderTrackStatus.forEach((ele) => {
              if (ele.orderStatus == "PENDING") {
                if (role == "customer") {
                  ele.orderStatus = "ORDER PLACED";
                } else {
                  ele.orderStatus = "ORDER RECEIVED";
                }
              }
            });
            orderDetail.orderTrackStatus = orderTrackStatus;
            orderDetail.customerId = req.user._id;
            if (orderDetail.orderStatus == "PENDING") {
              if (role == "customer") {
                orderDetail.orderStatus = "ORDER PLACED";
              } else {
                orderDetail.orderStatus = "ORDER RECEIVED";
              }
            }
            const token = await Helper.generateToken();
            orderDetail.awbCode =
              orderDetail && orderDetail.awbDetails
                ? orderDetail.awbDetails.response.data.awb_code
                : "";
            if (orderDetail && orderDetail.awbCode != "") {
              let awbTrackUrl = await Helper.orderTrackByAwb(
                orderDetail.awbCode,
                token
              );
              if (awbTrackUrl) {
                orderDetail.shiprocketTrackUrl =
                  awbTrackUrl.tracking_data.track_url;
              } else {
                orderDetail.shiprocketTrackUrl = "";
              }
            } else {
              orderDetail.shiprocketTrackUrl = "";
            }
            orderDetail.shipmentId =
              orderDetail && orderDetail.shipmentDetails
                ? orderDetail.shipmentDetails.shipment_id
                : "";
            delete orderDetail.shipmentDetails;
            delete orderDetail.awbDetails;
            return orderDetail;
          })
        );
        order.totalPrice = order.totalPrice;
        order.orderDetails = orderArr;
        let transactiondetails = await TransactionModel.findOne({
          trackingId: order.paymentId,
        });
        if (transactiondetails) {
          var regex = /payment_mode=([^&]*)/;
          var match = regex.exec(transactiondetails.ccavResponse);
          var paymentMode = match && match[1];
          order.transactionMode = paymentMode;
        } else {
          order.transactionMode = "Offline";
        }
      });
      await Promise.all(promises);
      let billingDetails = {
        CartTotal:
          parseInt(findOrders[0].totalPrice) -
          parseInt(findOrders[0].deliveryCharges) +
          parseInt(findOrders[0].discount),
        discountOffered: parseInt(findOrders[0].discount),
        orderTotal:
          parseInt(findOrders[0].totalPrice) -
          parseInt(findOrders[0].deliveryCharges),
        shippingCharge: findOrders[0].deliveryCharges,
        total: findOrders[0].totalPrice,
      };
      const resData = {
        orderList: findOrders[0],
        billingDetails: billingDetails,
      };
      return Helper.response(res, 200, "Order details fetched successfully..", {
        order: resData,
      });
    } catch (error) {
      console.error(error);
      return Helper.response(res, 500, "Internal Server Error");
    }
  },
  returnOrder: async (req, res) => {
    try {
      let { orderId, productId, reason } = req.body;
      let customerId = req.user._id;
      let checkOrderId = await orderDetailsModel.findOneAndUpdate(
        { _id: orderId },
        { orderStatus: "RETURN REQUESTED", isReadSeller: false, isRead: false }
      );
      if (!checkOrderId) {
        return Helper.response(res, 404, "No data found check order id.");
      }
      await orderModel.findOneAndUpdate(
        { _id: checkOrderId.primaryOrderId },
        { $set: { isRead: false } },
        { new: true }
      );
      const orderReturnCheck = await ReturnOrderModel.findOne({
        orderId: orderId,
        productId: productId,
      });

      if (orderReturnCheck) {
        return Helper.response(
          res,
          401,
          "You already requested for return this product. Please wait for process the request."
        );
      } else {
        const ReturnOrder = new ReturnOrderModel({
          orderId,
          productId,
          customerId,
          reason,
          returnRequestDate: moment().format(),
        });
        ReturnOrder.save();
        const orderTrack = new OrderTrackModel({
          orderId,
          orderStatus: "RETURN REQUESTED",
          orderStatusDate: new Date(),
        });
        orderTrack.save();
        return Helper.response(res, 200, "Return Requested");
      }
    } catch (error) {
      return Helper.response(res, 500, "Something went wrong");
    }
  },
  getOrderInvoice: async (req, res) => {
    try {
      if (req.params.orderId != "") {
        await orderModel.findByIdAndUpdate(
          { _id: req.params.orderId },
          { $set: { invoiceDate: moment().format() } },
          { new: true }
        );
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
        {
          $unwind: "$OrderDetails",
        },
        {
          $lookup: {
            from: "Product",
            localField: "OrderDetails.productId",
            foreignField: "_id",
            as: "productDetails",
          },
        },
        {
          $unwind: "$productDetails",
        },
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
            from: "Address",
            localField: "addressId",
            foreignField: "_id",
            as: "addressDetails",
          },
        },
        { $unwind: "$addressDetails" },
        {
          $lookup: {
            from: "Transaction",
            localField: "paymentId",
            foreignField: "trackingId",
            as: "transaction",
          },
        },
        { $unwind: { path: "$transaction", preserveNullAndEmptyArrays: true } },
        {
          $addFields: {
            "OrderDetails.productdetails": {
              productName: "$productDetails.productName",
              productImages: "$productDetails.productImages",
              productPrice: "$productDetails.productPrice",
              categoryType: "$productDetails.categoryType",
              productCode: "$productDetails.productCode",
              hsnNo: "$productDetails.hsnNo",
              productUniqueId: "$productDetails.productUniqueId",
              quantity: "$OrderDetails.quantity",
              // orderStatus: "$OrderTrackDetail.orderStatus",
              shippingPreference: {
                $cond: {
                  if: "$OrderDetails.shippingPreference",
                  then: "OrderDetails.shippingPreference",
                  else: "self-managed",
                },
              },
            },
            "OrderDetails.supplierdetails": {
              _id: "$supplierDetails._id",
              name: "$supplierDetails.basicInfo.companyName",
              supplierUniqId: "$supplierDetails.supplierUniqId",
              address: "$supplierDetails.address",
              panNumber: "$supplierDetails.kycDetails.panNoData",
              gstNumber: "$supplierDetails.kycDetails.gstNoData",
            },
          },
        },
        {
          $match: {
            orderStatus: {
              $ne: "Delete",
            },
            _id: new ObjectId(req.params.orderId),
          },
        },
        {
          $group: {
            _id: "$_id",
            orderDetails: {
              $push: "$OrderDetails",
            },
            addressId: {
              $first: "$addressDetails",
            },
            parentOrderId: {
              $first: "$parentOrderId",
            },
            createdAt: {
              $first: "$createdAt",
            },
            totalPrice: {
              $first: "$totalPrice",
            },
            gstAmount: {
              $first: {
                $cond: { if: "$gstAmount", then: "$gstAmount", else: 0 },
              },
            },
            productMrp: {
              $first: {
                $cond: { if: "$productMrp", then: "$productMrp", else: 0 },
              },
            },
            invoiceNumber: {
              $first: "$invoiceNumber",
            },
            invoiceDate: {
              $first: "$invoiceDate",
            },
            transaction: {
              $first: "$transaction.ccavResponse",
            },
            amountReceived: {
              $first: {
                $cond: {
                  if: "$amountReceived",
                  then: "$amountReceived",
                  else: 0,
                },
              },
            },
            deliveryCharges: {
              $first: {
                $cond: {
                  if: "$deliveryCharges",
                  then: "$deliveryCharges",
                  else: "",
                },
              },
            },
          },
        },
        // {
        //   $match: query
        // },
        {
          $project: {
            orderDetails: 1,
            addressId: 1,
            buyerEmail: req.user.emailId,
            parentOrderId: 1,
            createdAt: 1,
            invoiceNumber: 1,
            invoiceDate: 1,
            gstAmount: 1,
            productMrp: 1,
            transaction: 1,
            totalPrice: 1,
            amountReceived: 1,
            deliveryCharges: 1,
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

      let myAggregate = orderModel.aggregate(agg);
      orderModel.aggregatePaginate(
        myAggregate,
        options,
        async function (err, result) {
          if (err) {
            console.log("err", err);
            return Helper.response(res, 500, "Internal server error.");
          } else {
            if (result.docs.length > 0) {
              let cartItems = result.docs;
              cartItems[0].amoutInWord = await Helper.convertAmountToWords(
                cartItems[0].totalPrice
              );
              if (cartItems[0].amountReceived) {
                cartItems[0].receivedInWords =
                  await Helper.convertAmountToWords(
                    cartItems[0].amountReceived
                  );
              } else {
                if (cartItems[0].totalPrice < 200000)
                  cartItems[0].amountReceived = cartItems[0].totalPrice;
                cartItems[0].receivedInWords = cartItems[0].amountReceived
                  ? await Helper.convertAmountToWords(
                      cartItems[0].amountReceived
                    )
                  : "-";
              }
              const shippingAdd = cartItems[0].transaction
                ? querystring.parse(cartItems[0].transaction)
                : null;
              cartItems[0].transactionMode =
                shippingAdd && shippingAdd.payment_mode
                  ? shippingAdd.payment_mode
                  : "Offline";
              cartItems[0].addressId.delivery_name =
                shippingAdd && shippingAdd.delivery_name
                  ? _.capitalize(shippingAdd.delivery_name)
                  : cartItems[0].addressId.name;
              cartItems[0].addressId.delivery_tel =
                shippingAdd && shippingAdd.delivery_tel
                  ? shippingAdd.delivery_tel
                  : cartItems[0].addressId.mobileNumber;
              cartItems[0].addressId.delivery_address =
                shippingAdd && shippingAdd.delivery_address
                  ? shippingAdd.delivery_address
                  : cartItems[0].addressId.address;
              cartItems[0].addressId.delivery_city =
                shippingAdd && shippingAdd.delivery_city
                  ? shippingAdd.delivery_city
                  : cartItems[0].addressId.city;
              cartItems[0].addressId.delivery_state =
                shippingAdd && shippingAdd.delivery_state
                  ? shippingAdd.delivery_state
                  : cartItems[0].addressId.state;
              cartItems[0].addressId.delivery_zip =
                shippingAdd && shippingAdd.delivery_zip
                  ? shippingAdd.delivery_zip
                  : cartItems[0].addressId.pinCode;
              cartItems[0].addressId.billing_email =
                shippingAdd && shippingAdd.billing_email
                  ? shippingAdd.billing_email
                  : cartItems[0].buyerEmail;

              const supplier = cartItems[0].orderDetails[0].supplierdetails;
              cartItems[0].supplier = supplier;

              const utcTime = cartItems[0].createdAt;
              cartItems[0].createdAt = moment
                .utc(utcTime)
                .tz("Asia/Kolkata")
                .format("YYYY-MM-DD HH:mm:ss");
              // cartItems[0].transactionMode = transactionMode;
              // return Helper.response(res, 200, "Invoice response", { response: cartItems[0], });
              // console.log(cartItems[0].orderDetails, "<<<<<<<<addressId")

              let pathDetails = await pdfGeneratorHelper.invoiceGenerator(
                "public/templates/invoice.ejs",
                cartItems[0]
              );
              let updateInvoice = {
                invoiceS3Key: pathDetails.key,
                invoicePDFName: cartItems[0].invoiceNumber + ".pdf",
                invoiceDate: moment().format(),
              };
              const resultData = await orderModel.findByIdAndUpdate(
                { _id: req.params.orderId },
                { $set: updateInvoice },
                { new: true }
              );
              if (!resultData) {
                // If no order is found with the given _id
                return Helper.response(res, "404", "Order not found.");
              }
              const pdfURL = getSyncSignedUrl(
                pathDetails.key,
                "application/pdf"
              );
              return Helper.response(
                res,
                200,
                "Order invoice fetched successfully.",
                {
                  pdfURL: pdfURL,
                }
              );
            } else {
              Helper.response(res, 404, "Order not found", {
                orderList: [],
              });
            }
          }
        }
      );
    } catch (err) {
      logger.error(err);
      return Helper.response(res, 500, "Server error.", err);
    }
  },
  installationOfOrder: async (req, res) => {
    try {
      let { orderId } = req.body;
      let installationProcess = {
        isProcessed: true,
        value: "INSTALLATION REQUESTED",
        installationDate: moment().format(),
      };
      let checkOrderId = await orderDetailsModel
        .findOneAndUpdate(
          { _id: orderId },
          { installationProcess, isRead: false }
        )
        .populate("productId", "productCode productName")
        .populate("supplierId", "basicInfo");
      // console.log("installation request", checkOrderId)
      if (!checkOrderId) {
        return Helper.response(res, 404, "No data found check order id.");
      }
      const prarentOrder = await orderModel
        .findOneAndUpdate(
          { _id: checkOrderId.primaryOrderId },
          { isRead: false, isReadSeller: false, updatedAt: moment().format() }
        )
        .lean();
      let checkTrack = await OrderTrackModel.findOne({
        orderId,
        orderStatus: "INSTALLATION REQUESTED",
      });
      if (!checkTrack) {
        // for Customer email
        var html = `
                Dear <b>${req.user.name},</b><br><br>
               Your request for initiating the installation of <b>${checkOrderId.productId.productName} (${checkOrderId.productId.productCode})</b> from the project is received. We will coordinate with the seller and inform you on the next steps.
                <br><br>
                You may raise any concerns related to delivered item.<a href="${process.env.ORDER_SUPPORT}">here</a><br>
                <br>
                Thank you for your valued trust in this.<br>
                <br>
                Best regards,<br><br>
                Team project<br><br>`;

        await Helper.send365Email(
          process.env.MAIL_SEND_EMAIL,
          req.user.emailId,
          `Your request for installation of ${checkOrderId.productId.productName} (${checkOrderId.productId.productCode}) is received`,
          html,
          "text"
        );

        // for Seller email
        let supplier = checkOrderId.supplierId.basicInfo;
        let buyerAddress =
          req.user.address +
          ", " +
          req.user.city +
          ", " +
          req.user.state +
          ", " +
          req.user.zipCode;
        let installDate = await Helper.dateFormat(new Date(), 1);
        // console.log("supplier", buyerAddress)

        var supllierHtml = `
                Dear <b>${supplier.founderName},</b><br><br>
                We have received the request for initiating the installation of <b>${checkOrderId.productId.productName} (${checkOrderId.productId.productCode})</b> purchased by <b>${req.user.name}</b> Address ${buyerAddress}. The time slot for the installation is ${installDate} at 04:00 pm . <a href="${process.env.SELLER_ORDER_LIST_URL}">Click here to confirm</a>
                <br><br>
                You may raise any concerns related to delivered item. <a href="${process.env.ORDER_SUPPORT}">here</a> <br>
                <br>
                Thank you for your valued trust in this.<br>
                <br>
                Best regards,<br><br>
                Team project<br><br>`;

        await Helper.send365Email(
          process.env.MAIL_SEND_EMAIL,
          supplier.emailId,
          `Your request for installation of ${checkOrderId.productId.productName} (${checkOrderId.productId.productCode}) is received`,
          supllierHtml,
          "text"
        );
        const orderTrack = new OrderTrackModel({
          orderId,
          orderStatus: "INSTALLATION REQUESTED",
          orderStatusDate: moment().format(),
        });
        orderTrack.save();
      }

      return Helper.response(res, 200, "installation Requested");
    } catch (error) {
      return Helper.response(res, 500, "Something went wrong");
    }
  },
  getServiceability: async (req, res) => {
    try {
      let { items } = req.body;
      const token = await Helper.generateToken();
      const headers = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      };
      let shippingCharges = 0;
      for (const serviceEle of items) {
        delete serviceEle.supplierId;
        const requestConfig = {
          method: "GET",
          url: process.env.SHIPROCKET_URL + `/courier/serviceability/`,
          headers: headers,
          data: serviceEle,
        };
        const response = await axios(requestConfig);
        logger.info(
          `shiprocket get courier serviceability ${JSON.stringify(
            response.data
          )}`
        );
        shippingCharges =
          shippingCharges +
          response.data.data.available_courier_companies[0].rate;
      }
      return Helper.response(res, 200, "Shipping charges", { shippingCharges });
    } catch (err) {
      console.log(err);
      logger.error(err);
      return Helper.response(res, 500, "Server error.", err);
    }
  },
  checkAvailability: async (req, res) => {
    try {
      req.query.cod = 0;
      const token = await Helper.generateToken();
      const headers = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      };
      const requestConfig = {
        method: "GET",
        url: process.env.SHIPROCKET_URL + `/courier/serviceability/`,
        headers: headers,
        data: req.query,
      };
      const response = await axios(requestConfig);
      logger.info(
        `shiprocket get courier serviceability ${JSON.stringify(response.data)}`
      );
      shippingCharges = response.data.data.available_courier_companies[0];
      return Helper.response(res, 200, "Shipping charges", { shippingCharges });
    } catch (err) {
      console.log(err);
      logger.error(err);
      return Helper.response(res, 500, "Server error.", err);
    }
  },
  orderTrackByAwb: async (req, res) => {
    const token = await Helper.generateToken();
    const headers = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };
    const requestConfig = {
      method: "GET",
      url:
        process.env.SHIPROCKET_URL + `/courier/track/awb/${req.body.awbCode}`,
      headers: headers,
      data: {},
    };
    console.log(requestConfig, "requestConfig");
    try {
      const response = await axios(requestConfig);
      logger.info(
        `shiprocket tracking by awb ${JSON.stringify(response.data)}`
      );
      if (response.status === 200) {
        return Helper.response(
          res,
          200,
          "Order tracking details by shiprocket",
          response.data
        );
      }
    } catch (error) {
      // Handle axios request error
      logger.error(`shiprocket tracking by awb error ${error}`);
      console.error("Error:", error);
      return Helper.response(res, 500, "Internal server error");
    }
  },
};
async function verifyToken(authorization) {
  if (!authorization) {
    return Helper.response(res, 401, "you must be logged in");
  }
  const token = authorization;
  var userId = {};
  await jwt.verify(token, JWT_SECRET, async (err, payload) => {
    console.log(err);
    // return false;
    if (err) {
      console.log("you must be logged in");
    }
    const { _id } = payload;
    var supplierData = await supplierModel.findOne(
      {
        _id,
      },
      {
        _id: 1,
        role: 1,
      }
    );
    if (supplierData) {
      userId = {
        _id: supplierData._id,
        role: supplierData.role,
      };
    }
  });
  return userId;
}
