const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const ObjectId = Schema.Types.ObjectId;
const mongoosePaginate = require("mongoose-paginate");

const adminSchema = new Schema({
    firstName: {
        type: String,
        required: [false, "First name is required"],
        trim: true,
        minlength: 2,
        maxlength: 15,
        default: "",
    },
    lastName: {
        type: String,
        required: [false, "Last name is required"],
        default: "",
    },
    email: {
        type: String,
        required: [true, "Email is required"],
        trim: true,
    },
    companyName: {
        type: String,
        default: "",
    },
    location: {
        type: {
            type: String,
            enum: ["Point"],
        },
        coordinates: {
            type: [Number],
            default: [0, 0],
        },
    },
    address: {
        type: String,
        default: "",
    },
    avatar: {
        type: String,
        default: "",
    },
    password: {
        type: String,
        required: [true, "Password is required"],
        trim: true,
        minlength: 3,
        maxlength: 100,
        default: "",
    },
    // address: {
    //     type: String
    // },
    // serviceCategroy: {
    //     type: ObjectId,
    //     ref: "ServiceCategory"
    // },
    countryCode: {
        type: String,
    },
    mobileNumber: {
        type: String,
    },
    license: {
        type: Array,
    },
    certificates: {
        type: Array,
    },
    companyLogo: {
        type: Object,
        default: null,
    },
    isFav: { type: Boolean, default: false },
    activeDays: {
        type: Array,
        default: [
            "Sunday",
            "Monday",
            "Tuesday",
            "Wednesday",
            "Thursday",
            "Friday",
            "Saturday",
        ],
    },
    // createdById: {
    //     type: ObjectId,
    //     ref: 'Admins'
    // },
    JWT_Token: [],
    otp: { type: String, default: "" },
    isOtpVerified: { type: Boolean, default: false },
    otpExpiredToken: {
        type: String,
        default: "",
    },
    role: {
        type: String,
        enum: {
            values: ["admin", "superadmin", "operations", "program management"],
            message: "Admin role is not valid",
        },
        trim: true,
        default: "admin",
    },
    status: {
        type: String,
        enum: ["Active", "Inactive", "Delete"],
        default: "Active",
    },
}, {
    timestamps: true,
});

adminSchema.index({
    "location.coordinates": "2dsphere",
    sparse: false,
});

// adminSchema.plugin(mongoosePaginate);
const adminModel = mongoose.model("Admin", adminSchema, "Admin");

module.exports = adminModel;