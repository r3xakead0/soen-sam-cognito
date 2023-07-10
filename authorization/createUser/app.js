const {
  CognitoIdentityProviderClient,
  AdminCreateUserCommand,
  AdminAddUserToGroupCommand
} = require("@aws-sdk/client-cognito-identity-provider");

const cognitoClient = new CognitoIdentityProviderClient({
  credentials: {
      accessKeyId: process.env.LAMBDA_ACCESS_KEY_ID,
      secretAccessKey: process.env.LAMBDA_SECRET_ACCESS_KEY,
  },
  region: process.env.AWS_REGION,
});

exports.createUser = async (event) => {

  if (event.httpMethod !== 'POST') {
    throw new Error(`createUser only accepts POST method, you tried: ${event.httpMethod} method.`);
  }

  // All log statements are written to CloudWatch
  console.info('received:', event);

  let response = {};

  try {

    const body = JSON.parse(event.body);

    const params = {
      UserPoolId: process.env.USER_POOL_ID,
      Username: body.username, 
      TemporaryPassword: body.password, 
      DesiredDeliveryMediums: [],
      MessageAction: 'SUPPRESS',
      ForceAliasCreation: false,
      UserAttributes: [
        {
          Name: "name",
          Value: body.name,
        },
        {
          Name: "email",
          Value: body.email,
        },
        {
          Name: "email_verified",
          Value: "true",
        }
      ]
    };

    const command = new AdminCreateUserCommand(params);
    const result = await cognitoClient.send(command);
    
    console.info('result:', result);
    
    const groups = body.groups;
    for (var i = 0; i < groups.length; i++) {
      const resultGroup = await cognitoClient.send(
        new AdminAddUserToGroupCommand({ 
          UserPoolId: process.env.USER_POOL_ID,
          Username: body.username, 
          GroupName: groups[i]
        })
      );
      console.info('resultGroup:', resultGroup);
    }
  
    response = {
      statusCode: 200,
      body: JSON.stringify({
        message: "Usuario creado con éxito"
      })
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
