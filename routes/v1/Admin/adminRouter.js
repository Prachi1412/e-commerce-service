const express = require("express");
const app = express();
const adminControllerV1 = require("../../../controllers/v1/Admin/adminController");
const validator = require("../../../validators/Admin/auth");
const authMiddleware = require("../../../middlewares/supplierAuth");
const orderController = require("../../../controllers/v1/Admin/orderController");
const bannerController = require("../../../controllers/v1/Admin/BannerController");
const contentController = require("../../../controllers/v1/Admin/ContentController");
const customerListingControllerV1 = require("../../../controllers/v1/Admin/CustomerController");
const supplierListingControllerV1 = require("../../../controllers/v1/Admin/SupplierController");
const categoryControllerV1 = require("../../../controllers/v1/Admin/ProductCategoryController");
const subCategoryControllerV1 = require("../../../controllers/v1/Admin/ProductSubCategoryController");
const productController = require("../../../controllers/v1/Admin/ProductController");
const productClassificationControllerV1 = require("../../../controllers/v1/Admin/ProductClassificationController");
const serviceController = require("../../../controllers/v1/Admin/ServiceController");
const queryController = require("../../../controllers/v1/Admin/QueryController");
const faqsController = require("../../../controllers/v1/Admin/FaqsController");

const validatorErrors = require("../../../utilities/validatorerrors");
const adminMiddleware = require("../../../middlewares/adminAuth");
const ExportFilesController = require("../../../controllers/v1/Admin/ExportFilesController");
const ReviewController = require("../../../controllers/v1/Admin/ReviewController");
const administratorController = require("../../../controllers/v1/Admin/administratorController");
const validationSchema = require("../../../config/validationSchemas");
const validatorMiddleware = require("../../../middlewares/validator");

app
  .route("/login")
  .post(
    validator.login,
    validatorErrors.validationErrorChecker,
    adminControllerV1.login
  );
app
  .route("/change-password")
  .put(authMiddleware.verifyTokenAdmin, adminControllerV1.changePassword);
app.route("/forgot-password").post(adminControllerV1.forgotPassword);
app.route("/reset-password").post(adminControllerV1.resetPassword);
app.route("/otp-verify").post(adminControllerV1.otpVerify);
app.route("/logout").get(
  // validator.login,
  // validatorErrors.validationErrorChecker,
  authMiddleware.verifyTokenAdmin,
  adminControllerV1.logout
);

/* -----------------------------------------------------Customer Controller------------------------------------------------- */

app
  .route("/customer/:id")
  .get(
    authMiddleware.verifyTokenAdmin,
    customerListingControllerV1.customerDetails
  )
  .delete(
    authMiddleware.verifyTokenAdmin,
    customerListingControllerV1.customerStatusDelete
  );

app
  .route("/customer-order/:_id")
  .get(
    authMiddleware.verifyTokenAdmin,
    customerListingControllerV1.orderDetails
  );
// app
//   .route("/orderListingCustomer/:_id")
//   .get(
//     authMiddleware.verifyTokenAdmin,
//     customerListingControllerV1.cutomerOrder
//   );
/* ----------------------------------------------------- Supplier Controller ------------------------------------------------- */

app
  .route("/supplier/:id")
  .get(
    authMiddleware.verifyTokenAdmin,
    supplierListingControllerV1.supplierDetails
  )
  .delete(
    authMiddleware.verifyTokenAdmin,
    supplierListingControllerV1.supplierStatusDelete
  );

/* ----------------------------------------------------- Product Controller ------------------------------------------------- */

app
  .route("/product/:productId")
  .get(authMiddleware.verifyTokenAdmin, productController.productDetails)
  .put(authMiddleware.verifyTokenAdmin, productController.ChangeProductStatus);
app
  .route("/delete-product-image/:productId")
  .put(authMiddleware.verifyTokenAdmin, productController.deleteProductImg);
/* ----------------------------------------------------- Product-Category Controller ------------------------------------------------- */

