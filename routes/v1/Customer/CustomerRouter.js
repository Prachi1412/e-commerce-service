const express = require("express");
const app = express();
const customerController = require("../../../controllers/v1/Customer/CustomerController");
const validator = require("../../../validators/Customer/auth");
const validatorErrors = require("../../../utilities/validatorerrors");
const customerMiddlewares = require("../../../middlewares/customerAuth");
const orderController = require("../../../controllers/v1/Customer/OrderController");
const productController = require("../../../controllers/v1/Customer/ProductController");
const contentController = require("../../../controllers/v1/Admin/ContentController");
const homePageController = require("../../../controllers/v1/Customer/HomePageController");
const QueryController = require("../../../controllers/v1/Customer/QueryController");
const AdminQueryController = require("../../../controllers/v1/Admin/QueryController");
const subCategoryControllerV1 = require("../../../controllers/v1/Admin/ProductSubCategoryController");
const AddressController = require("../../../controllers/v1/Customer/AddressController");
const WishlistController = require("../../../controllers/v1/Customer/WishlistController");
const ReviewController = require("../../../controllers/v1/Customer/ReviewController");
const authController = require("../../../controllers/v1/Supplier/AuthController");
const notificationController = require("../../../controllers/v1/Customer/notificationController");
const commonController = require("../../../controllers/v1/Customer/CommonController");
const paymentController = require("../../../controllers/v1/Customer/PaymentController");
const validatorMiddleware = require("../../../middlewares/validator");
const validationSchema = require("../../../config/validationSchemas");
const multer = require("multer");
const upload = multer();
const fs = require("fs");
const path = require("path");
app
    .route("/register")
    .post(
        validator.register,
        validatorErrors.validationErrorChecker,
        customerController.register
    );
app
    .route("/login")
    .post(
        validator.login,
        validatorErrors.validationErrorChecker,
        customerController.login
    );
app
    .route("/logout")
    .post(customerMiddlewares.verifyToken, customerController.logout);

app.route("/forgot-password").post(
    // validator.register,
    // validatorErrors.validationErrorChecker,
    customerController.forgotPassword
);
app.route("/otp-verify").post(
    // validator.register,
    // validatorErrors.validationErrorChecker,
    customerController.otpVerify
);
app.route("/reset-password").post(
    // validator.register,
    // validatorErrors.validationErrorChecker,
    customerController.resetPassword
);

app
    .route("/profile")
    .get(customerMiddlewares.verifyToken, customerController.viewProfile);
app.route("/profile/:_id").put(customerController.updateProfile);

app
    .route("/change-password")
    .put(customerMiddlewares.verifyToken, customerController.changePassword);
app
    .route("/addCart")
    .post(customerMiddlewares.verifyToken, productController.addCart);
app
    .route("/cart/:id")
    .delete(customerMiddlewares.verifyToken, productController.deleteCart);
app
    .route("/getCartDetails")
    .get(customerMiddlewares.verifyToken, productController.getCartDetails);
app
    .route("/product/:productId")
    .get(customerMiddlewares.verifyToken, productController.singleProduct);
app
    .route("/add-recent-view")
    .post(customerMiddlewares.verifyToken, productController.addRecentlyView);
app
    .route("/recent-viewed-product")
    .get(customerMiddlewares.verifyToken, productController.getRecentViewProduct);
app
    .route("/recent-viewed-service")
    .get(customerMiddlewares.verifyToken, productController.getRecentViewService);
app.route("/recent-added-product").get(productController.getRecentAddedProduct);
app
    .route("/order")
    .post(customerMiddlewares.verifyToken, orderController.order);
app
    .route("/orderDetails")
    .get(customerMiddlewares.verifyToken, orderController.orderDetails);
app
    .route("/cancelOrder/:orderId")
    .delete(customerMiddlewares.verifyToken, orderController.cancelOrder);

