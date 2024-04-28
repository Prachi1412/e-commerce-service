const CODES = require("../../../config/status_codes/status_codes");
const MSG = require("../../../config/language/Messages");
const mongoose = require("mongoose");
const { ObjectId } = mongoose.Types;
const Helper = require("../../../config/helper");
const AddressModel = require("../../../models/AddressModel");
const { logger } = require("../../../logger/winston");
module.exports = {
  addAddress: async (req, res) => {
    try {
      req.body.customerId = req.user._id;
      const address = new AddressModel(req.body);
      const saveAddress = await address.save();

      if (saveAddress) {
        return Helper.response(
          res,
          CODES.STATUS_CODES.OK,
          "Address added successfully"
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
  updateAddress: async (req, res) => {
    try {
      const { addressId } = req.params;
      req.body.updatedAt = new Date();
      const updatedAddress = await AddressModel.findByIdAndUpdate(
        addressId,
        req.body,
        { new: true }
      );

      if (!updatedAddress) {
        return Helper.response(res, 404, "Address not found");
      }

      return Helper.response(res, 200, "Address updated successfully");
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
  getAddress: async (req, res) => {
    try {
      const customerId = req.user._id;
      const addresses = await AddressModel.find({
        customerId,
        status: "Active",
      }).sort({ orderPosition: -1 });
      var data = { addresses };
      return Helper.response(
        res,
        CODES.STATUS_CODES.OK,
        "Address list fetched",
        data
      );
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
  deleteAddress: async (req, res) => {
    try {
      const { addressId } = req.params;
      const addressData = await AddressModel.findById({
        _id: new mongoose.Types.ObjectId(addressId),
      });
      if (addressData) {
        await AddressModel.findByIdAndUpdate(
          { _id: addressId },
          { $set: { status: "Delete" } },
          { new: true }
        );
        return Helper.response(
          res,
          CODES.STATUS_CODES.OK,
          "Address Deleted Successfully"
        );
      } else {
        return Helper.response(res, 404, "No Data Found");
      }
    } catch (error) {
      console.log(error, "error");
      return Helper.response(
        res,
        CODES.STATUS_CODES.Internal_Server_Error,
        MSG.api.fail[LOCALE || "en"]
      );
    }
  },
  setDefaultAddress: async (req, res) => {
    try {
      const { addressId } = req.params;
      var customerId = req.user._id;
      if (req.body.isDefault == false) {
        var query = { isDefault: false, orderPosition: 0 };
      }
      if (req.body.isDefault == true) {
        var query = { isDefault: true, orderPosition: 1 };
      }
      var customerDefaultAddress = await AddressModel.updateMany(
        { customerId },
        { $set: { isDefault: false, orderPosition: 0 } },
        { multi: true }
      );

      const updatedAddress = await AddressModel.findByIdAndUpdate(
        addressId,
        { $set: query},
        { new: true }
      );
      if (!updatedAddress) {
        return Helper.response(res, 404, "Address not found");
      }
      return Helper.response(res, 200, "Default Address Set Successfully");
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
};