app
  .route("/product-category/:id")
  .get(
    authMiddleware.verifyTokenAdmin,
    categoryControllerV1.productCategoryDetails
  );

/* ----------------------------------------------------- Product-Sub-Category Controller ------------------------------------------------- */

app
  .route("/product-sub-category/:id")
  .get(
    authMiddleware.verifyTokenAdmin,
    subCategoryControllerV1.productSubCategoryDetails
  );

/* -----------------------------------------------------Order Controller------------------------------------------------- */
app.route("/order").get(authMiddleware.verifyTokenAdmin, orderController.list);
app
  .route("/orderDetails")
  .get(authMiddleware.verifyTokenAdmin, orderController.orderDetails);

app.route("/cancel-order/:orderId").delete(orderController.cancelOrder);
app
  .route("/change-status/:orderId")
  .put(authMiddleware.verifyTokenAdmin, orderController.changeOrderStatus);
app
  .route("/read-order/:orderId")
  .get(authMiddleware.verifyTokenAdmin, orderController.orderRead);
app
  .route("/read-order-detail/:orderId")
  .get(authMiddleware.verifyTokenAdmin, orderController.orderDetailsRead);
app
  .route("/accept-installation")
  .post(
    authMiddleware.verifyTokenAdmin,
    orderController.acceptInstallationRequest
  );
app
  .route("/complete-installation")
  .post(
    authMiddleware.verifyTokenAdmin,
    orderController.completedInstallationRequest
  );

app
  .route("/order-amount/:orderId")
  .put(authMiddleware.verifyTokenAdmin, orderController.orderAmount);

//---------------------------------------Banner management------------------------------------------------------
app
  .route("/banner")
  .post(authMiddleware.verifyTokenAdmin, bannerController.addBanner);
app
  .route("/banner/:id")
  .put(authMiddleware.verifyTokenAdmin, bannerController.updateBanner);
app
  .route("/banner/:id")
  .delete(authMiddleware.verifyTokenAdmin, bannerController.deleteBanner);
app
  .route("/banners")
  .get(authMiddleware.verifyTokenAdmin, bannerController.listBanner);
// app.route('/login').post()
/* -----------------------------------------------------Administrators-Management-Static------------------------------------------------- */
app
  .route("/content")
  .get(authMiddleware.verifyTokenAdmin, contentController.contentList);
app
  .route("/content")
  .put(authMiddleware.verifyTokenAdmin, contentController.editContent);
app
  .route("/terms-conditions")
  .get(authMiddleware.verifyTokenAdmin, contentController.termsConditions);
app
  .route("/privacy-policy")
  .get(authMiddleware.verifyTokenAdmin, contentController.privacyPolicy);
app
  .route("/about-us")
  .get(authMiddleware.verifyTokenAdmin, contentController.aboutUs);
app
  .route("/video")
  .post(authMiddleware.verifyTokenAdmin, contentController.videoUpload);
app.route("/video").get(contentController.videoList);
app.route("/video/:id").put(contentController.videoDelete);
app
  .route("/customers")
  .get(
    adminMiddleware.verifyToken,
    customerListingControllerV1.getCustomerListing
  );
app
  .route("/customer-list")
  .get(adminMiddleware.verifyToken, customerListingControllerV1.getCustomer);
app
  .route("/customer")
  .put(customerListingControllerV1.customerAccountStatusUpdate);
app
  .route("/suppliers")
  .get(
    adminMiddleware.verifyToken,
    supplierListingControllerV1.getSupplierListing
  );
app.route("/preview-edit-request/:_id").get(
  supplierListingControllerV1.previewSupplierEditRequest // admin preview supplier's edit request
);
app.route("/accept-edit-request/:_id").put(
  supplierListingControllerV1.acceptSupplierEditRequest // admin accepted supplier's edit request
);
app.route("/reject-edit-request/:_id").put(
  supplierListingControllerV1.rejecteSupplierEditRequest // admin rejected supplier's edit request
);
app
  .route("/suppliers/:_id")
  .put(supplierListingControllerV1.supplierAccountStatusUpdate);

