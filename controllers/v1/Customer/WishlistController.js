const CODES = require("../../../config/status_codes/status_codes");
const MSG = require("../../../config/language/Messages");
const { logger } = require("../../../logger/winston");
const supplierModel = require("../../../models/SupplierModel");
const mongoose = require("mongoose");
const { ObjectId } = mongoose.Types;
// ObjectId = new ObjectId();

const ProductModel = require("../../../models/ProductModel");
const WishlistModel = require("../../../models/WishListModel");
const Helper = require("../../../config/helper");

module.exports = {
  addRemoveFromWishList: async (req, res) => {
    try {
      const { productId } = req.body;
      const customerId = req.user._id;
      var productObj = {
        customerId,
        productId,
      };
      const product = await ProductModel.findOne({ _id: productId });
      if (!product) {
        // If the product does not exist, return an error response
        return Helper.response(res, 404, "Product not found!", {
          productList: [],
        });
      } else {
        // Check if the product is already in the cart collection
        productObj.supplierId = product.supplierId;
        const wishlistItem = await WishlistModel.findOne({
          customerId,
          productId,
        });

        if (wishlistItem) {
          // If the product is already in the cart collection, update the quantity
          var result = await WishlistModel.findOneAndRemove({
            customerId,
            productId,
          });
          return Helper.response(res, 200, "Removed from wishlist");
        } else {
          // If the product is not in the cart collection, insert a new document
          const checkWishlistLimit = await WishlistModel.find({
            customerId,
          }).count();
          if (checkWishlistLimit == process.env.WISHLISTLIMIT) {
            return Helper.response(
              res,
              404,
              "You can add only 10 product in your wishlist."
            );
          }
          const wishlist = new WishlistModel(productObj);
          wishlist
            .save()
            .then(async (result) => {
              if (result) {
                return Helper.response(res, 200, "Product added to wishlist.");
              }
            })
            .catch((error) => {
              res.status(400).json({ error: error });
            });
        }
      }
    } catch (err) {
      console.log(err);
      return Helper.response(res, 500, "Server error.", err);
    }
    try {
    } catch (err) {
      return Helper.response(res, 500, "Internal server error.");
    }
  },
  getWishlist: async (req, res) => {
    const limit = req.query.limit ? parseInt(req.query.limit) : 15;
    const page = req.query.page ? parseInt(req.query.page) : 1;
    const customerId = req.user._id;
    const query = { customerId: customerId, status: { $ne: "Delete" } };
    console.log(customerId, "customerId");
    let agg = [
      {
        $lookup: {
          from: "Product",
          localField: "productId",
          foreignField: "_id",
          as: "productDetails",
        },
      },
      { $unwind: "$productDetails" },
      { $match: query },
      { $sort: { createdAt: -1 } },
      {
        $project: {
          productId: 1,
          status: 1,
          customerId: 1,
          supplierId: 1,
          productDetails: "$productDetails",
        },
      },
    ];
    const options = {
      page: page,
      limit: limit,
      allowDiskUse: true,
    };
    console.log(JSON.stringify(agg), "aaaaaaaaaaa");
    let myAggregate = WishlistModel.aggregate(agg);
    WishlistModel.aggregatePaginate(
      myAggregate,
      options,
      async function (err, result) {
        if (err) {
          console.log(err, "err");
          return Helper.response(res, 500, "Internal server error.");
        } else {
          if (result.docs.length > 0) {
            let wishlistItems = result.docs;
            let totalResult = result.totalDocs;
            if (wishlistItems.length > 0) {
              await Promise.all(
                wishlistItems.map(async function (item) {
                  if (item.productDetails.productImages.length > 0) {
                    let productImages = [];
                    for (
                      let i = 0;
                      i < item.productDetails.productImages.length;
                      i++
                    ) {
                      productImages.push({
                        imgUrl:
                          process.env.IMAGE_URL +
                          "suppliers/" +
                          item.productDetails.productImages[i].imgName,
                      });
                    }
                    item.productDetails.productImages = productImages;
                  }
                  if (
                    item.productDetails.productImageThumbnail != undefined &&
                    item.productDetails.productImageThumbnail.length > 0
                  ) {
                    let productImageThumbnail = [];
                    for (
                      let i = 0;
                      i < item.productDetails.productImageThumbnail.length;
                      i++
                    ) {
                      productImageThumbnail.push({
                        imgUrl:
                          process.env.IMAGE_URL +
                          "suppliers/" +
                          item.productDetails.productImageThumbnail[i].imgName,
                      });
                    }
                    item.productDetails.productImageThumbnail =
                      productImageThumbnail;
                  }
                })
              );

              let resData = {
                wishlistList: wishlistItems,
                totalResult: totalResult,
                limit: limit,
              };
              return Helper.response(
                res,
                200,
                "Wishlist details fetched successfully.",
                resData
              );
            } else {
              return Helper.response(res, 200, "Wishlist is empty!", {
                wishlistList: [],
              });
            }
          } else {
            Helper.response(res, 200, "Wishlist is empty!", {
              wishlistList: [],
            });
          }
        }
      }
    );
  },
};
