const helper = {};
var fs = require("fs");
var path = require("path");
const multer = require("multer");
const { v4: uuidv4 } = require("uuid");
const multerS3 = require("multer-s3");
const aws = require("aws-sdk");
const nodemailer = require("nodemailer");
const webPush = require("web-push");
const notificationSubscribeDataModel = require("../models/notificationSubscribeDataModel");
const customerModel = require("../models/CustomerModel");
const supplierModel = require("../models/SupplierModel");
const productModel = require("../models/ProductModel");
const serviceModel = require("../models/ServiceModel");
const orderModel = require("../models/OrderModel");
const adminModel = require("../models/AdminModel");
const { logger } = require("../logger/winston");
const axios = require("axios");
// var ejs = require('ejs');
// var FCM = require('fcm-push');
// var _ = require('lodash');
// const { resolve } = require("path");
// var transporter = nodemailer.createTransport({
//     host: "smtp.eu.mailgun.org",
//     port: "465",
//     secure: true,
//     auth: {
//         user: "",
//         pass: "",
//     }
// });

const jwt = require("jsonwebtoken");
const { env } = require("process");
const notificationModel = require("../models/notificationModel");
const SECRET_KEY = process.env.JWT_SECRET;
const { ToWords } = require("to-words");

helper.response = function (response, status_code, message, data) {
  var ret = {
    code: status_code,
    message: message,
  };
  if (data) {
    Object.assign(ret, data);
  }
  response.status(status_code).json(ret);
};

helper.upload_space = function (filepath) {
  const spacesEndpoint = new aws.Endpoint(process.env.S3_DNS);
  const s3 = new aws.S3({
    endpoint: spacesEndpoint,
    accessKeyId: process.env.S3_ACCESS_KEY_ID,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
  });
  const upload = multer({
    storage: multerS3({
      s3: s3,
      bucket: process.env.S3_SPACE_BUCKET + filepath,
      acl: "public-read",
      contentDisposition: "inline",
      contentType: multerS3.AUTO_CONTENT_TYPE,
      key: function (request, file, cb) {
        //console.log("file--->>>", file);
        let extArray = file.mimetype.split("/");
        let extension = extArray[extArray.length - 1];
        var fileExt = path.extname(file.originalname);
        var fileName = file.originalname;
        fileName = fileName.split(".");
        fileName = fileName[0];
        //fileName.splice(-1, 1);
        //fileName.join('');
        fileName = fileName.replace(" ", "-");
        fileName = fileName + "-" + new Date().getTime();
        var data = fileName + fileExt;
        cb(null, data);
      },
    }),
  });
  return upload;
};

helper.base64_encode = (file) => {
  //const encoded = new Buffer.from(fs.readFileSync(file.path)).toString("base64")
  const encoded = fs.readFileSync(file.path);

  return encoded;
};

helper.base64_decode = (imageData, filename, targetFilePath, imageUrl) => {
  var image = "";
  var data = imageData.replace(/^data:image\/\w+;base64,/, "");
  fs.writeFile(targetFilePath + filename, data, "base64", function (err) {
    //Finished
    if (err) {
    } else {
      image = process.env.SERVER_URL + imageUrl + filename;
    }
  });
  return image;
};

helper.generate_jwt = (userId) => {
  console.log("userId in generate_jwt fn : ", userId);
  var token = jwt.sign(
    {
      _id: userId,
    },
    SECRET_KEY,
    {
      expiresIn: "30d",
    }
  );

  return token;
};

helper.generate_otp = () => {
  return Math.floor(100000 + Math.random() * 900000);
};

helper.ucfirst = (str) => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};

helper.format_sql_data = (data) => {
  return JSON.parse(JSON.stringify(data));
};

helper.generate_url = (req) => {
  return req.protocol + "://" + req.hostname + ":" + req.connection.localPort;
};

helper.toFixedNumber = (number) => {
  const spitedValues = String(number.toLocaleString()).split(".");
  let decimalValue = spitedValues.length > 1 ? spitedValues[1] : "";
  decimalValue = decimalValue.concat("00").substr(0, 2);
  return spitedValues[0] + "." + decimalValue;
};

