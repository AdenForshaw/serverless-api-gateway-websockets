

const AWS = require('aws-sdk');

export function sendMessageToWebsocketClient (url, connectionId, payload){
  
 return new Promise((resolve, reject) => {
  const apigatewaymanagementapi = new AWS.ApiGatewayManagementApi({apiVersion: '2029', endpoint: url});
  apigatewaymanagementapi.postToConnection({
    ConnectionId: connectionId, // connectionId of the receiving ws-client
    Data: JSON.stringify(payload),
  }, (err, data) => {
    if (err) {
      console.log('err is', err);
      reject(err);
    }
    resolve(data);
  });
});

}