app
    .route("/getResult")
    .get(customerMiddlewares.verifyToken, orderController.getResult);
app
    .route("/getCompanyDetails")
    .get(customerMiddlewares.verifyToken, orderController.getCompanyDetails);
app
    .route("/getPaymentStatus")
    .get(customerMiddlewares.verifyToken, orderController.getPaymentStatus);
app
    .route("/return-order")
    .post(customerMiddlewares.verifyToken, orderController.returnOrder);
app.route("/content").get(contentController.contentList);
// app.route('/login').post()
app.route("/upload-customer").post(customerController.uploadPic);
app.route("/categories").get(homePageController.categories);
app.route("/category-products").get(homePageController.categorieWiseProduct);
app.route("/category-services").get(homePageController.categorieWiseService);
app.route("/view-product-by-category").get(homePageController.viewProduct);
app.route("/view-service-by-category").get(homePageController.viewService);
app.route("/banner-list").get(homePageController.bannerListing);
app.route("/faqs-list").get(homePageController.getAllFaq);
app.route("/achievement-list").get(homePageController.getAllAchievement);
app.route("/count-list/:customerId").get(homePageController.getAllCounts);
app
    .route("/query")
    .post(customerMiddlewares.verifyToken, QueryController.addQuery)
    .get(customerMiddlewares.verifyToken, QueryController.listQuery);
app
    .route("/query/:id")
    .put(customerMiddlewares.verifyToken, QueryController.updateQuery);
app
  .route("/query-status/:id")
  .put(customerMiddlewares.verifyToken,QueryController.changeQueryStatus);
app
    .route("/query-request")
    .post(customerMiddlewares.verifyToken, QueryController.requestQuery);
app.route("/query/:queryId").get(QueryController.viewQuery);
app.route("/video-list").get(contentController.videoList); // common

app
    .route("/address")
    .post(customerMiddlewares.verifyToken, AddressController.addAddress)
    .get(customerMiddlewares.verifyToken, AddressController.getAddress);
app
    .route("/address/:addressId")
    .put(customerMiddlewares.verifyToken, AddressController.updateAddress)
    .delete(customerMiddlewares.verifyToken, AddressController.deleteAddress);
app
    .route("/default-address/:addressId")
    .put(customerMiddlewares.verifyToken, AddressController.setDefaultAddress);

app
    .route("/sub-category-list/:id")
    .get(subCategoryControllerV1.listSubProductCategories);

app.route("/order").get(customerMiddlewares.verifyToken, orderController.list);

app
    .route("/order/:orderId")
    .get(customerMiddlewares.verifyToken, orderController.orderDetailById); // common
app.route("/support").post(homePageController.addSupport);
app.route("/search").get(homePageController.searchSuggestion);
app
    .route("/wishlist")
    .post(
        customerMiddlewares.verifyToken,
        WishlistController.addRemoveFromWishList
    );
app
    .route("/wishlist")
    .get(customerMiddlewares.verifyToken, WishlistController.getWishlist);

app
    .route("/add-review")
    .post(customerMiddlewares.verifyToken, ReviewController.addReview);
app
    .route("/update-review/:reviewId")
    .put(customerMiddlewares.verifyToken, ReviewController.updateReview);
app
    .route("/review-list")
    .get(customerMiddlewares.verifyToken, ReviewController.getReview);
//common
app.route("/states").get(authController.states);
app.route("/cities-by-state").get(authController.citiesBystates);
app
    .route("/change-support-status/:supportId")
    .post(QueryController.ChangeSupportStatus);
app
    .route("/rating-review-list/:productId")
    .get(QueryController.ChangeSupportStatus);
app.route("/all-review-list").get(ReviewController.getAllReviews);

app.route("/send-notification").post(notificationController.sendNotification);
app.route("/subscribe").post(notificationController.subscribeData);
app.route("/verifyEmail/:token").get(customerController.emailVerify);