helper.generateRandNo = () => {
  let rand_no = Math.random();
  let num = Math.floor(rand_no * 100000000 + 1);
  return num; /*8 digit random number*/
};

helper.getPageNumber = (page, limit) => {
  if (page == 1) {
    var start = 0;
  } else {
    if (page == 0) {
      page = 1;
    }
    page = page - 1;
    var start =
      (limit == undefined || limit == ""
        ? Config.SETTING.PER_PAGE_RECORD
        : limit) * page;
  }
  return start;
};

helper.strToLowerCase = (str) => {
  return str == undefined ? "" : helper._trim(str.toLowerCase());
};

helper._replace = (str) => {
  var responce = str == undefined ? "" : str.replace(/[^a-zA-Z0-9 ]/g, "");
  return responce;
};

helper._trim = (str) => {
  var responce = str == undefined ? "" : str.trim();
  return responce;
};

helper.sendMailWithTemplate = (
  templatePath,
  emailSubject,
  email,
  dataObject
) => {
  return new Promise(function (resolve, reject) {
    ejs.renderFile(templatePath, dataObject, function (err, dataTemplate) {
      if (err) {
      } else {
        var mainOptions = {
          from: "info@dummy.com",
          to: email,
          subject: emailSubject,
          html: dataTemplate,
        };

        transporter.sendMail(mainOptions, function (err, info) {
          if (err) {
          } else {
            resolve(1);
          }
        });
      }
    });
  });
};
helper.send365Email = async (from, to, subject, html, text) => {
  console.log("from :", from, "to : ", to, "subject:", subject);
  try {
    const transportOptions = {
      host: "smtp.office365.com",
      port: 587,
      auth: {
        user: process.env.MAIL_SEND_EMAIL,
        pass: process.env.MAIL_SEND_PASSWORD,
      },
      secureConnection: true,
      tls: {
        ciphers: "SSLv3",
      },
    };

    const mailTransport = nodemailer.createTransport(transportOptions);
    const commonFooter = `
            <p>Can write footer for mail</p>
        `;
    const htmlWithFooter = `${html}<br>${commonFooter}`;
    await mailTransport.sendMail({
      from,
      to,
      replyTo: from,
      subject,
      html: htmlWithFooter,
      text,
    });
  } catch (error) {
    console.log("Email Error Print Here>>", error);
  }
};
helper.sendSms = (templatePath, emailSubject, email, dataObject) => {
  return new promise(function (resolve, reject) {
    return "";
  });
};

helper.generateRandString = () => {
  return Math.random().toString(36).substring(5);
};
helper.addImageHttps = (location) => {
  var matched = "https://";
  if (location.indexOf(matched) != 0) {
    location = matched + location;
  }
  return location;
};
helper.sendPushNotification = function (
  serverKey,
  token,
  device_type,
  title,
  msg,
  redirectUrl = "",
  bookingId = ""
) {
  var fcm = new FCM(serverKey);
  let payload = {
    notification: {
      title: title,
      body: msg,
    },
    data: {
      title: title,
      body: msg,
      click_action: "FCM_PLUGIN_ACTIVITY",
      color: "#f95b2c",
      sound: true,
      redirect: redirectUrl,
      bookingId: bookingId,
    },
  };
  var message = {
    to: token,
    collapse_key: "your_collapse_key",
  };
  Object.assign(message, payload);
  fcm.send(message, function (err, response) {
    if (err) {
      console.log("=======================error comming===================");
      console.log("Something went wrong! ", err);
    } else {
      console.log("=======================Response===================");
      console.log("Successfully sent with response: ", response);
      return response;
    }
  });
};
helper.groupdata = async function (data) {
  console.log("coming group data");
  var details = await _.chain(data)
    .groupBy("Level.en")
    .map((value, key) => ({
      Level: value[0].Level,
      data: value,
    }))
    .value();
  return details;
};
helper.commondata = async function (data, role_name) {
  console.log("coming commondata");
  var details = await _.chain(data)
    .groupBy(role_name)
    .map((value, key) => ({
      role_name: key,
    }))
    .value();
  return details;
};
helper.dpoBlock = async function (data) {
  console.log("coming group data");

  var details = await _.chain(data)
    .groupBy("sheet")
    .map((value, key) => ({
      sheet: value[0].sheet,
      data: value,
    }))
    .value();
  return details;
};
helper.addDays = function (date, days) {
  var result = new Date(date);
  result.setDate(result.getDate() - days);
  return result;
};
helper.modifyDate = function (date, days) {
  var result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};
