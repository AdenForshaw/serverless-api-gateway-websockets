'use strict';

import * as dynamoDbLib from "./libs/dynamodb-lib";
import { success, failure } from "./libs/response-lib";
import { sendMessageToWebsocketClient } from "./libs/apigateway-lib";

const DYNAMO_TABLE_NAME = "WebsocketClients"

module.exports.connectHandler = async (event, context) => {
  
  console.log("Connect",event)

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

  const domain = event.requestContext.domainName;
  const stage = event.requestContext.stage;
  const connectionId = event.requestContext.connectionId; 


  await sendMessage(connectionId, "ping");

  return success({ status: true });
}

module.exports.receiveQueueMessage = async (event, context) => {
  console.log("receiveQueueMessage",event)

  return {
    statusCode: 200
  };
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

}
const sendMessage = async (connectionId, message)=>{
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
    TableName: "websocketClients",
    KeyConditionExpression: "topicName = :topicName",
    ExpressionAttributeValues: {
      ":topicName": topic_name//"images-search"//event.requestContext.identity.cognitoIdentityId
    }
  };
  
  try {
    connections = await dynamoDbLib.call("query", params).Items;
  }catch(e)
  {
    console.log(e)
  }
  connections.map( connection => {
    await sendMessage(connection.connectionId)
  })
  /*
  for(var i=0;i<result.Items.length;i++)
  {
    let item = result.Items[i];
    let domain = item.domain;
    let stage = '';//item.stage;
    let connectionId = item.connectionId;//event.requestContext.connectionId; 
    
    let callbackUrlForAWS = util.format(util.format('https://%s/%s', domain, stage)); //construct the needed url
    let deleteItem = false
    console.log("Topic:", topic_name, connectionId, callbackUrlForAWS)
    try{

    await sendMessageToWebsocketClient(callbackUrlForAWS, connectionId, output_message);
    }catch(err)
    {
    console.log("Fail - Topic:", topic_name, connectionId, callbackUrlForAWS)
      if (err.statusCode === 410) {
        deleteItem = true;
      } else {
        console.log("Failed to post. Error: " + JSON.stringify(err));
      }
    }

    if(deleteItem)
    {
      
        console.log("Found stale connection, deleting " + connectionId);
        let dparam = {
          TableName: "websocketClients",
          Key: {
            connectionId: connectionId,
            topicName: topic_name
          }
        };
        try{

        await dynamoDbLib.call("delete", dparam);
        }catch(err)
        {
          console.log(err)
        }
    }
  }

  return {
    statusCode: 200
  };*/
}