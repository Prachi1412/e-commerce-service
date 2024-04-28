const CODES = require("../../../config/status_codes/status_codes");
const MSG = require("../../../config/language/Messages");
const { logger } = require("../../../logger/winston");
const mongoose = require("mongoose");
const { ObjectId } = mongoose.Types;
// ObjectId = new ObjectId();

const productSubCategoryModel = require("../../../models/ProductSubCategoryModel");

const Helper = require("../../../config/helper");
module.exports = {
  listSubProductCategories: async (req, res) => {
    console.log("inside listProductCategories fn ;");
    try {
      let { productCategoryId } = req.body;
      console.log({ productCategoryId });
      let productCategoryDetails = await productSubCategoryModel.find({
        productCategoryId: {$in: productCategoryId}, status : "Active",
      });
    

      if (!productCategoryDetails) {
        return Helper.response(res, 404, "Product details not found.");
      }
      return Helper.response(res, 200, "Subcategory details.", { data: productCategoryDetails });
      // Rest of your code remains unchanged...

    } catch (err) {
      return Helper.response(res, 500, "Internal server error.");
    }
  }
}