helper.dateFormat = function (date, day) {
  //remove hrs/minute
  console.log("date, day", date, day);
  if (day) {
    date.setDate(date.getDate() + day);
  } else {
    date.setDate(date.getDate());
  }
  date.setUTCHours(0, 0, 0, 0);
  return date;
};

helper.nextDayDate = function (date, day) {
  if (day) {
    date.setDate(date.getDate() + day);
  } else {
    date.setDate(date.getDate());
  }
  const formattedDate = `${("0" + date.getDate()).slice(-2)}/${(
    "0" +
    (date.getMonth() + 1)
  ).slice(-2)}/${date.getFullYear()}`;
  return formattedDate;
};

helper.upcomingdays = function (date, days) {
  var result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};
helper.priviousdays = function (date, days) {
  var result = new Date(date);
  result.setDate(result.getDate() - days);
  return result;
};

helper.getDatesBetweenDates = (startDate, endDate) => {
  let dates = [];
  let onlyDates = [];
  //to avoid modifying the original date
  const theDate = new Date(startDate);
  while (theDate < endDate) {
    dates = [...dates, new Date(theDate)];
    theDate.setDate(theDate.getDate() + 1);
  }
  dates = [...dates, endDate];
  dates.map(function (v) {
    var date = v.toISOString().slice(0, 10);
    //console.log(date);
    onlyDates.push(date);
  });
  return onlyDates;
};
helper.getMonthsName = (number) => {
  //var monthNames = { "1": "January", "2": "February", "3": "March", "4": "April", "5": "May", "6": "June", "7": "July", "8": "August", "9": "September", "10": "October", "11": "November", "12": "December" };
  var monthNames = {
    1: "Jan",
    2: "Feb",
    3: "Mar",
    4: "Apr",
    5: "May",
    6: "Jun",
    7: "Jul",
    8: "Aug",
    9: "Sep",
    10: "Oct",
    11: "Nov",
    12: "Dec",
  };
  var today = new Date(); /*from ww w .jav a  2s.  co m*/
  var d;
  var month;
  var monthNameArr = [];
  var monthKeyArr = [];
  for (var i = number; i >= 0; i--) {
    d = new Date(today.getFullYear(), today.getMonth() - i, 1);
    month = monthNames[d.getMonth() + 1];
    monthNameArr.push(month);
    monthKeyArr.push(d.getMonth() + 1);
  }
  return {
    monthName: monthNameArr,
    month: monthKeyArr,
  };
  //console.log(monthArr);
};

