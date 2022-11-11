import { APIGatewayEvent } from 'aws-lambda'

export type MappedEvent<T> = {
  body: T
  path: Record<string, string | undefined>
  querystring: Record<string, string | undefined>
  headers: Record<string, string | undefined>
  context: {
    sourceIp: string
  }
}

export function isAPIGatewayEvent(e: any): e is APIGatewayEvent {
  return !!e.requestContext
}

export function transformEvent<T>(
  e: APIGatewayEvent | MappedEvent<T>,
): MappedEvent<T> {
  if (!isAPIGatewayEvent(e)) {
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
