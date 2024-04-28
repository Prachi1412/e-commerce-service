const mongoose = require("mongoose");
const { ObjectId } = mongoose.Types;
const bcrypt = require("bcryptjs");
const Helper = require("../../../config/helper");
const CODES = require("../../../config/status_codes/status_codes");
const MSG = require("../../../config/language/Messages");
const adminModel = require("../../../models/AdminModel");
const { logger } = require("../../../logger/winston");
const moment = require("moment-timezone");
module.exports = {
  addUpdate: async (req, res) => {
    try {
      const { _id: createdById } = req.admin;
      const { adminId } = req.body;

      const adminObj = {
        createdById,
        firstName: req.body.firstName || "",
        lastName: req.body.lastName || "",
        role: req.body.role,
        JWT_Token: [],
      };

      if (req.body.password) {
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(req.body.password, salt);
        adminObj.password = hash;
      }

      let existingAdmin;
      if (adminId) {
        existingAdmin = await adminModel.findOne({
          _id: { $ne: new ObjectId(adminId) },
          email: req.body.email,
        });
      } else {
        existingAdmin = await adminModel.findOne({
          email: req.body.email,
          status: { $ne: "Delete" },
        });
      }
      if (existingAdmin) {
        return Helper.response(
          res,
          CODES.STATUS_CODES.Conflict,
          MSG.admin.exists[LOCALE || "en"]
        );
      }

      adminObj.email = req.body.email;
      adminObj.updatedAt = moment().format();
      if (adminId) {
        const updatedAdmin = await adminModel.findByIdAndUpdate(
          new ObjectId(adminId),
          { $set: adminObj },
          { new: true }
        );

        return Helper.response(
          res,
          CODES.STATUS_CODES.OK,
          MSG.admin.update[LOCALE || "en"]
        );
      } else {
        const newAdmin = new adminModel(adminObj);
        await newAdmin.save();
        var html = `
                            Hi ${req.body.firstName},<br>
            You have been added as an ${req.body.role} role for the project.<br>
            Please contact to admin for the login Email & Password.<br>
            Thank you<br><br>`;
        await Helper.send365Email(
          process.env.MAIL_SEND_EMAIL,
          req.body.email,
          `Add User Process`,
          html,
          "text"
        );
        return Helper.response(
          res,
          CODES.STATUS_CODES.OK,
          MSG.admin.add[LOCALE || "en"]
        );
      }
    } catch (error) {
      logger.error({ error });
      console.log(error);
      return Helper.response(
        res,
        CODES.STATUS_CODES.Internal_Server_Error,
        MSG.serverError[LOCALE || "en"]
      );
    }
  },
  list: async (req, res) => {
    try {
      const role = req.query.role || null;
      const search = req.query.search;

      let filter = { status: { $ne: "Delete" }, role: { $ne: "superadmin" } };

      if (role) {
        filter.role = role;
      }
      if (req.query.status) {
        filter.status = req.query.status;
      }
      if (search) {
        let query = {
          $or: [
            { firstName: { $regex: search, $options: "i" } },
            // { lastName: { $regex: search, $options: "i" } },
            { email: { $regex: search, $options: "i" } },
            { role: { $regex: search, $options: "i" } },
          ],
        };
        Object.assign(filter, query);
      }
      const result = await adminModel
        .find(filter)
        .select({
          firstName: 1,
          lastName: 1,
          status: 1,
          email: 1,
          role: 1,
          createdAt: 1,
          updatedAt: 1,
        })
        .sort({ createdAt: -1 })
        .lean();

      if (result && result.length > 0) {
        return Helper.response(
          res,
          CODES.STATUS_CODES.OK,
          MSG.admin.fetch[LOCALE || "en"],
          { list: result }
        );
      } else {
        return Helper.response(
          res,
          CODES.STATUS_CODES.Not_Found,
          MSG.admin.fetch[LOCALE || "en"],
          { list: [] }
        );
      }
    } catch (error) {
      console.log(error);
      logger.error({ error });
      return Helper.response(
        res,
        CODES.STATUS_CODES.Internal_Server_Error,
        MSG.serverError[LOCALE || "en"]
      );
    }
  },
  updateStatus: async (req, res) => {
    try {
      const adminId = req.params.id;
      const { status } = req.body;

      const admin = await adminModel.findOne({ _id: adminId });

      if (admin) {
        const updatedAdmin = await adminModel.findByIdAndUpdate(
          adminId,
          { status, JWT_Token: [] },
          { new: true }
        );

        if (updatedAdmin) {
          return Helper.response(
            res,
            CODES.STATUS_CODES.OK,
            `Admin ${status} successfully`
          );
        } else {
          return Helper.response(
            res,
            CODES.STATUS_CODES.Unprocessable_Entity,
            "Failed to update admin status"
          );
        }
      } else {
        return Helper.response(
          res,
          CODES.STATUS_CODES.Not_Found,
          MSG.notFound[LOCALE || "en"]
        );
      }
    } catch (error) {
      console.error(error);
      return Helper.response(
        res,
        CODES.STATUS_CODES.Internal_Server_Error,
        MSG.serverError[LOCALE || "en"]
      );
    }
  },
};
