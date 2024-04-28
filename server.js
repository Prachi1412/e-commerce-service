// Importing package to load env-variables from configuration file
const dotenv = require("dotenv");

// Pre-Setting the environment through terminal/ script from package.json file while starting server
const NODE_ENV = process.env.NODE_ENV || "development";

// Configuring the path to load env-configuration file in our project
dotenv.config({ path: ".env." + NODE_ENV });
// console.log(process.env)

// getting the env of currently running app through node-server
// NOTE : If you dont use dotenv module, you will get access to only os-level env
//        But if you use dotenv module, you will get access to os-level env as well as node-process-level env
//        Try consoling process.env values with and without using dotenv module
// console.log(process.env.NODE_ENV)

// Importing Express packages
const express = require("express");
const app = express();
const cors = require("cors");
const PORT = process.env.PORT;
app.use(cors());
// Importing pckg to pull token values from req-object
const bearerToken = require("express-bearer-token");

// Importing Mongoose packages
const mongoose = require("mongoose");

// Importing Hashing packages
const bcrypt = require("bcrypt");

// Importing Morgan packages
const morgan = require("morgan");

//
const adminModel = require("./models/AdminModel");

// getting the env of currently running app through express-server
// console.log(app.get('env'));

// app.use(express.json());

app.use(express.json({ limit: "50mb" })); // for parsing application/json
app.use(express.urlencoded({ limit: "50mb", extended: true })); // for parsing application/json
app.use(express.static(__dirname + "/public"));
app.use("/public/templates", express.static("public/templates"));
app.use(bearerToken()); // for getting values of token from req-object
app.use(morgan("dev"));
const reqStats = require("./logger/requestLogger");
app.use(reqStats());

const adminRouterV1 = require("./routes/v1/Admin/adminRouter");
const customerRouterV1 = require("./routes/v1/Customer/CustomerRouter");
const supplierRoutesV1 = require("./routes/v1/Supplier/SupplierRouter");

app.set("locale", "en");
global.LOCALE = app.get("locale");

app.use("/admin/v1", adminRouterV1);
app.use("/customer/v1", customerRouterV1);
app.use("/supplier/v1", supplierRoutesV1);
app.use("/common/v1", customerRouterV1);
//checking routes
app.get("/", (req, res) => {
  res.send("API is working fine!");
});

//setting up custom error message for routes
app.use((req, res, next) => {
  const error = new Error("This APIs does not exist");
  error.status = 404;
  next(error);
});

//Error handler function`
app.use((error, req, res, next) => {
  res.status(error.status || 500);
  res.json({
    error: {
      message: error.message,
    },
  });
});
app.all("*", function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS");
  res.header(
    "Access-Control-Allow-Headers",
    "Content-type,Accept,X-Access-Token,X-Key"
  );
  if (req.method == "OPTIONS") {
    res.status(200).end();
  } else {
    next();
  }
});
async function createAdminOnServerStartup() {
  try {
    let email = process.env.ADMIN_EMAIL_ON_SERVER_STARTUP;
    let password = process.env.ADMIN_PASSWORD_ON_SERVER_STARTUP;
    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(password, salt);

    const adminResult = await adminModel.findOne({
      email: email,
      role: "superadmin",
    });

    if (!adminResult) {
      const adminObject = {
        firstName: "Super Admin",
        lastName: "",
        email: email,
        password: hash,
        role: "superadmin",
      };

      // Create a new admin instance
      const admin = new adminModel(adminObject);

      // Save the admin instance
      const result = await admin.save();
      console.log("Admin Added");
    }
  } catch (error) {
    console.log("Internal server error", error);
  }
}

// Call the async function to create the admin
createAdminOnServerStartup();

//connecting database
mongoose.connect(process.env.DATABASE, {
  useUnifiedTopology: true,
  useNewUrlParser: true,
  // useCreateIndex: true,
});

mongoose.connection.on("connected", () => {
  console.log("database connected");
});

//(error handling ) when errors will be occur
mongoose.connection.on("error", (err) => {
  console.log("err connecting", err);
});

// listening for connections/requests on express-server
app.listen(PORT, () => {
  console.log("Server running on port : ", PORT);
});
