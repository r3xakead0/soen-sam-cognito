const {
  CognitoIdentityProviderClient,
  AdminRespondToAuthChallengeCommand,
  RespondToAuthChallengeCommand,
  ChallengeNameType
} = require("@aws-sdk/client-cognito-identity-provider");

const cognitoClient = new CognitoIdentityProviderClient({
  credentials: {
      accessKeyId: process.env.LAMBDA_ACCESS_KEY_ID,
      secretAccessKey: process.env.LAMBDA_SECRET_ACCESS_KEY,
  },
  region: process.env.AWS_REGION,
});

const confirmPassword = async (event) => {

    if (event.httpMethod !== 'POST') {
      throw new Error(`confirmPassword only accepts POST method, you tried: ${event.httpMethod} method.`);
    }
  
    // All log statements are written to CloudWatch
    console.info('received:', event);
  
    let response = {};
  
    try {
  
      const body = JSON.parse(event.body);
  
      const params = {
        ClientId: process.env.CLIENT_ID,
        UserPoolId: process.env.USER_POOL_ID,
        ChallengeName: ChallengeNameType.NEW_PASSWORD_REQUIRED,
        ChallengeResponses: {
          NEW_PASSWORD: body.password,
          USERNAME: body.username,
        },
        Session: body.session,
      };
  
      const command = new AdminRespondToAuthChallengeCommand(params);
      const result = await cognitoClient.send(command);
  
      console.info('result:', result);
      
      response = {
        statusCode: 200,
        body: JSON.stringify(result)
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
  };

  
  const adminConfirmPassword = async (event) => {

  if (event.httpMethod !== 'POST') {
    throw new Error(`adminConfirmPassword only accepts POST method, you tried: ${event.httpMethod} method.`);
  }

  // All log statements are written to CloudWatch
  console.info('received:', event);

  let response = {};

  try {

    const body = JSON.parse(event.body);

    const params = {
      ClientId: process.env.CLIENT_ID,
      UserPoolId: process.env.USER_POOL_ID,
      ChallengeName: ChallengeNameType.NEW_PASSWORD_REQUIRED,
      ChallengeResponses: {
        NEW_PASSWORD: body.password,
        USERNAME: body.username,
      },
      Session: body.session,
    };

    const command = new RespondToAuthChallengeCommand(params);
    const result = await cognitoClient.send(command);

    response = {
      statusCode: 200,
      body: JSON.stringify(result)
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
};

module.exports = {
  confirmPassword,
  adminConfirmPassword
};