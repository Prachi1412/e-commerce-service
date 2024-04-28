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
            sz: 20,
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
        [{ value: " Product list", style: styles.headerDark }],
        [],
        // [{value: 'Members Nearby Report', style: styles.mainheaderDark}],
      ];
      //Here you specify the export structure
      const specification = {
        createdAt: {
          displayName: "Created Date",
          headerStyle: styles.cellHeaderTheme,
          cellStyle: styles.cellCenter, // <- Cell style
          cellFormat: function (value, row) {
            // <- Renderer function, you can access also any row.property
            if (value !== "undefined" && value !== "") return new Date(value);
            else return "--";
          },
          width: 250, // <- width in pixels
        },
        productCode: {
          displayName: "Product Code",
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
        productName: {
          displayName: "Product Name",
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
        supplierName: {
          displayName: "Seller Name",
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
        productCategory: {
          displayName: "Category",
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
        productSubCategory: {
          displayName: "Sub Category",
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
        // productClassificationName: {
        //   displayName: "Classification",
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
        productDescription: {
          displayName: "Description",
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
        productQuantity: {
          displayName: "Product Quantity",
          headerStyle: styles.cellHeaderTheme,
          cellStyle: styles.cellCenter, // <- Cell style
          //    cellStyle: styles.cellPink, // <- Cell style
          cellFormat: function (value, row) {
            // <- Renderer function, you can access also any row.property
            if (value !== "undefined" && value !== "") return value.toString();
            else return "--";
          },
          width: 250, // <- width in pixels
        },
        productPrice: {
          displayName: "Price of product",
          headerStyle: styles.cellHeaderTheme,
          cellStyle: styles.cellCenter, // <- Cell style
          //    cellStyle: styles.cellPink, // <- Cell style
          cellFormat: function (value, row) {
            // <- Renderer function, you can access also any row.property
            if (value !== "undefined" && value !== "") return value.toString();
            else return "--";
          },
          width: 250, // <- width in pixels
        },
        accesoriesRequirement: {
          displayName: "Accesories Requirement",
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
        accessories: {
          displayName: "Accessories",
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
        awardRecognition: {
          displayName: "Award Recognition",
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
        compatibleDevices: {
          displayName: "Compatible Devices",
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
        consumableRequirement: {
          displayName: "Consumable Requirement",
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
        consumables: {
          displayName: "Consumables",
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
        genericName: {
          displayName: "Generic Name",
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
        hsnNo: {
          displayName: "HSN No",
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
        isDemo: {
          displayName: "Demo Available",
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
        keywords: {
          displayName: "Entered Keywords",
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
        maintainainceOffer: {
          displayName: "Maintainaince Offer",
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
        maintenance: {
          displayName: "Maintenance",
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
        otherFeature: {
          displayName: "Other Feature",
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
        otherRelevantInformation: {
          displayName: "Other Relevant Information",
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
        productInstallation: {
          displayName: "Product Installation",
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
        productWarranty: {
          displayName: "Product Warranty",
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
        productWarrantyPeriod: {
          displayName: "Product Warranty Period",
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
        specification: {
          displayName: "Specification",
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
        specificUse: {
          displayName: "Specific Use",
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
        typeOfconsumables: {
          displayName: "Type Of Consumables",
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
        typeOfDemo: {
          displayName: "Type Of Demo",
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
        contractSigned: {
          displayName: "Contract Signe Status",
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
        approved: {
          displayName: "Approve Status",
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
        unitInStock: {
          displayName: "No. of Units in Stock",
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
        productMinDelivery: {
          displayName: "Minimum Delivery Time",
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
        productStatus: {
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
            name: "Wellness Report", // <- Specify sheet name (optional)
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
