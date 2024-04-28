const express = require("express");
const app = express();
const supplierControllerV1 = require("../../../controllers/v1/Supplier/SupplierController");
const productControllerV1 = require("../../../controllers/v1/Supplier/ProductController");
const productCatgeoriesControllerV1 = require("../../../controllers/v1/Supplier/ProductCategoryController");
const productSubCatgeoriesControllerV1 = require("../../../controllers/v1/Supplier/ProductSubCategoryController");
const productClassificationControllerV1 = require("../../../controllers/v1/Supplier/ProductClassificationController");
const serviceController = require("../../../controllers/v1/Supplier/ServiceController");
const authController = require("../../../controllers/v1/Supplier/AuthController");
const validator = require("../../../validators/Customer/auth");
const validatorErrors = require("../../../utilities/validatorerrors");
const supplierMiddleware = require("../../../middlewares/supplierAuth");
const customerMiddleware = require("../../../middlewares/customerAuth");
const requestController = require("../../../controllers/v1/Supplier/RequestController");
const QueryController = require("../../../controllers/v1/Supplier/QueryController");
const AdminQueryController = require("../../../controllers/v1/Admin/QueryController");
const orderController = require("../../../controllers/v1/Supplier/OrderController");
const notificationController = require("../../../controllers/v1/Supplier/notificationController");

app.route("/register").post(
  // validator.register,
  // validatorErrors.validationErrorChecker,
  supplierControllerV1.selfRegister
);

app.route("/profile-step-one").put(
  // validator.register,
  supplierMiddleware.verifyToken,
  supplierControllerV1.updateProfileStepOne
);

app.route("/profile-step-two").put(
  // validator.register,
  supplierMiddleware.verifyToken,
  supplierControllerV1.updateProfileStepTwo
);

app.route("/product").post(productControllerV1.addProduct);
app
  .route("/pending-request/:supplierId")
  .get(requestController.listOfPendingProductService);
app
  .route("/approved-request/:supplierId")
  .get(requestController.listOfApprovedProductService);
app
  .route("/product/:productId")
  .put(productControllerV1.updateProduct)
  .get(productControllerV1.productDetails);
app
  .route("/product-delete/:productId")
  .put(productControllerV1.ChangeProductStatus);
app
  .route("/update-quantity/:productId")
  .put(productControllerV1.updateProductQuantity);
app
  .route("/product-categories")
  .get(productCatgeoriesControllerV1.listProductCategories);

app
  .route("/product-sub-categories")
  .post(productSubCatgeoriesControllerV1.listSubProductCategories);

app
  .route("/product-classifications")
  .get(productClassificationControllerV1.listProductClassification);
app.route("/register/stepOne").post(
  // validator.register,
  // validatorErrors.validationErrorChecker,
  authController.registerStepOne
);
app.route("/register/stepOne/:_id").post(
  // validator.register,
  // validatorErrors.validationErrorChecker,
  authController.stepOneUpdate
);
app.route("/register/stepTwo/:_id").post(
  // validator.register,
  // validatorErrors.validationErrorChecker,
  authController.registerStepTwo
);
app.route("/register/stepThree/:_id").post(
  // validator.register,
  // validatorErrors.validationErrorChecker,
  authController.registerStepThree
);
app.route("/register/:_id").get(
  // validator.register,
  customerMiddleware.verifyToken,
  authController.registerList
);
app.route("/edit-request/:_id").put(
  // validator.register,
  // validatorErrors.validationErrorChecker,
  authController.supplierEditRequest // admin preview supplier's edit request
);
app.route("/supplier-status/:_id").get(
  // validator.register,
  // validatorErrors.validationErrorChecker,
  authController.supplierStatus
);
app.route("/login").post(
  // validator.register,
  // validatorErrors.validationErrorChecker,
  authController.login
);

app
  .route("/logout")
  .post(supplierMiddleware.verifyToken, authController.logout);
app.route("/forgot-password").post(
  // validator.register,
  // validatorErrors.validationErrorChecker,
  authController.forgotPassword
);

app.route("/otp-verify").post(
  // validator.register,
  // validatorErrors.validationErrorChecker,
  authController.otpVerify
);
app.route("/reset-password").post(
  // validator.register,
  // validatorErrors.validationErrorChecker,
  authController.resetPassword
);
app.route("/upload-supplier").post(authController.uplaodDocument);
app.route("/service").post(serviceController.addService);
app
  .route("/service/:id")
  .get(serviceController.getServiceDetails)
  .put(serviceController.updateServiceDetails);
app.route("/service-list/:id").get(serviceController.serviceListing); // supplier's service list only
app
  .route("/service-delete/:serviceId")
  .put(serviceController.changeServiceStatus);
app.route("/order").get(supplierMiddleware.verifyToken, orderController.list);
app
  .route("/query")
  .get(supplierMiddleware.verifyToken, QueryController.listQuery);
app.route("/query-response").post(QueryController.responseQuery);
app.route("/count-list/:supplierId").get(requestController.getAllCounts);
app
  .route("/query/:_id")
  .get(supplierMiddleware.verifyToken, QueryController.singleQuery);
app
  .route("/order-status/:orderId")
  .put(supplierMiddleware.verifyToken, orderController.changeOrderStatus);
app
  .route("/order-attachment/:orderId")
  .put(orderController.uploadOrderAttachment);
app
  .route("/send-confirmation-mail")
  .post(supplierMiddleware.verifyToken, orderController.sendConfirmationMail); // to customer
app.route("/verifyEmail/:token").get(authController.emailVerify);
app
  .route("/update-email")
  .put(supplierMiddleware.verifyToken, authController.updateEmail);
//query for read 
app
  .route("/read/query/:id")
  .put(supplierMiddleware.verifyToken, QueryController.readQuery);
  app
    .route("/read-seller-order/:orderId")
    .get(supplierMiddleware.verifyToken, orderController.orderReadSeller);
app
  .route("/complete-seller-installation")
  .post(
    supplierMiddleware.verifyToken, orderController.completedInstallationBySeller
  );
module.exports = app;
