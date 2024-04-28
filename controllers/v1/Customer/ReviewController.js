const ReviewModel = require("../../../models/ReviewModel");
const ProductModel = require("../../../models/ProductModel");
const adminModel = require("../../../models/AdminModel");
const Helper = require("../../../config/helper");
module.exports = {
  addReview: async (req, res) => {
    try {
      let reviewObj = {
        customerId: req.user._id,
        title: req.body.title,
        description: req.body.description,
        productId: req.body.productId,
        rating: req.body.rating,
        images: req.body.images,
        orderId: req.body.orderId,
      };
      let customerName = req.user.name;
      var checkProduct = await ProductModel.findOne(
        {
          _id: req.body.productId,
          productStatus: "Active",
        },
        {
          productName: 1,
          supplierId: 1,
          productUniqueId: 1,
        }
      );
      const review = new ReviewModel(reviewObj);
      const savedReview = await review.save();
      await Helper.sendNotification(
        req.user._id,
        "customer",
        req.body.productId,
        `Thank you for the review.`,
        `give review`,
        `Feedback and Reviews`,
        checkProduct.supplierId
      );
      await Helper.sendNotification(
        checkProduct.supplierId,
        "supplier",
        req.body.productId,
        `Review received on the product name ${checkProduct.productName}`,
        `recieved review`,
        `Feedback and Reviews`,
        req.user._id
      );
      let adminData = await adminModel.findOne(
        {
          role: "superadmin",
          status: "Active",
        },
        {
          firstName: 1,
          email: 1,
        }
      );
      if (adminData) {
        var html = `<!DOCTYPE html>
                    <html lang="en">
                    <head>
                        <meta charset="UTF-8">
                        <meta name="viewport" content="width=device-width, initial-scale=1.0">
                        <title>New Review Notification</title>
                        <style>
                            body {
                                font-family: Arial, sans-serif;
                                margin: 20px;
                            }

                            h2 {
                                color: #333;
                            }

                            p {
                                margin-bottom: 10px;
                            }
                        </style>
                    </head>
                    <body>
                        <h2>Dear ${adminData.firstName},</h2>

                        <p>This is an automated notification to inform you that a new review and rating have been added to a product on our platform.</p>

                        <h3>Review Details:</h3>
                        <ul>
                            <li><strong>Product Name:</strong> ${checkProduct.productName}</li>
                            <li><strong>Product ID:</strong> ${checkProduct.productUniqueId}</li>
                            <li><strong>Reviewer Name:</strong> ${customerName}</li>
                            <li><strong>Rating:</strong> ${req.body.rating}</li>
                            <li><strong>Review Title:</strong> ${req.body.title}</li>
                            <li><strong>Review Content:</strong> ${req.body.description}</li>
                        </ul>

                        <p>To view and manage this review, please log in to the admin portal and navigate to the product management section.</p>

                        <p>Thank you for your attention.</p>
                    </body>
                    </html>
                    `;

        await Helper.send365Email(
          process.env.MAIL_SEND_EMAIL,
          adminData.email,
          "New Product Review Notification",
          html,
          "text"
        );
      }

      if (savedReview) {
        return Helper.response(res, "200", "Review saved successfully");
      }
    } catch (error) {
      console.log(error);
      return Helper.response(res, 500, "Something went wrong.");
    }
  },
  updateReview: async (req, res) => {
    try {
      const { reviewId } = req.params;
      let reviewObj = {
        customerId: req.user._id,
        title: req.body.title,
        description: req.body.description,
        productId: req.body.productId,
        rating: req.body.rating,
        images: req.body.images,
        orderId: req.body.orderId,
        updateAt: new Date(),
      };
      // Update the review
      const updatedReview = await ReviewModel.findByIdAndUpdate(
        reviewId,
        reviewObj,
        {
          new: true,
        }
      );

      return Helper.response(res, "200", "Review updated successfully");
    } catch (error) {
      console.log(error);
      return Helper.response(res, "500", "Internal server error");
    }
  },
  getReview: async (req, res) => {
    try {
      let { customerId, productId } = req.query;
      var reviewList = await ReviewModel.find({
        customerId,
        productId,
      })
        .lean()
        .sort({
          createdAt: 1,
        })
        .populate("productId", "productName productDescription")
        .populate("customerId", "customerUniqId name emailId");
      await Promise.all(
        reviewList.map(async function (item) {
          if (item.images.length > 0) {
            let imagesArr = [];
            for (let i = 0; i < item.images.length; i++) {
              imagesArr.push({
                imgName: item.images[i].imgName,
                imgUrl:
                  process.env.IMAGE_URL + "customers/" + item.images[i].imgName,
              });
            }
            item.images = imagesArr;
          }
        })
      );

      return Helper.response(res, "200", "review of product", {
        data: reviewList[0],
      });
    } catch (error) {
      console.log(error);
      return Helper.response(res, 500, "Something went wrong.");
    }
  },
  getAllReviews: async (req, res) => {
    try {
      let { productId } = req.query;
      var reviewList = await ReviewModel.find({
        productId,
      })
        .lean()
        .sort({
          createdAt: 1,
        })
        .populate("productId", "productName productDescription")
        .populate("customerId", "customerUniqId name emailId");
      await Promise.all(
        reviewList.map(async function (item) {
          if (item.images.length > 0) {
            let imagesArr = [];
            for (let i = 0; i < item.images.length; i++) {
              imagesArr.push({
                imgName: item.images[i].imgName,
                imgUrl:
                  process.env.IMAGE_URL + "customers/" + item.images[i].imgName,
              });
            }
            item.images = imagesArr;
          }
        })
      );

      return Helper.response(res, "200", "review of product", {
        data: reviewList,
      });
    } catch (error) {
      console.log(error);
      return Helper.response(res, 500, "Something went wrong.");
    }
  },
};
