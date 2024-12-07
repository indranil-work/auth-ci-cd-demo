function login(email, password, callback) {

  const request = require('request');
  const options = {
    method: 'POST',
    url:  'https://accountgateway.zediaccess.net/account/LogOnWithJsonResponse',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'  // Adjust if needed
    },
    form: {
      username: email,
      password: password
    }
  };

  request(options, function(err, response) {

    if (err) {
      return callback(new Error('Request error: ' + err.message));
    }

    let user;
    
    try {
      user = JSON.parse(response.body).body;
    } catch (parseError) {
      return callback(new Error('Error parsing the response: ' + parseError.message));
    }

   
    // Check if the login failed due to invalid credentials in the response body

    if (user.logonErrorMessage === 'Log in unsuccessful due to an invalid username and/or password.') {

      return callback(new Error('Login unsuccessful: Invalid username and/or password.'));

    }

    if (user.logonErrorMessage ===  'Log in unsuccessful. This account is locked due to too many log in attempts. The account will unlock in about 1 minutes. ') {

      return callback(new Error('Login unsuccessful: Account locked.'));

    }
    
    if (!user.isAccountGatewayUser) {

      return callback(new Error('Not an account gateway user.'));

    }

    // Handle 401 error for invalid username or password (if applicable)

    if (response.statusCode === 401) {

      return callback(new Error('Login unsuccessful: Invalid username and/or password.'));

    }

 

    // Handle other status codes

    if (response.statusCode >= 400) {

      return callback(new Error('Server error: Received status code ' + response.statusCode));

    }

 

    if (!user || typeof user !== 'object') {

      return callback(new Error('Invalid response format'));

    }

 

     if (!user.id || !user.username) {

      return callback(new Error('Incomplete user data in response'));

    }

 

    // Return the user data
   
   const options2 = {

      method: 'POST',
      url: 'https://accountgateway.zediaccess.net/account/<GETIPLIST>',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'  // Adjust if needed
      },
      form: {
        username: email,
      }
    };
    
   request(options2, function(err2, response2) {

    if (err2) {

      return callback(new Error('Request error: ' + err2.message));

    }
     
    let ipList;
    
    try {
      ipList = JSON.parse(response.body);
    } catch (parseError) {
      return callback(new Error('Error parsing the IP response: ' + parseError.message));
    }
    
   return callback(null, {
      user_id: user.id.toString(),
      email: user.username,
      app_metadata: {
        isAccountGatewayUser: user.isAccountGatewayUser,
        ipList: ipList
      } 
     });
    });
  });
}