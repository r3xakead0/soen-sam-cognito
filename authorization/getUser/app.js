const {
  CognitoIdentityProviderClient,
  AdminGetUserCommand,
  AdminListGroupsForUserCommand
} = require("@aws-sdk/client-cognito-identity-provider");

const cognitoClient = new CognitoIdentityProviderClient({
  credentials: {
      accessKeyId: process.env.LAMBDA_ACCESS_KEY_ID,
      secretAccessKey: process.env.LAMBDA_SECRET_ACCESS_KEY,
  },
  region: process.env.AWS_REGION,
});

exports.getUser = async (event) => {

  if (event.httpMethod !== 'POST') {
    throw new Error(`getUser only accepts POST method, you tried: ${event.httpMethod} method.`);
  }

  // All log statements are written to CloudWatch
  console.info('received:', event);

  let response = {};

  try {

    const body = JSON.parse(event.body);
    const username = body.username;

    const params = {
      UserPoolId: process.env.USER_POOL_ID,
      Username: username,
    };

    const result = await cognitoClient.send(
      new AdminGetUserCommand(params)
    );

    const resultGroup = await cognitoClient.send(
      new AdminListGroupsForUserCommand({
        UserPoolId: process.env.USER_POOL_ID,
        Username: body.username,
      })
    );
    
    response = {
      statusCode: 200,
      body: JSON.stringify({
        username: result.Username,
        userAttributes: result.UserAttributes,
        userCreateDate: result.UserCreateDate,
        userLastModifiedDate: result.UserLastModifiedDate,
        enabled: result.Enabled,
        userStatus: result.UserStatus,
        groups: resultGroup.Groups
      })
    }  

  } catch (ex) {
    response = {
      statusCode: 500,
      body: JSON.stringify(ex.message.toString())
    }  
  }

  // All log statements are written to CloudWatch
  console.info(`response from: ${event.path} statusCode: ${response.statusCode} body: ${response.body}`);

  return response;
}
