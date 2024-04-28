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
        [{ value: "Seller Performance", style: styles.headerDark }],
        [],
        // [{value: 'Members Nearby Report', style: styles.mainheaderDark}],
      ];
      //Here you specify the export structure
      const specification = {
        supplierUniqId: {
          displayName: "Seller Id",
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
        companyName: {
          displayName: "Seller Name",
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
        emailId: {
          displayName: "Seller Email Id",
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
        addressArr: {
          displayName: "Correspondence Address",
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
        panNoData: {
          displayName: "PAN No",
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
        gstNoData: {
          displayName: "GST No",
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
        noOfProductListed: {
          displayName: "No of Product listed",
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
        totalPriceOfProducts: {
          displayName: "Total Price of Products",
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
        Revenue: {
          displayName: "project Revenue",
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
        NoOrdersProcessed: {
          displayName: "No. Of Orders Processed",
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
        valueOfOrders: {
          displayName: "Value Of Orders",
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
        createdAt: {
          displayName: "Date of Joining",
          headerStyle: styles.cellHeaderTheme,
          cellStyle: styles.cellCenter, // <- Cell style
          cellFormat: function (value, row) {
            // <- Renderer function, you can access also any row.property
            if (value !== "undefined" && value !== "") return new Date(value);
            else return "--";
          },
          width: 250, // <- width in pixels
        },
        accountStatus: {
          displayName: "Status",
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
      };

      // that are listed in the report specification
      const dataset = data;
      const merges = [
        { start: { row: 1, column: 1 }, end: { row: 1, column: 22 } },
        { start: { row: 2, column: 1 }, end: { row: 2, column: 22 } },
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
            name: "Seller Performance Report", // <- Specify sheet name (optional)
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
