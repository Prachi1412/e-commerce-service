const CODES = require("../../../config/status_codes/status_codes");
const MSG = require("../../../config/language/Messages");
const mongoose = require("mongoose");
const { ObjectId } = mongoose.Types;
const Helper = require("../../../config/helper");
const InstitutionModel = require("../../../models/InstitutionModel");
const ProfessionModel = require("../../../models/ProfessionModel");
const { logger } = require("../../../logger/winston");
module.exports = {
  getInstitutionList: async (req, res) => {
    try {
      const institution = await InstitutionModel.find(
        {
          status: "Active",
        },
        { name: 1, status: 1 }
      ).sort({ orderPosition: 1 });
      var data = {
        institution,
      };
      return Helper.response(
        res,
        CODES.STATUS_CODES.OK,
        "Institution list fetched",
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
  getProfessionList: async (req, res) => {
    try {
      const profession = await ProfessionModel.find(
        {
          status: "Active",
        },
        { name: 1, status: 1 }
      ).sort({ orderPosition: 1 });
      var data = {
        profession,
      };
      return Helper.response(
        res,
        CODES.STATUS_CODES.OK,
        "Profession list fetched",
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
};
