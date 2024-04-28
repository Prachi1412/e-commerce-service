/**
 * Module dependencies
 */
var acl = require("acl");

// Using the memory backend
acl = new acl(new acl.memoryBackend());

/**
 * Invoke User Permissions
 */

acl.allow([
  {
    roles: ["superadmin"],
    allows: [
      {
        resources: "/admin-panel/v1/customers",
        permissions: ["get"],
      },
      // {
      //   resources: "/users",
      //   permissions: ["put"],
      // },
      // {
      //   resources: "/users/password",
      //   permissions: ["post"],
      // },
      // {
      //   resources: "/users/delete-child/:kidId",
      //   permissions: ["delete"],
      // },
    ],
  },
]);

module.exports = {
  acl,
};
