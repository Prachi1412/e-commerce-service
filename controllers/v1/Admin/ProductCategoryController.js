const util = require("util");
const Helper = require("../../../config/helper");
const CODES = require("../../../config/status_codes/status_codes");
const MSG = require("../../../config/language/Messages");

const categoryModel = require("../../../models/ProductCategoryModel");
const productCategoryModel = require("../../../models/ProductCategoryModel");
const productModel = require("../../../models/ProductModel");
const ServiceModel = require("../../../models/ServiceModel");
const categoryUpload =
  Helper.upload_space("productCategory").array("categoryImages");

// Promisify the categoryUpload function to use async/await
const promisifiedCategoryUpload = util.promisify(categoryUpload);

module.exports = {
  categoryAdd: async (req, res) => {
    try {
      console.log("req.files :", req.file);
      const result = await promisifiedCategoryUpload(req, res);
      console.log("result : ", result);

      if (result instanceof Error) {
        return Helper.response(res, 422, "Something went wrong");
      } else {
        console.log("req.files inside else  :", req.files);
        var productCategoryImage = []
        if (req.files.length) {
          for (var i = 0; i < req.files.length; i++) {
            var categoryImages = req.files[i].location.split("productCategory/");
            productCategoryImage.push(categoryImages[1]);
          }

        }
        console.log("categoryImages : ", categoryImages);
        const categoryData = {
          // productTypeId: req.body.productTypeId,
          productCategoryName: req.body.categoryName.trim(),
          productCategoryImage: productCategoryImage,
          categoryType: req.body.categoryType
        };
        console.log("categoryData : ", categoryData);

        const category = new categoryModel(categoryData);
        await category.save();
        return Helper.response(
          res,
          CODES.STATUS_CODES.OK,
          "Category added successfully!"
        );
      }
    } catch (error) {
      console.error("Error creating category:", error);
      return Helper.response(
        res,
        CODES.STATUS_CODES.Internal_Server_Error,
        MSG.api.fail[LOCALE]
      );
    }
  },
  getCategoryDetails: async (req, res) => {
    try {
      const productCategoryId = req.params.id;


      //{"-JWT_Token -otp -isOtpVerified -device_Token"}

      //  const userInfo = await productModel
      //    .findOne(
      //      { _id: ObjectId(id) },
      //      { JWT_Token: 0, otp: 0, isOtpVerified: 0, device_Token: 0 }
      //    )
      //    .lean();
      const productCategoryDetails = await categoryModel
        .findById(
          productCategoryId
          // {
          //     password: 0,
          //     JWT_Token: 0,
          //     _v: 0,
          // }
        )
        .lean();
      console.log({
        productCategoryDetails
      });

      if (productCategoryDetails) {
        // productCategoryDetails.orderList = await orderByUser(id);
        let productCategoryImage = [];
        for (let i = 0; i < productCategoryDetails.productCategoryImage.length; i++) {
          productCategoryImage.push({
            imgUrl: process.env.IMAGE_URL + 'productCategory/' + productCategoryDetails.productCategoryImage[i],
            imgName: productCategoryDetails.productCategoryImage[i],
          });
        }
        productCategoryDetails.productCategoryImage = productCategoryImage;

        // imgName: productCategoryDetails.productCategoryImage[i].imgName,

        return Helper.response(res, 200, MSG.success[LOCALE || "en"], {
          productCategoryDetails,
        });
      }
      return Helper.response(res, 402, MSG.notFound[LOCALE || "en"]);
    } catch (error) {
      return Helper.response(res, 500, MSG.serverError[LOCALE || "en"]);
    }
  },
  listProductCategories: async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit) : 200;
      const page = req.query.page ? parseInt(req.query.page) : 1;
      var query = {
        productCategoryStatus: {
          $ne: "Delete"
        }
      };
      if (req.query.productCategoryStatus) {
        query.productCategoryStatus = {
          $eq: req.query.productCategoryStatus
        };
      }
      if (req.query.search) {
        let searchObject = {
          $or: [{
              productCategoryName: {
                $regex: req.query.search,
                $options: "i"
              },
            },
            {
              categoryType: {
                $regex: req.query.search,
                $options: "i"
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
          createdAt: {
            $gte: new Date(startsDate),
            $lte: new Date(endsDate)
          },
        };
        Object.assign(query, dateFilter);
      }
      let agg = [{
          $match: query
        },
        {
          $project: {
            _id: 1,
            productCategoryName: 1,
            productCategoryStatus: 1,
            productCategoryImage: 1,
            categoryType: 1,
            orderPosition: 1,
            createdAt: 1
          },
        },
        {
          $sort: {
            orderPosition: 1,
          },
        },
      ];
      const options = {
        page: page,
        limit: limit,
        allowDiskUse: true
      };
      let myAggregate = productCategoryModel.aggregate(agg);
      productCategoryModel.aggregatePaginate(myAggregate, options, async function (err, result) {
        if (err) {
          console.log(err, "<<<<,err")
          return Helper.response(res, 500, "Internal server error.", err);
        } else {
          if (result.docs.length > 0) {
            let categoryList = result.docs;
            let totalResult = result.totalDocs;

            await Promise.all(categoryList.map(async function (item) {
              let productCategoryImageArr = []
              for (let i = 0; i < item.productCategoryImage.length; i++) {
                var fileExe = await Helper.getFileExtension(item.productCategoryImage[i])
                productCategoryImageArr.push({
                  imgUrl: process.env.IMAGE_URL + 'productCategory/' + item.productCategoryImage[i],
                  imgName: item.productCategoryImage[i],
                  fileType: fileExe
                });
              }
              item.productCategoryImage = productCategoryImageArr
            }))
            let resData = {
              data: categoryList,
              totalResult: totalResult,
              limit: limit
            };
            Helper.response(res, 200, "Category list fetched successfully.", resData);
          } else {
            Helper.response(res, CODES.STATUS_CODES.Not_Found, "Category list fetched successfully.", {
              data: []
            });
          }
        }
      })
    } catch (err) {
      console.log(err)
      return Helper.response(res, 500, "Internal server error.");
    }
  },
  productCategoryDetails: async (req, res) => {
    try {
      const productCategoryId = req.params.id;
      console.log({
        productCategoryId
      });

      //{"-JWT_Token -otp -isOtpVerified -device_Token"}

      //  const userInfo = await productModel
      //    .findOne(
      //      { _id: ObjectId(id) },
      //      { JWT_Token: 0, otp: 0, isOtpVerified: 0, device_Token: 0 }
      //    )
      //    .lean();
      const productCategoryDetails = await categoryModel.findById(
        productCategoryId
        // {
        //     password: 0,
        //     JWT_Token: 0,
        //     _v: 0,
        // }
      );
      console.log({
        productCategoryDetails
      });

      if (productCategoryDetails) {
        // productCategoryDetails.orderList = await orderByUser(id);
        return Helper.response(res, 200, MSG.success[LOCALE || "en"], {
          productCategoryDetails,
        });
      }
      return Helper.response(res, 402, MSG.notFound[LOCALE || "en"]);
    } catch (error) {
      return Helper.response(res, 500, MSG.serverError[LOCALE || "en"]);
    }
  },
  updateCategoryDetails: async (req, res) => {
    try {
      const categoryId = req.params.id;
      var productCategoryImage = [];
      const result = await promisifiedCategoryUpload(req, res);
      if (result instanceof Error) {
        return Helper.response(res, 422, "Something went wrong");
      }



      // Check if the category with the provided ID exists
      const existingCategory = await categoryModel.findById(categoryId);
      if (!existingCategory) {
        return Helper.response(res, 404, "Category not found");
      }

      // Handle file uploads if files are present in the request
      if (req.files && req.files.length) {
        for (let i = 0; i < req.files.length; i++) {
          const categoryImages = req.files[i].location.split("productCategory/");
          productCategoryImage.push(categoryImages[1]);
        }
      } else {
        productCategoryImage = existingCategory.productCategoryImage
      }
      existingCategory.productCategoryName = req.body.categoryName
      existingCategory.productCategoryImage = productCategoryImage;
      existingCategory.categoryType = req.body.categoryType;

      // Save the updated category
      await existingCategory.save();

      return Helper.response(res, CODES.STATUS_CODES.OK, "Category updated successfully!");
    } catch (error) {
      console.error("Error updating category:", error);
      return Helper.response(res, CODES.STATUS_CODES.Internal_Server_Error, MSG.api.fail[LOCALE]);
    }
  },
  ChangeProductCategoryStatus: async (req, res) => {
    try {
      const _id = req.params.categoryId;
      if (req.body.productCategoryStatus == "Delete" || req.body.productCategoryStatus == "Inactive") {
        let chackCategory = await productModel.findOne({
          productCategoryId: _id
        })
        if (chackCategory) {
          return Helper.response(res, 404, "This category is already used in a product.");
        }
        let checkCatInService = await ServiceModel.findOne({
          productCategoryId: _id
        })
        if (checkCatInService) {
          return Helper.response(res, 404, "This Category is already used in a service.");
        }
      }

      const doesproductExist = await categoryModel.findById(_id);
      if (doesproductExist) {
        const updatedProductDetails = await categoryModel.findByIdAndUpdate(
          _id, {
            $set: req.body
          }, {
            new: true
          }
        );
        console.log({
          updatedProductDetails
        });
        if (!updatedProductDetails) {
          return Helper.response(
            res,
            404,
            "Not found"
          );
        }
        return Helper.response(
          res,
          200,
          "Status changed successfully"
        );
      } else {
        return Helper.response(
          res,
          404,
          "Not found"
        );
      }
    } catch (error) {
      console.log(error)
      return Helper.response(
        res,
        500,
        "Internal error"
      );
    }
  },
  reorderCategory: async (req, res) => {
    try {
      const {
        payload
      } = req.body;
      for (let i = 0; i < payload.length; i += 1) {
        let item = payload[i];
        await categoryModel.findByIdAndUpdate({
          _id: item
        }, {
          orderPosition: i
        });
      }
      const allCategory = await categoryModel
        .find({
          productCategoryStatus: {
            $ne: "Delete"
          }
        })
        .sort({
          orderPosition: 1
        })
        .lean();
      return Helper.response(res, 200, "Re-ordered list", {
        allCategory: allCategory
      });
    } catch (error) {
      return Helper.response(
        res,
        CODES.STATUS_CODES.Internal_Server_Error,
        MSG.api.fail[LOCALE || "en"]
      );
    }
  },
}