app
    .route("/notification/list")
    .get(customerMiddlewares.verifyToken, notificationController.list);
app
    .route("/notification/delete/:id")
    .delete(customerMiddlewares.verifyToken, notificationController.delete);
app
    .route("/notification/read/:id")
    .put(customerMiddlewares.verifyToken, notificationController.read);
app
    .route("/notification/readAll")
    .put(customerMiddlewares.verifyToken, notificationController.readAll);

app
    .route("/update-email")
    .put(customerMiddlewares.verifyToken, customerController.updateEmail);

//--------------------------------payment routes-----------------------------------
app.route("/initiate-payment").post(customerMiddlewares.verifyToken, upload.none(), paymentController.ccavRequestHandler);
app.route("/responseHandler").post(paymentController.responseHandler);
app.route("/cancelOrderPayment").post(paymentController.cancelOrderPayment);

//--------------------------------shiprocket webhook service-----------------------------------
app.route("/webhookService").post(paymentController.shiprocket);

//common
app
    .route("/seller-status-change/:id")
    .put(AdminQueryController.changeQueryStatusSeller);

app
    .route("/buyer-status-change/:id")
    .put(AdminQueryController.changeQueryStatusBuyer);
app.route("/institution").get(commonController.getInstitutionList);
app.route("/profession").get(commonController.getProfessionList);
//common
app
    .route("/query-request-seller")
    .post(customerMiddlewares.verifyToken, AdminQueryController.requestChatByAdmin);
//query for read
app
    .route("/read/query/:id")
    .put(customerMiddlewares.verifyToken, QueryController.readQuery);
//commmon
app
    .route("/read-all/query")
    .put(customerMiddlewares.verifyToken, QueryController.readAllQuery);
app
    .route("/get-invoice/:orderId")
    .get(customerMiddlewares.verifyToken, orderController.getOrderInvoice);

//product order installation
app
    .route("/installation-order-request")
    .post(customerMiddlewares.verifyToken, orderController.installationOfOrder);
// shipping charges
app
    .route("/serviceability")
    .post(
        customerMiddlewares.verifyToken,
        //   validatorMiddleware(validationSchema.serviceabilityShipCharge, "body"),
        orderController.getServiceability
    );
app
    .route("/checkAvailability")
    .get(customerMiddlewares.verifyToken,
        orderController.checkAvailability
    );

app
  .route("/orderTrackByAwb")
  .post(customerMiddlewares.verifyToken, orderController.orderTrackByAwb);
//-------------------------- monitor logs --------------------------
app.route("/logs/:date?").get(function(req, res) {
    // Today's  Date of Server based on location of server
    let date = new Date();
    // Convert to IST date
    let intlDateObj = new Intl.DateTimeFormat("en-US", {
        timeZone: "Asia/Kolkata",
    });
    let istTime = intlDateObj.format(date);
    // Eg. output : Fri Jul 23 2021 23:41:50 GMT-0800 (Alaska Daylight Time)
    // now try to format the converted date
    const newDate = new Date(istTime);
    let year = newDate.getFullYear();
    let month = newDate.getMonth() + 1;
    let day = newDate.getDate();
    if (month.toString().length < 2) month = "0" + month;
    if (day.toString().length < 2) day = "0" + day;
    const today = year + "-" + month + "-" + day;
    let filePath = path.join(process.cwd(), `logs/app-${today}.log`);
    if (req.params.date !== undefined) {
        filePath = path.join(process.cwd(), `logs/app-${req.params.date}.log`);
    }
    if (fs.existsSync(filePath)) {
        // handle if requested for downalod log.
        const { d } = req.query;
        if (d !== undefined && d === "true") {
            const data = fs.readFileSync(filePath);
            return res.send(data);
        }
        res.sendFile(filePath, function(err) {
            if (err) {
                res.send("Invalid log file. Or No logs found.");
            }
        });
    } else {
        return res.send("No logs found.");
    }
});
module.exports = app;