const {
  CognitoIdentityProviderClient,
  AdminUpdateUserAttributesCommand,
  AdminRemoveUserFromGroupCommand,
  AdminListGroupsForUserCommand,
  AdminAddUserToGroupCommand
} = require("@aws-sdk/client-cognito-identity-provider");

const cognitoClient = new CognitoIdentityProviderClient({
  credentials: {
      accessKeyId: process.env.LAMBDA_ACCESS_KEY_ID,
      secretAccessKey: process.env.LAMBDA_SECRET_ACCESS_KEY,
  },
  region: process.env.AWS_REGION,
});

exports.updateUser = async (event) => {

  if (event.httpMethod !== 'PUT') {
    throw new Error(`updateUser only accepts POST method, you tried: ${event.httpMethod} method.`);
  }

  // All log statements are written to CloudWatch
  console.info('received:', event);

  let response = {};

  try {

    const body = JSON.parse(event.body);

    const params = {
      UserPoolId: process.env.USER_POOL_ID,
      Username: body.username, 
      UserAttributes: [
        {
          Name: "name",
          Value: body.name,
        }
      ]
    };

    const command = new AdminUpdateUserAttributesCommand(params);
    const result = await cognitoClient.send(command);

    const groupsResult = await cognitoClient.send(
      new AdminListGroupsForUserCommand({ 
        UserPoolId: process.env.USER_POOL_ID,
        Username: body.username
      })
    );

    let groupsInput = body.groups;
    let groupsExist = groupsResult.Groups.map((groups) => groups.GroupName);
    
    let groupsDelete = groupsExist.filter(x => !groupsInput.includes(x));
    
    console.info('groupsDelete:', groupsDelete);
        
    for (var i = 0; i < groupsDelete.length; i++) {
      const resultGroup = await cognitoClient.send(
        new AdminRemoveUserFromGroupCommand({ 
          UserPoolId: process.env.USER_POOL_ID,
          Username: body.username, 
          GroupName: groupsDelete[i]
        })
      );
    }
    
    let groupsAdd = groupsInput.filter(x => !groupsExist.includes(x));

    console.info('groupsAdd:', groupsAdd);
        
    for (var i = 0; i < groupsAdd.length; i++) {
      const resultGroup = await cognitoClient.send(
        new AdminAddUserToGroupCommand({ 
          UserPoolId: process.env.USER_POOL_ID,
          Username: body.username, 
          GroupName: groupsAdd[i]
        })
      );
    }

    response = {
      statusCode: 200,
      body: JSON.stringify({
        message: "Usuario actualizado con éxito"
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
