const CODES = require("../../../config/status_codes/status_codes");
const MSG = require("../../../config/language/Messages");
const { logger } = require("../../../logger/winston");
const mongoose = require("mongoose");
const { ObjectId } = mongoose.Types;
// ObjectId = new ObjectId();

const productClassificationModel = require("../../../models/ProductClassificationModel");

const Helper = require("../../../config/helper");
module.exports = {
listProductClassification : async (req, res) =>{
  console.log("inside listProductClassification fn ;");
  try {
    let agg = [
      {
        $match: {
          productClassificationStatus: {
            $nin: ["Delete", "Inactive"],
          },
        },
      },
      {
        $project: {
          _id: 1,
          productClassificationName: 1,
          productClassificationStatus: 1,
          createdAt:1
        },
      },
      {
        $sort: {
          createdAt: -1
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
}
}

