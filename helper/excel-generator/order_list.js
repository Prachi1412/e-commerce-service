const excel = require("node-excel-export");
var near_by_member_export = {};
// Download excel sheet
near_by_member_export.makeExcelSheetWithData = async (
  data,
  leaveBalanceArrayFormat
) => {
  return new Promise((resolve, reject) => {
    try {
      const styles = {
        headerDark: {
          fill: {
            fgColor: {
              rgb: "FBAF02",
            },
          },
          font: {
            color: {
              rgb: "ffffff",
            },
            sz: 15,
            bold: true,
            underline: false,
          },
          alignment: {
            vertical: "center",
            horizontal: "center",
          },
          border: {
            diagonalDown: false,
          },
        },
        mainheaderDark: {
          fill: {
            fgColor: {
              rgb: "FBAF02",
            },
          },
          font: {
            color: {
              rgb: "ffffff",
            },
            sz: 13,
            bold: true,
            underline: true,
          },
          alignment: {
            vertical: "center",
            horizontal: "center",
          },
          border: {
            diagonalDown: true,
          },
        },
        cellHeaderTheme: {
          fill: {
            fgColor: {
              rgb: "3899EC",
            },
          },
          font: {
            color: {
              rgb: "ffffff",
            },
            sz: 12,
            bold: true,
            underline: false,
          },
        },
        cellCenter: {
          alignment: {
            vertical: "center",
            horizontal: "center",
          },
        },
      };
      const heading = [
        [{ value: " Order list", style: styles.headerDark }],
        [],
        // [{value: 'Members Nearby Report', style: styles.mainheaderDark}],
      ];
      //Here you specify the export structure
      const specification = {
        createdAt: {
          displayName: "Order Date",
          headerStyle: styles.cellHeaderTheme,
          cellStyle: styles.cellCenter, // <- Cell style
          cellFormat: function (value, row) {
            // <- Renderer function, you can access also any row.property
            if (value !== "undefined" && value !== "") return new Date(value);
            else return "--";
          },
          width: 250, // <- width in pixels
        },
        orderId: {
          // <- the key should match the actual data key
          displayName: "Order id", // <- Here you specify the column header
          headerStyle: styles.cellHeaderTheme, // <- Header style
          cellStyle: styles.cellCenter, // <- Cell style
          width: 100, // <- width in pixels
        },
        customerId: {
          displayName: "Buyer Id",
          headerStyle: styles.cellHeaderTheme,
          cellStyle: styles.cellCenter, // <- Cell style
          //    cellStyle: styles.cellPink, // <- Cell style
          cellFormat: function (value, row) {
            // <- Renderer function, you can access also any row.property
            if (typeof value !== "undefined" && value !== "") return value;
            else return "--";
          },
          width: 250, // <- width in pixels
        },
        customerName: {
          displayName: "Buyer Name",
          headerStyle: styles.cellHeaderTheme,
          cellStyle: styles.cellCenter, // <- Cell style
          //    cellStyle: styles.cellPink, // <- Cell style
          cellFormat: function (value, row) {
            // <- Renderer function, you can access also any row.property
            if (typeof value !== "undefined" && value !== "") return value;
            else return "--";
          },
          width: 250, // <- width in pixels
        },
        customerMobile: {
          displayName: "Buyer Mobile",
          headerStyle: styles.cellHeaderTheme,
          cellStyle: styles.cellCenter, // <- Cell style
          //    cellStyle: styles.cellPink, // <- Cell style
          cellFormat: function (value, row) {
            // <- Renderer function, you can access also any row.property
            if (value !== "undefined" && value !== "") return value;
            else return "--";
          },
          width: 250, // <- width in pixels
        },
        deliveryAddress: {
          displayName: "Delivery Address",
          headerStyle: styles.cellHeaderTheme,
          cellStyle: styles.cellCenter, // <- Cell style
          //    cellStyle: styles.cellPink, // <- Cell style
          cellFormat: function (value, row) {
            // <- Renderer function, you can access also any row.property
            if (value !== "undefined" && value !== "") return value;
            else return "--";
          },
          width: 250, // <- width in pixels
        },
        // companyName: {
        //   displayName: "Company Name",
        //   headerStyle: styles.cellHeaderTheme,
        //   cellStyle: styles.cellCenter, // <- Cell style
        //   //    cellStyle: styles.cellPink, // <- Cell style
        //   cellFormat: function (value, row) {
        //     // <- Renderer function, you can access also any row.property
        //     if (value !== "undefined" && value !== "") return value;
        //     else return "--";
        //   },
        //   width: 250, // <- width in pixels
        // },
        deliveryMode: {
          displayName: "Delivery Mode",
          headerStyle: styles.cellHeaderTheme,
          cellStyle: styles.cellCenter, // <- Cell style
          //    cellStyle: styles.cellPink, // <- Cell style
          cellFormat: function (value, row) {
            // <- Renderer function, you can access also any row.property
            if (value !== "undefined" && value !== "") return value;
            else return "--";
          },
          width: 250, // <- width in pixels
        },
        totalPrice: {
          displayName: "Total Price",
          headerStyle: styles.cellHeaderTheme,
          cellStyle: styles.cellCenter, // <- Cell style
          //    cellStyle: styles.cellPink, // <- Cell style
          cellFormat: function (value, row) {
            // <- Renderer function, you can access also any row.property
            if (value !== "undefined" && value !== "") return value;
            else return "--";
          },
          width: 250, // <- width in pixels
        },
        paymentStatus: {
          displayName: "Payment Status",
          headerStyle: styles.cellHeaderTheme,
          cellStyle: styles.cellCenter, // <- Cell style
          //    cellStyle: styles.cellPink, // <- Cell style
          cellFormat: function (value, row) {
            // <- Renderer function, you can access also any row.property
            if (value !== "undefined" && value !== "")
              if (value == "requires_payment_method") {
                return "Failed";
              } else {
                return value;
              }
            else return "--";
          },
          width: 250, // <- width in pixels
        },
        paymentId: {
          displayName: "Payment Id",
          headerStyle: styles.cellHeaderTheme,
          cellStyle: styles.cellCenter, // <- Cell style
          //    cellStyle: styles.cellPink, // <- Cell style
          cellFormat: function (value, row) {
            // <- Renderer function, you can access also any row.property
            if (value !== "undefined" && value !== "") return value;
            else return "--";
          },
          width: 250, // <- width in pixels
        },
        trackingId: {
          displayName: "Tracking Id",
          headerStyle: styles.cellHeaderTheme,
          cellStyle: styles.cellCenter, // <- Cell style
          //    cellStyle: styles.cellPink, // <- Cell style
          cellFormat: function (value, row) {
            // <- Renderer function, you can access also any row.property
            if (value !== "undefined" && value !== "") return value;
            else return "--";
          },
          width: 250, // <- width in pixels
        },
        orderStatus: {
          displayName: "Order Status",
          headerStyle: styles.cellHeaderTheme,
          cellStyle: styles.cellCenter, // <- Cell style
          //    cellStyle: styles.cellPink, // <- Cell style
          cellFormat: function (value, row) {
            // <- Renderer function, you can access also any row.property
            if (value !== "undefined" && value !== "")
              return value.replace(" ", "_");
            else return "--";
          },
          width: 250, // <- width in pixels
        },

        productID: {
          displayName: "Product Id",
          headerStyle: styles.cellHeaderTheme,
          cellStyle: {
            alignment: {
              vertical: "center",
              horizontal: "center",
            },
          },
          //    cellStyle: styles.cellPink, // <- Cell style
          cellFormat: function (value, row) {
            // <- Renderer function, you can access also any row.property
            if (
              typeof value !== "undefined" &&
              value !== null &&
              value !== "null" &&
              value !== ""
            )
              return value;
            else return "--";
          },
          width: 100, // <- width in pixels
        },
        productName: {
          displayName: "Product Name",
          headerStyle: styles.cellHeaderTheme,
          //    cellStyle: styles.cellPink, // <- Cell style
          cellFormat: function (value, row) {
            // <- Renderer function, you can access also any row.property
            if (
              typeof value !== "undefined" &&
              value !== null &&
              value !== "null" &&
              value !== ""
            )
              return value;
            else return "--";
          },
          width: 200, // <- width in pixels
        },
        // productskuId: {
        //   displayName: "Product SkuId",
        //   headerStyle: styles.cellHeaderTheme,
        //   //    cellStyle: styles.cellPink, // <- Cell style
        //   cellFormat: function (value, row) {
        //     // <- Renderer function, you can access also any row.property
        //     if (
        //       typeof value !== "undefined" &&
        //       value !== null &&
        //       value !== "null" &&
        //       value !== ""
        //     )
        //       return value;
        //     else return "--";
        //   },
        //   width: 200, // <- width in pixels
        // },
        OrderQuantity: {
          displayName: "Product Quantity",
          headerStyle: styles.cellHeaderTheme,
          //    cellStyle: styles.cellPink, // <- Cell style
          cellFormat: function (value, row) {
            // <- Renderer function, you can access also any row.property
            if (
              typeof value !== "undefined" &&
              value !== null &&
              value !== "null" &&
              value !== ""
            )
              return value;
            else return "--";
          },
          width: 100, // <- width in pixels
        },
        // OrderTestResult: {
        //   displayName: "Test Result",
        //   headerStyle: styles.cellHeaderTheme,
        //   //    cellStyle: styles.cellPink, // <- Cell style
        //   cellFormat: function (value, row) {
        //     // <- Renderer function, you can access also any row.property
        //     if (
        //       typeof value !== "undefined" &&
        //       value !== null &&
        //       value !== "null" &&
        //       value !== ""
        //     )
        //       return value;
        //     else return "--";
        //   },
        //   width: 100, // <- width in pixels
        // },
        // OrderTotalPrice: {
        //   displayName: "Product Order price",
        //   headerStyle: styles.cellHeaderTheme,
        //   //    cellStyle: styles.cellPink, // <- Cell style
        //   cellFormat: function (value, row) {
        //     // <- Renderer function, you can access also any row.property
        //     if (
        //       typeof value !== "undefined" &&
        //       value !== null &&
        //       value !== "null" &&
        //       value !== ""
        //     )
        //       return value;
        //     else return "--";
        //   },
        //   width: 100, // <- width in pixels
        // },
        // productType: {
        //   displayName: "Product Type",
        //   headerStyle: styles.cellHeaderTheme,
        //   //    cellStyle: styles.cellPink, // <- Cell style
        //   cellFormat: function (value, row) {
        //     // <- Renderer function, you can access also any row.property
        //     if (
        //       typeof value !== "undefined" &&
        //       value !== null &&
        //       value !== "null" &&
        //       value !== ""
        //     )
        //       return value;
        //     else return "--";
        //   },
        //   width: 100, // <- width in pixels
        // },
      };

      // that are listed in the report specification
      const dataset = data;
      const merges = [
        { start: { row: 1, column: 1 }, end: { row: 1, column: 18 } },
        { start: { row: 2, column: 1 }, end: { row: 2, column: 18 } },
        // { start: { row: 3, column: 10 }, end: { row: 3, column: 18 } },

        // { start: { row: 4, column: 10 }, end: { row: 4, column: 18} },
        // { start: { row: 5, column: 10 }, end: { row: 5, column: 18} },
        // { start: { row: 6, column: 10 }, end: { row: 6, column: 18} }
      ]; // Create the excel report.
      // This function will return Buffer

      try {
        const report = excel.buildExport([
          // <- Notice that this is an array. Pass multiple sheets to create multi sheet report
          {
            name: "Order Report", // <- Specify sheet name (optional)
            heading: heading, // <- Raw heading array (optional)
            merges: leaveBalanceArrayFormat, // <- Merge cell ranges
            specification: specification, // <- Report specification
            data: dataset, // <-- Report data
          },
        ]);
        resolve(report);
      } catch (error) {
        reject(error);
      }
    } catch (error) {
      reject(error);
    }
  });
};

var self = (module.exports = near_by_member_export);
