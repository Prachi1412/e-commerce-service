const util = require("util");
const Helper = require("../../../config/helper");
const CODES = require("../../../config/status_codes/status_codes");
const MSG = require("../../../config/language/Messages");

const productClassificationModel = require("../../../models/ProductClassificationModel");
const productModel = require("../../../models/ProductModel");
module.exports = {
  addProductClassification: async (req, res) => {
    try {
      const { productClassificationName } = req.body;
      const classificationData = {
        productClassificationName: productClassificationName.trim(),
      };
      const result = new productClassificationModel(classificationData);
      await result.save();
      return Helper.response(
        res,
        CODES.STATUS_CODES.OK,
        "Product-Classification added successfully!",
        { response: result }
      );
    } catch (error) {
      console.error("Error creating Product-Classification:", error);
      return Helper.response(
        res,
        CODES.STATUS_CODES.Internal_Server_Error,
        MSG.api.fail[LOCALE]
      );
    }
  },
  updateProductClassification: async (req, res) => {
    try {
      const { _id } = req.params;

      let checkCalssificationInProduct = await productModel.findOne({
        productClassifications: _id,
      });
      if (checkCalssificationInProduct) {
        return Helper.response(
          res,
          404,
          "This classification is already used in a product."
        );
      }
      // Find the existing product classification by ID
      let existingProductClassification =
        await productClassificationModel.findOneAndUpdate(
          { _id },
          { $set: req.body },
          { new: true }
        );

      // Check if the product classification exists
      if (!existingProductClassification) {
        return Helper.response(res, 404, "Product classification not found.");
      }

      // Update the product classification name

      return Helper.response(
        res,
        CODES.STATUS_CODES.OK,
        "Classification deleted successfully"
      );
    } catch (error) {
      console.error("Error updating Product-Classification:", error);
      return Helper.response(res, 500, MSG.api.fail[LOCALE]);
    }
  },
  listProductClassification: async (req, res) => {
    console.log("inside listProductClassification fn ;");
    try {
      var query = {
        productClassificationStatus: {
          $nin: ["Delete"],
        },
      };
      if (req.query.search) {
        const searchObject = {
          $or: [
            {
              productClassificationName: {
                $regex: req.query.search,
                $options: "i",
              },
            },
          ],
        };
        Object.assign(query, searchObject);
      }
      var startsDate = req.query.startDate ? req.query.startDate : null;
      let endsDate = req.query.endDate ? req.query.endDate : null;
      endsDate = Helper.modifyDate(endsDate, 1);

      if (startsDate && endsDate) {
        var dateFilter = {
          createdAt: { $gte: new Date(startsDate), $lte: new Date(endsDate) },
        };
        Object.assign(query, dateFilter);
      }
      let agg = [
        {
          $match: query,
        },
        {
          $project: {
            _id: 1,
            productClassificationName: 1,
            productClassificationStatus: 1,
            createdAt: 1,
          },
        },
        {
          $sort: {
            createdAt: -1,
          },
        },
      ];

      let myAggregate = await productClassificationModel.aggregate(agg);
      console.log({ myAggregate });

      let resData = {
        resultList: myAggregate,
      };
      Helper.response(
        res,
        200,
        "Classification list fetched successfully.",
        resData
      );
    } catch (err) {
      return Helper.response(res, 500, "Internal server error.");
    }
  },
};
