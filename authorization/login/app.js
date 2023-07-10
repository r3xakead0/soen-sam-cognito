const {
  CognitoIdentityProviderClient,
  InitiateAuthCommand,
  AdminInitiateAuthCommand,
  AuthFlowType,
  AdminListGroupsForUserCommand
} = require("@aws-sdk/client-cognito-identity-provider");

const cognitoClient = new CognitoIdentityProviderClient({
  credentials: {
      accessKeyId: process.env.LAMBDA_ACCESS_KEY_ID,
      secretAccessKey: process.env.LAMBDA_SECRET_ACCESS_KEY,
  },
  region: process.env.AWS_REGION,
});

const login = async (event) => {

  if (event.httpMethod !== 'POST') {
    throw new Error(`login only accepts POST method, you tried: ${event.httpMethod} method.`);
  }

  // All log statements are written to CloudWatch
  console.info('received:', event);

  let response = {};

  try {

    const body = JSON.parse(event.body);

    const params = {
      //AuthFlow: "USER_PASSWORD_AUTH",W
      AuthFlow: AuthFlowType.USER_PASSWORD_AUTH ,
      ClientId: process.env.CLIENT_ID,
      UserPoolId: process.env.USER_POOL_ID,
      AuthParameters: {
        USERNAME: body.username,
        PASSWORD: body.password,
      },
    };

    const command = new InitiateAuthCommand(params);
    const result = await cognitoClient.send(command);
    
    console.info('result:', result);
    
    if(result.ChallengeName == "NEW_PASSWORD_REQUIRED"){
      response = {
        statusCode: 200,
        body: JSON.stringify({
          ChallengeName: result.ChallengeName,
          Session: result.Session
        })
      }        
    } else {
      
      const resultGroup = await cognitoClient.send(
        new AdminListGroupsForUserCommand({
          UserPoolId: process.env.USER_POOL_ID,
          Username: body.username,
        })
      );
      
      let groupname = resultGroup.Groups.map((group) => group.GroupName);
      
      response = {
        statusCode: 200,
        body: JSON.stringify(result.AuthenticationResult),
        body: JSON.stringify({
          tokenType: result.AuthenticationResult.TokenType,
          token: result.AuthenticationResult.IdToken,
          accessToken: result.AuthenticationResult.AccessToken,
          refreshToken: result.AuthenticationResult.RefreshToken,
          exp: result.AuthenticationResult.ExpiresIn,
          groups: groupname
        })
      }     
    }

  } catch (ex) {
    response = {
      statusCode: 500,
      body: JSON.stringify({
        message: ex.message.toString()
      })
    }  
  }

  // All log statements are written to CloudWatch
  console.info(`response from: ${event.path} statusCode: ${response.statusCode} body: ${response.body}`);

  return response;
}

const adminLogin = async (event) => {

  if (event.httpMethod !== 'POST') {
    throw new Error(`adminLogin only accepts POST method, you tried: ${event.httpMethod} method.`);
  }

  // All log statements are written to CloudWatch
  console.info('received:', event);

  let response = {};

  try {

    const body = JSON.parse(event.body);

    const params = {
      AuthFlow: AuthFlowType.ADMIN_USER_PASSWORD_AUTH,
      ClientId: process.env.CLIENT_ID,
      UserPoolId: process.env.USER_POOL_ID,
      AuthParameters: {
        USERNAME: body.username,
        PASSWORD: body.password,
      },
    };

    const command = new AdminInitiateAuthCommand(params);
    const result = await cognitoClient.send(command);

    console.info('result:', result);
    
    if(result.ChallengeName == "NEW_PASSWORD_REQUIRED"){
      response = {
        statusCode: 200,
        body: JSON.stringify({
          ChallengeName: result.ChallengeName,
          Session: result.Session
        })
      }        
    } else {
      
      const resultGroup = await cognitoClient.send(
        new AdminListGroupsForUserCommand({
          UserPoolId: process.env.USER_POOL_ID,
          Username: body.username,
        })
      );
      
      let groupname = resultGroup.Groups.map((group) => group.GroupName);
      
      response = {
        statusCode: 200,
        body: JSON.stringify(result.AuthenticationResult),
        body: JSON.stringify({
          tokenType: result.AuthenticationResult.TokenType,
          token: result.AuthenticationResult.IdToken,
          accessToken: result.AuthenticationResult.AccessToken,
          refreshToken: result.AuthenticationResult.RefreshToken,
          exp: result.AuthenticationResult.ExpiresIn,
          groups: groupname
        })
      }     
    }

  } catch (ex) {
    response = {
      statusCode: 500,
      body: JSON.stringify({
        message: ex.message.toString()
      })
    }  
  }

  // All log statements are written to CloudWatch
  console.info(`response from: ${event.path} statusCode: ${response.statusCode} body: ${response.body}`);

  return response;
}

module.exports = {
  login,
  adminLogin
};