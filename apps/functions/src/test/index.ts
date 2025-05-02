import { Handler, type APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda"


export const handler: Handler<APIGatewayProxyEventV2, APIGatewayProxyResultV2> = async (event, context) => {

  console.log({
    event,
    context
  })

  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      message: "Hello World"
    })
  }
}