/* -----------------------------------------------------Product Controller------------------------------------------------- */

app
  .route("/products")
  .get(adminMiddleware.verifyToken, productController.listProducts);

app
  .route("/category")
  .post(adminMiddleware.verifyToken, categoryControllerV1.categoryAdd);
app
  .route("/sub-category")
  .post(adminMiddleware.verifyToken, subCategoryControllerV1.addSubCategory);
app
  .route("/sub-category/:id")
  .get(subCategoryControllerV1.listSubProductCategories);
app
  .route("/sub-category/:id")
  .put(subCategoryControllerV1.updateSubCategoryDetails);
app
  .route("/classification")
  .post(
    adminMiddleware.verifyToken,
    productClassificationControllerV1.addProductClassification
  );
app
  .route("/classification/:_id")
  .put(productClassificationControllerV1.updateProductClassification);
app
  .route("/product-classifications")
  .get(productClassificationControllerV1.listProductClassification);
app
  .route("/category/:id")
  .get(
    authMiddleware.verifyTokenAdmin,
    categoryControllerV1.getCategoryDetails
  );
app.route("/category").get(categoryControllerV1.listProductCategories);
app.route("/category/:id").put(categoryControllerV1.updateCategoryDetails);
app
  .route("/category-status/:categoryId")
  .put(categoryControllerV1.ChangeProductCategoryStatus);
app.route("/services").get(serviceController.serviceListing);
app.route("/services/:serviceId").put(serviceController.ChangeServiceStatus);
app.route("/read-service/:serviceId").get(serviceController.serviceRead);
app
  .route("/delete-service-image/:serviceId")
  .put(authMiddleware.verifyTokenAdmin, serviceController.deleteServiceImg);
app.route("/upload-product").post(productController.uploadPic);

/* -----------------------------------------------------Administrators-Management-FAQS------------------------------------------------- */
app
  .route("/faqs")
  .post(authMiddleware.verifyTokenAdmin, faqsController.addUpdateFaq);
app
  .route("/faqs-reorder")
  .put(authMiddleware.verifyTokenAdmin, faqsController.reorderFaqs);
app
  .route("/update-faq-question")
  .put(authMiddleware.verifyTokenAdmin, faqsController.updateQuestionAnsFAQ);
app
  .route("/delete-faq-question")
  .delete(authMiddleware.verifyTokenAdmin, faqsController.deleteQuestionFAQ);
app
  .route("/faqs/:id")
  .delete(authMiddleware.verifyTokenAdmin, faqsController.deleteFaqs);
app
  .route("/faqs")
  .get(authMiddleware.verifyTokenAdmin, faqsController.getAllFaq);

/* -----------------------------------------------------Administrators-Management-ACHIVEMENTS------------------------------------------------- */
app
  .route("/achievements")
  .post(
    authMiddleware.verifyTokenAdmin,
    contentController.addUpdateAchievement
  );
app
  .route("/achievements/:id")
  .delete(authMiddleware.verifyTokenAdmin, contentController.deleteAchievement);
app
  .route("/achievements")
  .get(authMiddleware.verifyTokenAdmin, contentController.getAllAchievement);
//---------------------------------------Export Files -----------------------------------------------------
app
  .route("/downloadCustomerExcelsheet")
  .get(ExportFilesController.CustomerExcelsheet);
app
  .route("/downloadSupplierExcelsheet")
  .get(ExportFilesController.SupplierExcelsheet);
app
  .route("/downloadProductExcelsheet")
  .get(ExportFilesController.ProductExcelsheet);
app
  .route("/downloadProductCategoryWiseExcelsheet")
  .get(ExportFilesController.ProductCategoryWiseExcelsheet);
app
  .route("/downloadProductSellerProfileExcelsheet")
  .get(ExportFilesController.SellerAndProductListExcelsheet);
