import { Handler } from "@netlify/functions";

export const handler: Handler = async () => {
  // Disabled: legacy visit function intentionally returns 404 to avoid exposing analytics endpoints
  return {
    statusCode: 404,
    body: JSON.stringify({ ok: false, message: 'Disabled' }),
  };
};