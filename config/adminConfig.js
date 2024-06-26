"use strict";
module.exports = {
  _isAdminPermission: {
    superadmin: {
      dashboard: true,
      customer_listing: true,
      supplier_listing: true,
      product_listing: true,
      service: true,
      userManagement: true,
      order: true,
      category: true,
      content: true,
      query: true,
      support: true,
      report: true,
      review: true,
    },
    "program management": {
      dashboard: false,
      customer_listing: false,
      supplier_listing: false,
      product_listing: true,
      service: true,
      userManagement: false,
      order: true,
      category: false,
      content: false,
      query: true,
      support: false,
      report: true,
      review: false,
    },
    operations: {
      dashboard: false,
      customer_listing: true,
      supplier_listing: false,
      product_listing: false,
      service: false,
      userManagement: false,
      order: true,
      category: false,
      content: false,
      query: true,
      support: false,
      report: false,
      review: true,
    },
  },
  _isApiPermission: {
    superadmin: {},
    "program management": {
      "/products": true,
      "/services": true,
      "/order": true,
      "/query-list": true,
      "/initiate-chat": true,
      "/report": true,
    },
    operations: {
      "/customers": true,
      "/order": true,
      "/query-list": true,
      "/report": true,
      "/initiate-chat": true
    },
  },
};