helper.generateOrderId = () => {
  // orderId
  //return Math.floor(100000 + Math.random() * 900000);

  // const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const chars = "0123456789";
  let orderId = "";
  for (let i = 0; i < 10; i++) {
    orderId += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return orderId;
};
helper.generateInvoice = () => {
  // invoiceId
  const chars = "0123456789";
  let invoiceId = "";
  for (let i = 0; i < 7; i++) {
    invoiceId += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return invoiceId;
};

helper.getCurrentHours = () => {
  //India timezone
  const now = new Date();
  const options = {
    timeZone: "Asia/Kolkata",
    hour12: false,
  };
  return now.toLocaleTimeString("en-US", options);

  // const date = new Date();
  // date.setHours(date.getHours() + 5);
  // date.setMinutes(date.getMinutes() + 30);
  // return date
};

helper.generateRandProductId = () => {
  let num = Math.floor(1000000 + Math.random() * 9000000);
  return num; /*6 digit random number*/
};
helper.parseData = (i) => {
  j = i.replace(/([a-zA-Z0-9]+?):/g, '"$1":').replace(/'/g, '"');
  return JSON.parse(j);
};
helper.handlerMongooseErrorResponse = function (res, error) {
  console.log(error);
  if (
    error.name === "ValidationError" ||
    error.name == "ValidatorError" ||
    error.name == "MongoServerError"
  ) {
    let errors = {};
    if (error.code == 11000) {
      errors[0] = "Email already exists!";
    } else {
      Object.keys(error.errors).forEach((key, index) => {
        errors[index] = error.errors[key].message;
      });
    }
    return self.response(res, 422, errors[0]);
  } else {
    return self.response(
      res,
      500,
      "Sorry, Something went wrong, please try again!"
    );
  }
};
helper.CapitalizeWordString = function (str) {
  const arr = str.split(" ");
  //loop through each element of the array and capitalize the first letter.
  for (var i = 0; i < arr.length; i++) {
    arr[i] = arr[i].charAt(0).toUpperCase() + arr[i].slice(1);
  }
  //Join all the elements of the array back into a string
  //using a blankspace as a separator
  const str2 = arr.join(" ");
  return str2;
};
helper.renderHtmlFile = async (htmlFilename, dataToBeRendered) => {
  const filePath = path.join(
    process.cwd(),
    "./public/templates/" + htmlFilename + ""
  );
  return (htmlTemplate = await ejs.renderFile(filePath, dataToBeRendered));
};

// helper.invoiceUpload=async (params)=>{
//     const s3 = new aws.S3({
//         accessKeyId: process.env.AWS_SPACE_KEY_ID,
//         secretAccessKey: process.env.AWS_SPACE_ACCESS_KEY,
//     });
//     await s3.upload(params, async(err, response)=>{
//         if(response){
//             return true
//         }else{
//             return true;
//         }
//     });
//     return true
// }
helper.invoiceUpload = async (params) => {
  const spacesEndpoint = new aws.Endpoint(process.env.S3_DNS);
  return new Promise(async (resolve, reject) => {
    const s3 = new aws.S3({
      endpoint: spacesEndpoint,
      accessKeyId: process.env.S3_ACCESS_KEY_ID,
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
    });
    await s3.upload(params, async (err, response) => {
      if (response) {
        resolve(response);
      } else {
        console.log(err, "err");
        reject("Something went wrong");
      }
    });
  });
};

helper.getAge = async (dateString) => {
  var today = new Date();
  var birthDate = new Date(dateString);
  var age = today.getFullYear() - birthDate.getFullYear();
  var m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  if (age == 0 || m == 12) {
    return m + " Months";
  }
  return age + " Years";
};

// helper.getFileExtension = async function (fileName) {
//   return fileName.slice(((fileName.lastIndexOf(".") - 1) >>> 0) + 2);
// };
helper.getFileExtension = async function (fileName) {
  if (fileName) return fileName.split(".").pop();
};
helper.sendNotificationCredentials = async (
  notificationPayload,
  subscriptions
) => {
  const vapidDetails = {
    email: process.env.VAPID_EMAIL,
    publicKey: process.env.VAPID_PUBLICKEY,
    privateKey: process.env.VAPID_PRIVATEKEY,
  };
  console.log(vapidDetails, "vapidDetailsvapidDetailsvapidDetails");
  webPush.setVapidDetails(
    vapidDetails.email,
    vapidDetails.publicKey,
    vapidDetails.privateKey
  );
  // Send push notifications to all subscribers
  Promise.all(
    subscriptions.map(async (subscription) => {
      webPush
        .sendNotification(
          subscription.subscribeData,
          JSON.stringify(notificationPayload)
        )
        .catch(async (err) => {
          console.error("Error sending push notification");
          await notificationSubscribeDataModel.findOneAndRemove({
            userId: subscription.userId,
            token: subscription.token,
          });
        });
    })
  );
  return "success";
  // try {
  //   await Promise.all(
  //     subscriptions.map(async (subscription) => {
  //       var result = await webPush.sendNotification(
  //         subscription.subscribeData,
  //         JSON.stringify(notificationPayload)
  //       );
  //        console.log(result, "jjjjjjjjjjj");
  //       if (result.statusCode != 200 || result.statusCode != 201) {
  //         await notificationSubscribeDataModel.findOneAndRemove({
  //           userId: subscription.userId,
  //           token: subscription.token,
  //         });
  //       }

  //        return result
  //     })

  //   );
  // } catch (error) {
  //   console.error("Error sending push notification:", error);

  //   // if (error.statusCode === 410) {
  //   //   // Handle 410 Gone - Subscription is no longer valid
  //   //   await notificationSubscribeDataModel.findOneAndRemove({
  //   //     userId: id,
  //   //     token,
  //   //   });

  //   //   return {
  //   //     statusCode: error.statusCode,
  //   //     message: "Subscription is no longer valid",
  //   //   };
  //   // } else {
  //   //   return {
  //   //     statusCode: 500,
  //   //     message: "Unexpected response code",
  //   //   };
  //   // }
  // }
};
helper.sendNotification = async (
  id,
  role,
  productId,
  body,
  notificationFor,
  title,
  _id
) => {
  if (role == "customer") {
    var notificationPayload = {
      notification: {
        title: title,
        body: body,
        icon: "assets/images/logo_blue.png",
      },
    };
    const notificationData = new notificationModel({
      userId: id,
      role: role,
      productId: productId,
      title: notificationPayload.notification.title,
      message: notificationPayload.notification.body,
      notificationFor: notificationFor,
      supplierId: _id,
    });

    notificationData.save();
  }
  if (role == "supplier") {
    var notificationPayload = {
      notification: {
        title: title,
        body: body,
        icon: "assets/images/logo_blue.png",
      },
    };
    const notificationData = new notificationModel({
      userId: _id,
      role: role,
      productId: productId,
      title: notificationPayload.notification.title,
      message: notificationPayload.notification.body,
      notificationFor: "Order placed",
      supplierId: id,
    });

    notificationData.save();
  }
  const subscriptions = await notificationSubscribeDataModel.find(
    {
      userId: id,
    },
    {
      subscribeData: 1,
      _id: 0,
      token: 1,
      userId: 1,
    }
  );
  var data = await helper.sendNotificationCredentials(
    notificationPayload,
    subscriptions
  );
  return data;
};
helper.sendNotificationToAdmin = async (notificationFor, title, body, id) => {
  var adminData = await adminModel.findOne({
    role: "superadmin",
    status: "Active",
  });
  var notificationPayload = {
    notification: {
      title: title,
      body: body,
      icon: "assets/images/logo_blue.png",
    },
  };

  const notificationData = new notificationModel({
    userId: adminData._id,
    role: "admin",
    title: notificationPayload.notification.title,
    message: notificationPayload.notification.body,
    notificationFor: notificationFor,
    supplierId: id,
  });
  notificationData.save();
  const subscriptions = await notificationSubscribeDataModel.find(
    {
      userId: adminData._id,
    },
    {
      subscribeData: 1,
      _id: 0,
      token: 1,
      userId: 1,
    }
  );
  var data = await helper.sendNotificationCredentials(
    notificationPayload,
    subscriptions
  );
  return data;
};
helper.generateCustomerUniqId = async (registerType) => {
  try {
    // Get the current date in MMYY format
    const formattedDate = formattedDateConverter();
    // Find the latest document to get the last serial number
    const latestDocument = await customerModel.findOne(
      {},
      {
        customerUniqId: 1,
      },
      {
        sort: {
          _id: -1,
        },
      }
    );
    // Extract the last serial number and increment it
    let serialNumber = 1;
    if (latestDocument) {
      const lastSerial = parseInt(
        latestDocument.customerUniqId.split("-").pop(),
        10
      );
      serialNumber = isNaN(lastSerial) ? 1 : lastSerial + 1;
    }
    // Format the unique ID
    let uniqueId = "";
    if (registerType === "Individual") {
      uniqueId = `${formattedDate}-ind-${serialNumber
        .toString()
        .padStart(3, "0")}`;
    }
    if (registerType === "Institution") {
      uniqueId = `${formattedDate}-ins-${serialNumber
        .toString()
        .padStart(3, "0")}`;
    }
    return uniqueId;
  } catch (error) {
    console.log(error);
  }
};
helper.generateSellerUniqId = async () => {
  try {
    // Get the current date in MMYY format
    const formattedDate = formattedDateConverter();
    // Find the latest document to get the last serial number
    const latestDocument = await supplierModel.findOne(
      {},
      {
        supplierUniqId: 1,
      },
      {
        sort: {
          _id: -1,
        },
      }
    );
    // Extract the last serial number and increment it
    let serialNumber = 1;
    if (latestDocument) {
      const lastSerial = parseInt(
        latestDocument.supplierUniqId.split("-").pop(),
        10
      );
      serialNumber = isNaN(lastSerial) ? 1 : lastSerial + 1;
    }
    // Format the unique ID
    let uniqueId = `${formattedDate}-${serialNumber
      .toString()
      .padStart(3, "0")}`;

    return uniqueId;
  } catch (error) {
    console.log(error);
  }
};

helper.generateProductUniqId = async (supplierId) => {
  try {
    // Get the current date in MMYY format
    const formattedDate = formattedDateConverter();

    const supplierData = await supplierModel.findOne(
      {
        _id: supplierId,
      },
      {
        supplierUniqId: 1,
      }
    );
    let supplierUniqId = supplierData.supplierUniqId;
    const supplierCode = supplierUniqId.replace(/|-/g, "");
    // Find the latest document to get the last serial number
    const latestDocument = await productModel.findOne(
      {},
      {
        productUniqueId: 1,
      },
      {
        sort: {
          _id: -1,
        },
      }
    );
    // Extract the last serial number and increment it
    let serialNumber = 1;
    if (latestDocument) {
      const lastSerial = parseInt(
        latestDocument.productUniqueId.split("-").pop(),
        10
      );
      serialNumber = isNaN(lastSerial) ? 1 : lastSerial + 1;
    }
    // Format the unique ID 0124-0124001-p-001
    let uniqueId = `${formattedDate}-${supplierCode}-p-${serialNumber
      .toString()
      .padStart(3, "0")}`;

    return uniqueId;
  } catch (error) {
    console.log(error);
  }
};
helper.generateServiceUniqId = async (supplierId) => {
  try {
    // Get the current date in MMYY format
    const formattedDate = formattedDateConverter();
    // Find the latest document to get the last serial number
    const supplierData = await supplierModel.findOne(
      {
        _id: supplierId,
      },
      {
        supplierUniqId: 1,
      }
    );
    let supplierUniqId = supplierData.supplierUniqId;
    const supplierCode = supplierUniqId.replace(/|-/g, "");
    // Find the latest document to get the last serial number
    const latestDocument = await serviceModel.findOne(
      {},
      {
        serviceUniqId: 1,
      },
      {
        sort: {
          _id: -1,
        },
      }
    );
    // Extract the last serial number and increment it
    let serialNumber = 1;
    if (latestDocument) {
      const lastSerial = parseInt(
        latestDocument.serviceUniqId.split("-").pop(),
        10
      );
      serialNumber = isNaN(lastSerial) ? 1 : lastSerial + 1;
    }
    // Format the unique ID 0124-0124001-p-001
    let uniqueId = `${formattedDate}-${supplierCode}-s-${serialNumber
      .toString()
      .padStart(3, "0")}`;

    return uniqueId;
  } catch (error) {
    console.log(error);
  }
};

helper.generateOrderProductUniqId = async (customerUniqId) => {
  try {
    const customerCode = customerUniqId.replace(/|-/g, "");
    // Get the current date in MMYY format
    const formattedDate = formattedDateConverter();
    // Find the latest document to get the last serial number
    const latestDocument = await orderModel.findOne(
      {},
      {
        parentOrderId: 1,
      },
      {
        sort: {
          _id: -1,
        },
      }
    );

    // Extract the last serial number and increment it
    let serialNumber = 1;
    if (latestDocument) {
      const lastSerial = parseInt(
        latestDocument.parentOrderId.split("-").pop(),
        10
      );
      serialNumber = isNaN(lastSerial) ? 1 : lastSerial + 1;
    }
    // Format the unique ID 0124-p-0124ins001-001
    let uniqueId = `${formattedDate}-p-${customerCode}-${serialNumber
      .toString()
      .padStart(3, "0")}`;

    return uniqueId;
  } catch (error) {
    console.log(error);
  }
};

const formattedDateConverter = () => {
  const currentDate = new Date();
  const month = (currentDate.getMonth() + 1).toString().padStart(2, "0");
  const year = currentDate.getFullYear().toString().slice(-2);
  return month + year;
};
helper.isWords = async (num) => {
  console.log(num, "num");
  const a = [
    "",
    "One ",
    "Two ",
    "Three ",
    "Four ",
    "Five ",
    "Six ",
    "Seven ",
    "Eight ",
    "Nine ",
    "Ten ",
    "Eleven ",
    "Twelve ",
    "Thirteen ",
    "Fourteen ",
    "Fifteen ",
    "Sixteen ",
    "Seventeen ",
    "Eighteen ",
    "Nineteen ",
  ];
  const b = [
    "",
    "",
    "Twenty",
    "Thirty",
    "Forty",
    "Fifty",
    "Sixty",
    "Seventy",
    "Eighty",
    "Ninety",
  ];

  if ((num = num.toString()).length > 9) return "overflow";
  n = ("000000000" + num)
    .substr(-9)
    .match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
  if (!n) return;
  var str = "";
  str +=
    n[1] != 0
      ? (a[Number(n[1])] || b[n[1][0]] + " " + a[n[1][1]]) + "crore "
      : "";
  str +=
    n[2] != 0
      ? (a[Number(n[2])] || b[n[2][0]] + " " + a[n[2][1]]) + "lakh "
      : "";
  str +=
    n[3] != 0
      ? (a[Number(n[3])] || b[n[3][0]] + " " + a[n[3][1]]) + "thousand "
      : "";
  str +=
    n[4] != 0
      ? (a[Number(n[4])] || b[n[4][0]] + " " + a[n[4][1]]) + "hundred "
      : "";
  str +=
    n[5] != 0
      ? (str != "" ? "and " : "") +
        (a[Number(n[5])] || b[n[5][0]] + " " + a[n[5][1]]) +
        "only "
      : "";
  return str + " only";
};
helper.convertAmountToWords = async (amount) => {
  const toWords = new ToWords();
  const amountInWords = toWords.convert(amount, { currency: true });
  return amountInWords;
};
helper.generateToken = async () => {
  const body = {
    email: process.env.MAIL_SEND_EMAIL,
    password: process.env.SHIPROCKET_TOKEN_PASSWORD,
  };
  // Making a POST request
  const response = await axios.post(
    process.env.SHIPROCKET_URL + "/auth/login",
    body
  );
  logger.info(`shiprocket generate token ${JSON.stringify(response.data)}`);
  return response.data.token;
};
helper.isNumeric = async (str) => {
  return !isNaN(str) && !isNaN(parseFloat(str));
};
helper.createShiprocketOrder = async (data, token) => {
  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
  const requestConfig = {
    method: "POST",
    url: process.env.SHIPROCKET_URL + "/orders/create/adhoc",
    headers: headers,
    data,
  };
  try {
    const response = await axios(requestConfig);
    logger.info(
      `shiprocket order create api response ${JSON.stringify(response.data)}`
    );
    if (response.status === 200) {
      return response.data;
    } else {
      return null; // or throw an error
    }
  } catch (error) {
    // Handle axios request error
    console.error("Error:", error);
    return null; // or throw an error
  }
};
helper.getAWBNumber = async (shipment_id, courier_id, status, token) => {
  let body = {
    shipment_id,
    courier_id,
    status,
  };
  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
  const requestConfig = {
    method: "POST",
    url: process.env.SHIPROCKET_URL + `/courier/assign/awb`,
    headers: headers,
    data: body,
  };
  try {
    const response = await axios(requestConfig);
    logger.info(`shiprocket assign awb code ${JSON.stringify(response.data)}`);
    if (response.status === 200) {
      return response.data;
    } else {
      return null; // or throw an error
    }
  } catch (error) {
    // Handle axios request error
    console.error("Error:", error);
    return null; // or throw an error
  }
};
helper.orderTrackByAwb = async (awbCode, token) => {
  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
  const requestConfig = {
    method: "GET",
    url: process.env.SHIPROCKET_URL + `/courier/track/awb/${awbCode}`,
    headers: headers,
    data: {},
  };
  try {
    const response = await axios(requestConfig);
    logger.info(`shiprocket tracking by awb ${JSON.stringify(response.data)}`);
    if (response.status === 200) {
      return response.data;
    } else {
      return null; // or throw an error
    }
  } catch (error) {
    // Handle axios request error
    console.error("Error:", error);
    return null; // or throw an error
  }
};
var self = (module.exports = helper);
