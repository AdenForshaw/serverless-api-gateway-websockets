'use strict';

import * as dynamoDbLib from "./libs/dynamodb-lib";
import { success, failure } from "./libs/response-lib";
import { sendMessageToWebsocketClient } from "./libs/apigateway-lib";

const DYNAMO_TABLE_NAME = "WebsocketClients"

module.exports.connectHandler = async (event, context) => {
  
  context.callbackWaitsForEmptyEventLoop = false;

  const domain = event.requestContext.domainName;
  const stage = event.requestContext.stage;
  const connectionId = event.requestContext.connectionId

  const params = {
    TableName: DYNAMO_TABLE_NAME,
    Item: {
      connectionId: connectionId,
      createdAt: Date.now(),
      domain: domain,
      stage: stage
    }
  };

  try {
    await dynamoDbLib.call("put", params);

    return success({ status: true });

  } catch (e) {
    
    console.log(e);

    return failure({ status: false });
  }
};


module.exports.disconnectHandler = async (event, context) => {

  const connectionId = event.requestContext.connectionId

  await deleteConnection( connectionId );
}



module.exports.defaultHandler = async (event, context) => {

  const connectionId = event.requestContext.connectionId; 

  await sendMessage(connectionId, "ping");

  return success({ status: true });
}

module.exports.receiveQueueMessage = async (message, context) => {
  //have set in serverless.yml to have a batchSize of 1, so expect only 1 record
  await sendMessageToAll(message.Records[0].body)
  
  return success({ status: true });

};

const deleteConnection = async (connectionId) => {
    const params = {
    TableName: DYNAMO_TABLE_NAME,
    Key: {
      connectionId: connectionId
    }
  };

  try {
    const result = await dynamoDbLib.call("delete", params);
    return success({ status: true });
  } catch (e) {
    console.log(e)
    return failure({ status: false });
  }
}


const sendMessage = async ( connectionId , output_message ) => {
    try{
      const callbackUrlForAWS = util.format(util.format('https://%s/%s', domain, stage)); 
      await sendMessageToWebsocketClient(callbackUrlForAWS, connectionId, output_message);
    }catch(err)
    {
      if (err.statusCode === 410) {
        await deleteConnection(connectionId)
      } else {
        console.log("Failed to post. Error: " + JSON.stringify(err));
      }
    }
}

const sendMessageToAll = async ( output_message) => {


  const params = {
    TableName: "websocketClients"
  };
  
  try {
    connections = await dynamoDbLib.scan(params).Items;
  }catch(e)
  {
    console.log(e)
  }
  connections.map( connection => {
    await sendMessage(connection.connectionId, output_message)
  })
}