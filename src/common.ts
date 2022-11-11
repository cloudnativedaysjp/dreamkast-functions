import { APIGatewayEvent, APIGatewayProxyResult } from 'aws-lambda'

export type MappedEvent<T> = {
  body: T
  path: Record<string, string | undefined>
  querystring: Record<string, string | undefined>
  headers: Record<string, string | undefined>
  context: {
    sourceIp: string
  }
}

export function isRawEvent(e: any): e is APIGatewayEvent {
  return !!e.requestContext
}

export function transformEvent<T>(
  e: APIGatewayEvent | MappedEvent<T>,
): MappedEvent<T> {
  if (!isRawEvent(e)) {
    return e
  }
  return {
    body: !!e.body ? JSON.parse(e.body) : '',
    path: e.pathParameters || {},
    querystring: e.queryStringParameters || {},
    headers: e.headers || {},
    context: {
      sourceIp: 'unknown',
    },
  }
}

export function genTransformResponse(
  e: APIGatewayEvent | MappedEvent<unknown>,
): (resp: unknown) => unknown {
  if (!isRawEvent(e)) {
    return (resp: unknown) => resp
  } else {
    return (resp: unknown) => ({
      statusCode: 200,
      body: JSON.stringify(resp),
    })
  }
}
