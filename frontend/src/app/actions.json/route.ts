import { ACTIONS_CORS_HEADERS, ActionsJson } from '@solana/actions';

import { config } from '@/config';

export const GET = async () => {
  const payload: ActionsJson = {
    rules: [
      {
        pathPattern: '/blink/**',
        apiPath: `${config.apiUrl}/api/actions/**`,
      },
    ],
  };

  return Response.json(payload, { headers: ACTIONS_CORS_HEADERS });
};

export const OPTIONS = GET;
