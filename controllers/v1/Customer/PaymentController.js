const CODES = require("../../../config/status_codes/status_codes");
const MSG = require("../../../config/language/Messages");
const { logger } = require("../../../logger/winston");
const mongoose = require("mongoose");
const { ObjectId } = mongoose.Types;
const Helper = require("../../../config/helper");
const querystring = require("querystring");
const ccav = require("../../../services/ccavutil.js");
const crypto = require("crypto");
const workingKey = process.env.WORKING_KEY;
const accessCode = process.env.ACCESS_CODE;
const merchantId = process.env.MERCHANT_ID;
const webURL = process.env.WEB_URL;
const transactionModel = require("../../../models/TransactionModel");
const orderModel = require("../../../models/OrderModel");
const orderDetailsModel = require("../../../models/OrderDetailsModel");
const orderTrackModel = require("../../../models/orderTrackModel.js");
const shiprocketLogModel = require("../../../models/ShiprocketLogModel.js");
const moment = require("moment-timezone");
module.exports = {
  ccavRequestHandler: async (req, res) => {
    try {
      var customerUniqId = req.user.customerUniqId;
      const evironment = req.body.evironment ? req.body.evironment : "secure";
      let dataObject = {
        workingKey,
        accessCode,
        merchant_id: merchantId,
        order_id: await Helper.generateOrderProductUniqId(customerUniqId),
        currency: "INR",
        language: "EN",
      };

      Object.assign(req.body, dataObject);
      const body = querystring.stringify(req.body);
      var md5 = crypto.createHash("md5").update(workingKey).digest();
      var keyBase64 = Buffer.from(md5).toString("base64");
      var ivBase64 = Buffer.from([
        0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0a, 0x0b,
        0x0c, 0x0d, 0x0e, 0x0f,
      ]).toString("base64");

      encRequest = ccav.encrypt(body, keyBase64, ivBase64);
      if (encRequest) {
        let url = "";
        if (evironment == "secure") {
          url = `https://secure.ccavenue.com/transaction/transaction.do?command=initiateTransaction&access_code=${accessCode}&encRequest=${encRequest}`;
        } else {
          url = `https://test.ccavenue.com/transaction/transaction.do?command=initiateTransaction&access_code=${accessCode}&encRequest=${encRequest}`;
        }
        return Helper.response(
          res,
          200,
          "Payment link successfully generated!!",
          { url }
        );
      } else {
        return Helper.response(res, 402, "Payment link not found!", {
          url: "",
        });
      }
    } catch (err) {
      console.log(err);
      return Helper.response(res, 500, "Server error.", err);
    }
  },
  responseHandler: async (request, response) => {
    try {
      var ccavResponse = "";

      var md5 = crypto.createHash("md5").update(workingKey).digest();
      var keyBase64 = Buffer.from(md5).toString("base64");
      var ivBase64 = Buffer.from([
        0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0a, 0x0b,
        0x0c, 0x0d, 0x0e, 0x0f,
      ]).toString("base64");

      ccavResponse = ccav.decrypt(request.body.encResp, keyBase64, ivBase64);
      const paymentResponse = querystring.parse(ccavResponse);

      // console.log("order_status: ", paymentResponse["order_status"]);
      const transaction = new transactionModel({
        orderId: paymentResponse["order_id"],
        trackingId: paymentResponse["tracking_id"], // ref. no
        orderStatus: paymentResponse["order_status"],
        amount: paymentResponse["amount"],
        ccavResponse: ccavResponse,
      });
      await transaction.save();
      if (paymentResponse["order_status"] == "Success") {
        response.redirect(
          `${webURL}?orderStatus=${paymentResponse["order_status"]}&trackingId=${paymentResponse["tracking_id"]}`
        );
      } else {
        response.redirect(
          `${webURL}?orderStatus=${paymentResponse["order_status"]}&trackingId=${paymentResponse["tracking_id"]}`
        );
      }
    } catch (error) {
      logger.error(error);
      console.log("Error responseHandler payment:", error);
      return Helper.response(response, 500, "Server error.", error);
    }
  },
  cancelOrderPayment: async (req, res) => {
    try {
      const evironment = req.body.evironment ? req.body.evironment : "secure";
      let dataObject = {
        workingKey,
        accessCode,
        merchant_id: merchantId,
      };

      Object.assign(req.body, dataObject);
      const body = querystring.stringify(req.body);
      var md5 = crypto.createHash("md5").update(workingKey).digest();
      var keyBase64 = Buffer.from(md5).toString("base64");
      var ivBase64 = Buffer.from([
        0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0a, 0x0b,
        0x0c, 0x0d, 0x0e, 0x0f,
      ]).toString("base64");

      encRequest = ccav.encrypt(body, keyBase64, ivBase64);
      if (encRequest) {
        let url = "",
          amount = 1,
          reference_no = "113201764057";
        url = `https://secure.ccavenue.com/transaction/transaction.do?command=cancelOrder&enc_request=${encRequest}&access_code=${accessCode}&request_type=JSON&response_type=JSON&reference_no=${reference_no}&amount=${amount}`;
        return Helper.response(res, 200, "Payment cancel successfully!!", {
          url,
        });
      } else {
        return Helper.response(res, 402, "Payment not found!", { url: "" });
      }
    } catch (err) {
      console.log(err);
      return Helper.response(res, 500, "Server error.", err);
    }
  },
  shiprocket: async (req, res) => {
    try {
      logger.info(`shiprocket Body Request=> ${JSON.stringify(req.body)}`);
      let bodyData = req.body;
      const saveShiprocketLogsWebHook = new shiprocketLogModel({
        payload: bodyData,
        payloadType: "WEBHOOK",
      });
      await saveShiprocketLogsWebHook.save();
      console.log(req.body, "shiprocket");
      let orderDetails = await orderDetailsModel.findOneAndUpdate(
        {
          "awbDetails.response.data.awb_code": req.body.awb,
        },
        { $set: { orderStatus: req.body.current_status } },
        { new: true }
      );
      if (orderDetails) {
        let orderTrackExist = await orderTrackModel.findOne({
          orderId: orderDetails._id,
          orderStatus: req.body.current_status,
        });
        if (!orderTrackExist) {
          var orderTrack = new orderTrackModel({
            orderId: orderDetails._id,
            orderStatus: req.body.current_status,
            orderStatusDate: moment().format(),
          });
          orderTrack.save();
        } else {
          await orderTrackModel.findOneAndUpdate(
            {
              orderId: orderDetails._id,
            },
            { $set: { orderStatusDate: moment().format() } },
            { new: true }
          );
        }
      }
      return Helper.response(res, 200, "shiprocket api!");
    } catch (err) {
      logger.error(`Error shiprocket Request=> ${JSON.stringify(error)}`);
      return Helper.response(res, 500, "Server error.", err);
    }
  },
};
