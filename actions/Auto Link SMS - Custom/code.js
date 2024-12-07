/**
* Handler that will be called during the execution of a PostLogin flow.
*
* @param {Event} event - Details about the user and the context in which they are logging in.
* @param {PostLoginAPI} api - Interface whose methods can be used to change the behavior of the login.
*/
exports.onExecutePostLogin = async (event, api) => {
  const axios = require("axios");
  const ManagementClient = require("auth0").ManagementClient;

  //const { CLIENT_ID, CLIENT_SECRET } = event.secrets;
  const CLIENT_ID = "PjHgidB3FNbmjTppJMXEOfLmzli7i6GL";
  const CLIENT_SECRET = "upnnGLIWk3MgWhvB0cbmBqq5FA4zETFDsDIxs9qcZaPjNp-Bt2oITbmiMKEtolah";

  // Get the Management API v2 token
  const {
    data: { access_token },
  } = await axios
    .post(
      "https://peach-quelea-88847.cic-demo-platform.auth0app.com/oauth/token",
      {
        grant_type: "client_credentials",
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        audience: "https://peach-quelea-88847.cic-demo-platform.auth0app.com/api/v2/",
      },
      {
        headers: { "content-type": "application/json" },
      }
    )
    .catch((error) => {
      console.log(error.request.data);
    });

  console.log(access_token);

  // Create an instance of the Management API client
  const management = new ManagementClient({
    token: access_token,
    domain: "peach-quelea-88847.cic-demo-platform.auth0app.com",
  });

  console.log(event.user.name);

  // Check if there already is an account with this email address
  var params = {q: 'user_metadata.telephone:"' + 
    event.user.name + '" OR name:"' + event.user.name + '"'};
  const users = await management.getUsers(params);

  console.log('Users count:', users.length);

  // If there isn't any account with this email address, return and let user continue
  // There should never be more than 2 accounts with the same address, but just in case this happens somehow,
  // we return here, so that a new account will be created for this user (better than to crash with error)
  if (users.length < 2) {
    return;
  }

  // Link user accounts
  const linkedUserIdentities = await management.users.link(users[1].user_id, {
    user_id: users[0].user_id,
    provider: users[0].identities[0].provider,
  });

  // Leave custom claim to let FE know
  api.idToken.setCustomClaim("https://peach-quelea-88847.cic-demo-platform.auth0app.com/account_linking_data", {
    primary_user_id: users[1].user_id,
    secondary_user_id: users[0].user_id,
  });

  // Return the linked account instead so user can continue without re-authentication
  event.user = {
    ...users[0],
    identities: linkedUserIdentities
  };

  return {
    user: {
      ...users[0],
      identities: linkedUserIdentities
    }
  }
};


/**
* Handler that will be invoked when this action is resuming after an external redirect. If your
* onExecutePostLogin function does not perform a redirect, this function can be safely ignored.
*
* @param {Event} event - Details about the user and the context in which they are logging in.
* @param {PostLoginAPI} api - Interface whose methods can be used to change the behavior of the login.
*/
// exports.onContinuePostLogin = async (event, api) => {
// };
