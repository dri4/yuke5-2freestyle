import { Handler } from "@netlify/functions";

export const handler: Handler = async (event, context) => {
  // Disabled: visit webhook endpoint not exposed. Return 404 to avoid discovery.
  return {
    statusCode: 404,
    body: JSON.stringify({ ok: false, message: 'Disabled' }),
  };
};