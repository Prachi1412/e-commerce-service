const util = require("util");
const Helper = require("../../../config/helper");
const CODES = require("../../../config/status_codes/status_codes");
const MSG = require("../../../config/language/Messages");

const subCategoryModel = require("../../../models/ProductSubCategoryModel");
const productSubCategoryModel = require("../../../models/ProductSubCategoryModel");
const productModel = require("../../../models/ProductModel");
const mongoose = require("mongoose");
const {
  ObjectId
} = mongoose.Types;
module.exports = {
  addSubCategory: async (req, res) => {
    try {
      const categoryData = {
        productCategoryId: req.body.productCategoryId,
        subCategoryName: req.body.subCategoryName.trim(),
      };
      const category = new subCategoryModel(categoryData);
      await category.save();
      return Helper.response(
        res,
        CODES.STATUS_CODES.OK,
        "Sub category added successfully!", {
          response: categoryData
        }
      );
    } catch (error) {
      console.error("Error creating category:", error);
      return Helper.response(
        res,
        CODES.STATUS_CODES.Internal_Server_Error,
        MSG.api.fail[LOCALE]
      );
    }
  },
  productSubCategoryDetails: async (req, res) => {
    try {
      const productSubCategoryId = req.params.id;
      console.log({
        productSubCategoryId
      });

      //{"-JWT_Token -otp -isOtpVerified -device_Token"}

      //  const userInfo = await productModel
      //    .findOne(
      //      { _id: ObjectId(id) },
      //      { JWT_Token: 0, otp: 0, isOtpVerified: 0, device_Token: 0 }
      //    )
      //    .lean();
      const productSubCategoryDetails = await subCategoryModel.findById(
        productSubCategoryId
        // {
        //     password: 0,
        //     JWT_Token: 0,
        //     _v: 0,
        // }
      );
      console.log({
        productSubCategoryDetails
      });

      if (productSubCategoryDetails) {
        // productSubCategoryDetails.orderList = await orderByUser(id);
        return Helper.response(res, 200, MSG.success[LOCALE || "en"], {
          productSubCategoryDetails,
        });
      }
      return Helper.response(res, 402, MSG.notFound[LOCALE || "en"]);
    } catch (error) {
      return Helper.response(res, 500, MSG.serverError[LOCALE || "en"]);
    }
  },
  listSubProductCategories: async (req, res) => {
    try {
      let productCategoryId = req.params.id;
      const productCategoryIdArray = productCategoryId.split(',');
      var query = {
        productCategoryId: {
          $in: productCategoryIdArray
        },
        status: {
          $ne: "Delete"
        },
      };
      if (req.query.status) {
        query.status = {
          $eq: req.query.status
        };
      }
      if (req.query.search) {
        let searchObject = {
          $or: [{
            subCategoryName: {
              $regex: req.query.search,
              $options: "i"
            },
          }, ],
        };
        Object.assign(query, searchObject);
      }
      let productCategoryDetails = await productSubCategoryModel
        .find(query)
        .sort({
          orderPosition: 1
        });

      if (productCategoryDetails.length == 0) {
        return Helper.response(res, 404, "Product details not found.");
      }
      return Helper.response(res, 200, "Subcategory details.", {
        data: productCategoryDetails,
      });
      // Rest of your code remains unchanged...
    } catch (err) {
      return Helper.response(res, 500, "Internal server error.");
    }
  },
  updateSubCategoryDetails: async (req, res) => {
    try {
      const subCategoryId = req.params.id;
      let fieldsToUpdate = req.body;
      if (fieldsToUpdate.hasOwnProperty("productCategoryId")) {
        fieldsToUpdate.productCategoryId = new ObjectId(
          fieldsToUpdate.productCategoryId
        );
      }

      console.log({
        fieldsToUpdate
      }, subCategoryId);
      if (req.body.status == "Delete") {
        let chackSubCategory = await productModel.findOne({
          productSubCategoryId: subCategoryId,
        });
        if (chackSubCategory) {
          return Helper.response(
            res,
            404,
            "This SubCategory is already used in a product."
          );
        }
      }
      const updatedSubCategory = await subCategoryModel
        .findByIdAndUpdate(
          subCategoryId, {
            $set: fieldsToUpdate
          }, {
            new: true
          }
        )
        .lean();
      if (updatedSubCategory) {
        return Helper.response(
          res,
          CODES.STATUS_CODES.OK,
          "Category updated successfully!"
        );
      } else {
        // Category not found
        return Helper.response(res, 404, "Category not found!");
      }
    } catch (error) {
      console.error("Error updating category:", error);
      return Helper.response(
        res,
        CODES.STATUS_CODES.Internal_Server_Error,
        MSG.serverError[LOCALE || "en"]
      );
    }
  },
  reorderSubCategory: async (req, res) => {
    try {
      const {
        payload
      } = req.body;
      for (let i = 0; i < payload.length; i += 1) {
        console.log(payload[i]);
        let item = payload[i];
        await productSubCategoryModel.findByIdAndUpdate({
          _id: item
        }, {
          orderPosition: i
        });
      }
      // const allSubCategory = await productSubCategoryModel
      //   .find({
      //     status: {
      //       $ne: "Delete"
      //     }
      //   })
      //   .sort({
      //     orderPosition: 1
      //   })
      //   .lean();
      return Helper.response(res, 200, "Re-ordered list");
    } catch (error) {
      return Helper.response(
        res,
        CODES.STATUS_CODES.Internal_Server_Error,
        MSG.api.fail[LOCALE || "en"]
      );
    }
  },
};