app
  .route("/downloadOrderExcelsheet")
  .get(ExportFilesController.OrderExcelsheet);
app
  .route("/downloadQueryResolutionExcelSheet")
  .get(ExportFilesController.QueryResolution);
app
  .route("/downloadRevenueReportExcelSheet")
  .get(ExportFilesController.RevenueReport);
app
  .route("/downloadInstallationPendingExcelSheet")
  .get(ExportFilesController.InstallationPending);
app
  .route("/downloadOrderReturnExcelSheet")
  .get(ExportFilesController.OrderReturnRequest);
app
  .route("/downloadProductReviewExcelSheet")
  .get(ExportFilesController.ProductReview);
app
  .route("/downloadProductAccessoriesExcelSheet")
  .get(ExportFilesController.ProductAccessories);
app
  .route("/downloadServiceExcelsheet")
  .get(ExportFilesController.ServiceExcelsheet);
//----------------------------------------Query Management-------------
app
  .route("/query-list")
  .get(authMiddleware.verifyTokenAdmin, queryController.listQuery);
app
  .route("/read-buyer-query/:queryId")
  .get(authMiddleware.verifyTokenAdmin, queryController.queryBuyerRead);
app.route("/query-response").post(queryController.responseQuery);
app
  .route("/support-list")
  .get(authMiddleware.verifyTokenAdmin, queryController.listSupport);
app
  .route("/read-support/:supportId")
  .get(authMiddleware.verifyTokenAdmin, queryController.supportRead);
app
  .route("/change-support-status/:supportId")
  .put(queryController.changeSupportStatusByAdmin);
//----------------------review action-------------
app
  .route("/reviews")
  .get(authMiddleware.verifyTokenAdmin, ReviewController.getReview);
app
  .route("/review/:_id")
  .delete(authMiddleware.verifyTokenAdmin, ReviewController.deleteReview);
app
  .route("/read-review/:reviewId")
  .get(authMiddleware.verifyTokenAdmin, ReviewController.reviewRead);
app
  .route("/category-reorder")
  .put(authMiddleware.verifyTokenAdmin, categoryControllerV1.reorderCategory);
app
  .route("/sub-category-reorder")
  .put(
    authMiddleware.verifyTokenAdmin,
    subCategoryControllerV1.reorderSubCategory
  );

app.route("/getSupplier").get(supplierListingControllerV1.getSupplier);
app
  .route("/read-seller/:sellerId")
  .get(authMiddleware.verifyTokenAdmin, supplierListingControllerV1.sellerRead);
app
  .route("/initiate-chat")
  .post(authMiddleware.verifyTokenAdmin, queryController.chatInitiateByAdmin); // admin initiate the chat
app
  .route("/initiate-chat")
  .get(
    authMiddleware.verifyTokenAdmin,
    queryController.chatInitiateByAdminList
  );
app
  .route("/read-seller-query/:queryId")
  .get(authMiddleware.verifyTokenAdmin, queryController.querySellerRead);
//count all unread data
app
  .route("/count-unread-list")
  .get(authMiddleware.verifyTokenAdmin, adminControllerV1.allUnreadCount);
/* -----------------------------------------------------Product Controller------------------------------------------------- */
app
  .route("/admin")
  .post(
    authMiddleware.verifyTokenAdmin,
    validatorMiddleware(validationSchema.admin, "body"),
    administratorController.addUpdate
  );
// router.put("/admin/:id", authMiddleware.verifyTokenAdmin,validatorMiddleware(validationSchema.admin, 'body'), adminController.update);
app
  .route("/admin")
  .get(authMiddleware.verifyTokenAdmin, administratorController.list);
app
  .route("/admin-status/:id")
  .put(
    authMiddleware.verifyTokenAdmin,
    validatorMiddleware(validationSchema.adminStatus, "body"),
    administratorController.updateStatus
  );
module.exports = app;
