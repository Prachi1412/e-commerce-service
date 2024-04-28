const mongoose = require("mongoose");
// const customerModel = mongoose.model("Customer");
const supplierModel = require("../../../models/SupplierModel");
const Helper = require("../../../config/helper");
const error = require("mongoose/lib/error");
const errors = require("../../../utilities/errors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const helper = require("../../../config/helper");
const SECRET_KEY = process.env.JWT_SECRET;
const CODES = require("../../../config/status_codes/status_codes");
const MSG = require("../../../config/language/Messages");
const { ObjectId } = mongoose.Types;

module.exports = {
register: async(req, res)=> {
  console.log("Inside Supplier Register Function....");
  const { name, email, password } = req.body;
  console.log({ name, email, password });
  // res.send('Admin Controller login function called .....')

  let customer = new customerModel(req.body);

  try {
    customer = await customer.save();
    console.log("saved ::::: ", { customer });
    if (!customer) {
      // return Helper.response(res, 422, "Something went wrong..");
      console.log("Inside !customer condition....", error);
      throw new Error("Something went wrong...");
    }

    res.json({
      statusCode: 200,
      data: customer,
      message: "Customer created successfully.",
    });
    // return Helper.response(
    //     res,
    //     200,
    //     "Customer Registered Successfully.", { data: customer }
    // );
  } catch (error) {
    console.log("Error :  ", error);
    console.log("customer details : ", customer);
    let x = await customer.deleteOne({ _id: customer._id });
    console.log("deleted customer : ", x);

    // res.json({
    //   error: error,
    //   msg: error.message,
    // });
    // throw new Error(error)
    // return Helper.response(res, 500, "Server error.", { error: error.message });
    return Helper.handlerMongooseErrorResponse(res, error);

    // throw new errors.ExpErrorHandler(errorHandler.getErrorMessage(error));
  }
},
selfRegister : async(req, res)=> {
  // let supplierDetailsSaved;
  let supplierDetails = new supplierModel(req.body);

  try {
    console.log(
      "password field b4 hashing : ",
      supplierDetails.password,
      typeof supplierDetails.password
    );
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(supplierDetails.password, salt);
    supplierDetails.password = hashedPassword;

    supplierDetails = await supplierDetails.save();
    if (!supplierDetails) {
      //throw an error if the details are not saved
      return Helper.response(res, 400, "Bad request.");
    }

    console.log({ supplierDetails });

    //if supplier primary details are registered , then generate jwt for further details fill-up
    let supplierToken = helper.generate_jwt(supplierDetails._id);
    if (!supplierToken) {
      //throw an error when token not generated
      return Helper.response(res, 400, "Invalid user credentials.");
    }

    let updatedSupplierDetails = await supplierModel
      .findByIdAndUpdate(
        supplierDetails._id,
        {
          $set: { JWT_Token: supplierToken },
        },
        { new: true }
      )
      .select({ password: 0, __v: 0 });

    if (!updatedSupplierDetails) {
      return Helper.response(res, 404, "Supplier not found!");
    }

    res.status(200).json({
      code: 200,
      message:
        "Supplier Registered Successful. Please fill further details to complete profile.",
      supplierDetails: updatedSupplierDetails,
      role: updatedSupplierDetails.role,
      // JWT_Token: updatedSupplierDetails.JWT_Token,
      // role,
      // _isAdminPermission: _isAdminPermission[role],
    });
  } catch (error) {
    console.log("Error :  ", error);
    console.log("supplier details : ", supplierDetails);
    let x = await supplierModel.deleteOne({ _id: supplierDetails._id });
    console.log("deleted supplier : ", x);

    // res.json({
    //   error: error,
    //   msg: error.message,
    // });
    // throw new Error(error)
    // return Helper.response(res, 500, "Server error.", { error: error.message });
    return Helper.handlerMongooseErrorResponse(res, error);
  }
},

updateProfileStepOne : async(req, res) => {
  try {
    const { user: supplierDetails } = req;
    console.log({ supplierDetails });

    let reqBodyData = req.body;
    console.log({ reqBodyData });

    const filteredFields = {};

    for (const [key, value] of Object.entries(reqBodyData)) {
      if (typeof value !== "object") {
        filteredFields[key] = value;
      }
    }
    console.log(filteredFields);

    // let profileDetails = req.body.businessDetails;
    // console.log({ profileDetails });

    let mongodbUpdate = {};

    if ("businessDetails" in req.body) {
      // Property exists in the object
      console.log(`businessDetails exist in req.body :::::::`);

      let businessDetailsUpdate = {};
      Object.keys(req.body.businessDetails).forEach((key, index) => {
        const value = req.body.businessDetails[key];
        console.log(`Index ${index}: Key - ${key}, Value - ${value}`);
        businessDetailsUpdate[`businessDetails.${key}`] = value;
      });

      // mongodbUpdate = { ...businessDetailsUpdate };
      Object.assign(mongodbUpdate, businessDetailsUpdate);
    }

    if ("kycDetails" in req.body) {
      // Property exists in the object
      console.log(`kycDetails exist in req.body :::::::`);

      let kycDetailsUpdate = {};
      Object.keys(req.body.kycDetails).forEach((key, index) => {
        const value = req.body.kycDetails[key];
        console.log(`Index ${index}: Key - ${key}, Value - ${value}`);
        kycDetailsUpdate[`kycDetails.${key}`] = value;
      });

      // mongodbUpdate = { ...kycDetailsUpdate };
      Object.assign(mongodbUpdate, kycDetailsUpdate);
    }

    if ("bankDetails" in req.body) {
      // Property exists in the object
      console.log(`bankDetails exist in req.body :::::::`);

      let bankDetailsUpdate = {};
      Object.keys(req.body.bankDetails).forEach((key, index) => {
        const value = req.body.bankDetails[key];
        console.log(`Index ${index}: Key - ${key}, Value - ${value}`);
        bankDetailsUpdate[`bankDetails.${key}`] = value;
      });

      // mongodbUpdate = { ...bankDetailsUpdate };
      Object.assign(mongodbUpdate, bankDetailsUpdate);
    }

    Object.assign(mongodbUpdate, filteredFields);

    let updateData = {
      $set: mongodbUpdate,
    };

    console.log({ updateData });

    let updateDetails = await supplierModel
      .findByIdAndUpdate(supplierDetails._id, updateData, { new: true })
      .select({ password: 0, __v: 0 });
    console.log({ updateDetails });

    if (!updateDetails) {
      // throw an error
      return Helper.response(res, 404, "Supplier details not found!");
    }

    return Helper.response(
      res,
      CODES.STATUS_CODES.OK,
      MSG.profile.update[LOCALE || "en"],
      { supplierDetails: updateDetails, role: updateDetails.role }
    );

    // res.json({ updateDetails });
    // res.redirect("profile-step-two");
    // next();
  } catch (error) {
    console.log({ error });
  }
},

updateProfileStepTwo : async(req, res) =>{
  try {
    console.log("Inside Redirected to 3rd page controler");
    res.json("Third page success");
    // const { user: supplierDetails } = req;
    // console.log({ supplierDetails });

    // let reqBodyData = req.body;
    // console.log({ reqBodyData });

    // let updateData;

    // let profileDetails = req.body.businessDetails;
    // if ("businessDetails" in req.body) {
    //   // Property exists in the object
    //   console.log(`businessDetails exist in req.body :::::::`);
    // }

    // if ("kycDetails" in req.body) {
    //   // Property exists in the object
    //   console.log(`kycDetails exist in req.body :::::::`);
    // }

    // if ("bankDetails" in req.body) {
    //   // Property exists in the object
    //   console.log(`bankDetails exist in req.body :::::::`);
    // }
    // console.log({ profileDetails });
    // let { licenseNo, tradeLicenseValidity, description } = profileDetails;

    // let { from, to } = tradeLicenseValidity;
    // console.log({ licenseNo, description, from, to });

    // updateData = {
    //   $set: {
    //     "businessDetails.licenseNo": licenseNo,
    //     "businessDetails.tradeLicenseValidity.from": from,
    //     "businessDetails.tradeLicenseValidity.to": to,
    //     "businessDetails.description": description,
    //   },
    // };

    // let updateDetails = await supplierModel.findByIdAndUpdate(
    //   supplierDetails._id,
    //   updateData,
    //   { new: true }
    // );
    // console.log({ updateDetails });

    // if (!updateDetails) {
    //   // throw an error
    //   return Helper.response(res, 404, "Supplier not found!");
    // }

    // res.json({ msg: "Third page success" });
  } catch (error) {
    console.log({ error });
  }
},
viewProfile : async(req, res) =>{
  try {
    console.log("Inside Customer viewProfile Controller");
    const loggedInUser = req.user;
    console.log({ loggedInUser });
    res.json({ data: loggedInUser });
  } catch (error) {
    console.log("Error :  ", error);
    return Helper.response(res, 500, "Server error.");
  }
}
}

