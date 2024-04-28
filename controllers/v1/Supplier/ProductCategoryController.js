const CODES = require("../../../config/status_codes/status_codes");
const MSG = require("../../../config/language/Messages");
const { logger } = require("../../../logger/winston");
const mongoose = require("mongoose");
const { ObjectId } = mongoose.Types;

const productCategoryModel = require("../../../models/ProductCategoryModel");
const productSubCategoryModel = require("../../../models/ProductSubCategoryModel");
const Helper = require("../../../config/helper");
module.exports = {
  listProductCategories: async (req, res) => {
    try {
      let agg = [
        {
          $match: {
            productCategoryStatus: {
              $nin: ["Delete", "Inactive"],
            },
          },
        },
        {
          $project: {
            _id: 1,
            productCategoryName: 1,
            productCategoryStatus: 1,
            categoryType: 1,
            createdAt: 1,
            orderPosition:1
          },
        },
        {
          $sort: {
            orderPosition: 1,
          },
        },
      ];

      let myAggregate = await productCategoryModel.aggregate(agg);
      console.log({ myAggregate });
      await Promise.all(
        myAggregate.map(async (item) => {
          item.subCategoryDetails = await productSubCategoryModel.find(
            {
              productCategoryId: item._id,
              status:"Active"
            },
            { subCategoryName: 1 }
          );
        })
      );
      let resData = {
        data: myAggregate,
      };
      Helper.response(
        res,
        200,
        "Product-Categories list fetched successfully.",
        resData
      );
    } catch (err) {
      return Helper.response(res, 500, "Internal server error.");
    }
  },
};
