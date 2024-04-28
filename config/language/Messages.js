"use strict";
module.exports = {
    avail_lang: { en: "en" },
    required: { en: "please add the required fields" },
    serverError: { en: "Internal server error" },
    success: {
        en: "Success"
    },
    delete: {
        en: "Deleted"
    },
    isExists: {
        en: "Already exists"
    },
    notFound: {
        en: "Data not found"
    },

    auth: {
        session_expired: {
            en: "Session Time Expired, Please try again later"
        },
        account_pending: {
            en: "Your account status is pending, Please verify your account."
        },
        account_deleted: {
            en: "Your account has been blocked, please contact Admin."
        },
        account_not_found: {
            en: "Invalid credentials."
        },
    },
    device: {
        device_type: {
            en: "Please enter device type"
        },
        valid_device_type: {
            en: "Please enter valid device type"
        },
        device_token: {
            en: "Please enter device token"
        },
    },
    mobile: {
        required: {
            en: "Please enter mobile"
        },
        valid_mobile: {
            en: "Please enter valid mobile"
        },
        between: {
            en: "Mobile must be between 8 to 15 digits"
        },
        not_exists: {
            en: "Please enter the registered mobile number."
        },
        exists: {
            en: "Mobile number already exists"
        },
        update: {
            en: "Mobile number has been updated successfully"
        },
    },
    country_code: {
        en: "Please enter country code"
    },
    confirm_password: {
        required: {
            en: "Please enter confirm password"
        },
    },
    old_password: {
        password: {
            en: "Old Password is invalid."
        }
    },
    password: {
        required: {
            en: "Please enter password"
        },
        oldPasswordRequired: {
            en: "Please enter old password"
        },
        between: {
            en: "Password must be greater than or equal 6"
        },
        correct: {
            en: "Please enter correct password"
        },
        same: {
            en: "Password & confirm password must be same"
        },
        oldNewSimlar: {
            en: "New Password can not be same as Old Password."
        },
        oldPasswordNotMatched: {
            en: "Old password does not match"
        },
        success: {
            en: "Password has been updated successfully"
        },
    },

    login: {
        success: {
            en: "Login successfull"
        },
        fail: {
            en: "Invalid Credentials"
        },
        inactive: {
            en: "You are inactive use"
        },
    },
    logout: {
        success: {
            en: "Logout successfull"
        },
        fail: {
            en: "Fail to logout"
        },
    },
    api: {
        fail: {
            en: "Something went wrong"
        },
    },
    otp: {
        required: {
            en: "Please enter otp."
        },
        valid: {
            en: "Please enter valid otp"
        },
        mobile_otp: {
            en: "OTP has been sent successfully."
        },
        mobile_otp_verify: {
            en: "OTP has been verfied successfully."
        },
    },
    token: {
        valid: {
            en: "Session Expired. Please login"
        },
    },
    profile: {
        fetch: {
            en: "Profile fetched successfully"
        },
        update: {
            en: "Profile update successfully"
        },
        instant: {
            en: "Update instant booking successfully"
        },
    },
    serviceCategory: {
        add: {
            en: "Service added successfully"
        },
        update: {
            en: "Service updated successfully"
        },
        fetch: {
            en: "Service list fetch successfully"
        },
        delete: {
            en: "Service deleted successfully"
        }
    },
    serviceType: {
        add: {
            en: "Service Type added successfully"
        },
        update: {
            en: "Service Type updated successfully"
        },
        fetch: {
            en: "Service Type list fetch successfully"
        },
        delete: {
            en: "Service Type deleted successfully"
        }
    },
    customer: {
        add: {
            en: "Customer added successfully"
        },
        update: {
            en: "Customer updated successfully"
        },
        fetch: {
            en: "Customer list fetch successfully"
        },
        delete: {
            en: "Customer deleted successfully"
        }
    },
    supplier: {
        add: {
            en: "Supplier added successfully"
        },
        update: {
            en: "Supplier updated successfully"
        },
        fetch: {
            en: "Supplier list fetch successfully"
        },
        delete: {
            en: "Supplier deleted successfully"
        }
    },
    timeSlot: {
        add: {
            en: "Time Slot added successfully"
        },
        fetch: {
            en: "Time Slot list fetch successfully"
        },
    },

    supplierService: {
        add: {
            en: "Service added successfully"
        },
        update: {
            en: "Service updated successfully"
        },
        fetch: {
            en: "Service list fetch successfully"
        },
        delete: {
            en: "Service deleted successfully"
        },
        updateException: {
            en: "Update Exception time slot successfully"
        },
        updateDefault: {
            en: "Update Default time slot successfully"
        },
        isShiftExits: {
            en: "Shift name already exists"
        },
        isCategoryExits: {
            en: "Category name already exists"
        }
    },

    bank: {
        add: {
            en: "Bank added successfully"
        },
        update: {
            en: "Bank updated successfully"
        },
        fetch: {
            en: "Bank list fetch successfully"
        }
    },
    staff: {
        add: {
            en: "Staff added successfully"
        },
        update: {
            en: "Staff updated successfully"
        },
        fetch: {
            en: "Staff list fetch successfully"
        }
    },
    admin: {
        add: {
            en: "Admin added successfully"
        },
        exists: {
            en: "Email address already exists"
        },
        existsMobile: {
            en: "Mobile Number already exists"
        },
        update: {
            en: "Admin updated successfully"
        },
        updatePassword: {
            en: "Admin password updated successfully"
        },
        fetch: {
            en: "Admin list fetch successfully"
        },
        password: {
            en: "Password is required"
        },
        oldpassword: {
            en: "Old Password is required"
        },
        role: {
            en: "Role is required"
        },
        companyAddress: {
            en: "Company Address is required"
        },
        long: {
            en: "Longitude is required"
        },
        lat: {
            en: "Latitude is required"
        },
        companyName: {
            en: "Company name is required"
        },
        countryCode: {
            en: "Country code is required"
        },
        mobileNumber: {
            en: "Mobile Number is required"
        },
        license: {
            en: "License is required"
        },
        certificates: {
            en: "Certificates is required"
        },
        serviceCategroy: {
            en: "Service categroy is required"
        },
        companyLogo: {
            en: "companyLogo is required"
        }
    },
    faqs: {
        add: {
            en: "Faqs added successfully"
        },
        update: {
            en: "Faqs updated successfully"
        },
        delete: {
            en: "Faqs deleted successfully"
        },
        fetch: {
            en: "Faqs list fetch successfully"
        }
    },
    comment: {
        add: {
            en: "Comment added successfully"
        },
        update: {
            en: "Comment updated successfully"
        },
        fetch: {
            en: "Comment list fetch successfully"
        }
    },
    content: {
        add: {
            en: "Content added successfully"
        },
        update: {
            en: "Content updated successfully"
        },
        fetch: {
            en: "Content list fetch successfully"
        }
    },
    product: {
        add: {
            en: "Product added successfully"
        },
        update: {
            en: "Product updated successfully"
        },
        fetch: {
            en: "Product list fetch successfully"
        },
        delete: {
            en: "Product list fetch successfully"
        },
        isAdd: {
            en: "you don't not have permission to add the product, please contact to admin"
        },
        isUpdate: {
            en: "you don't not have permission to edit / update the product, please contact to admin"
        },
        isDelete: {
            en: "you don't not have permission to delete the product, please contact to admin"
        },
        isStatus: {
            en: "you don't not have permission to change status of the product, please contact to admin"
        },
    },

    company: {
        add: {
            en: "Company added successfully"
        },
        update: {
            en: "Company updated successfully"
        },
        fetch: {
            en: "Company list fetch successfully"
        },
        status: {
            en: "Company update successfully"
        }
    },

    promoBanner: {
        add: {
            en: "promoBanner added successfully"
        },
        update: {
            en: "promoBanner updated successfully"
        },
        fetch: {
            en: "promoBanner list fetch successfully"
        },
        status: {
            en: "promoBanner update successfully"
        }
    },

    lalamove: {
        orderId: {
            en: "Order is required"
        },
        companyId: {
            en: "Company is required"
        },
        orderNotExist: {
            en: "Order does not exists"
        },
        companyNotExist: {
            en: "Company does not exists"
        },
        customerAddress: {
            en: "Customer address is required"
        },
        customerLat: {
            en: "Customer address latitude is required"
        },
        customerLong: {
            en: "Customer address longitude is required"
        },
        quotationId: {
            en: "Quotation id is required"
        },
        sender: {
            en: "Sender(Pickup Point) details is required"
        },
        recipients: {
            en: "Recipeints(Dropoff Point) details is required"
        },
        orderSuccss: {
            en: "Order has been created successfully"
        },
        orderAlreadyCreated: {
            en: "Order already created!"
        },
        orderPendingStatus: {
            en: "Order is not pending"
        },
        orderDeliveryMode: {
            en: "Order is not delivery mode"
        },
        paymentSucceededStatus: {
            en: "Order payment status is not successful"
        },
    },
};