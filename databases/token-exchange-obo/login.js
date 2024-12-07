async function login(email, password, callback) {
  const request = require('request');
  
  var jose = require('node-jose');
  try{
  const pkey = JSON.parse(configuration.pkey);
  let key = await jose.JWK.asKey(pkey);
	let result = await jose.JWS.createVerify(key).verify(password);
  const claims = JSON.parse(result.payload);
  if (claims.exp < Math.floor(Date.now() / 1000)){
     callback(new Error("Expired token"));
  }
    
  if (claims.username !== email){
     callback(new Error("Subject does not match"));
  }
   
    callback(null, {
    	user_id: email,
    	nickname: email,
    	email: email,
    	result: JSON.stringify(claims)
   });
  }catch (err){
    callback(err);
  }  
   /*callback(null, {
    	user_id: email,
    	nickname: email,
    	email: email,
     "mfa_factors": [
        {
          "email": {
            "value": email
          }
        }
      ]
   });*/
}
