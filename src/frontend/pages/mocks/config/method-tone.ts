export const MOCK_METHOD_TONE: Record<string, string> = {
  GET: '#61affe',
  POST: '#49cc90',
  PUT: '#fca130',
  PATCH: '#50e3c2',
  DELETE: '#f93e3e',
  HEAD: '#9012fe',
};

export const mockMethodTone = (method: string): string =>
  MOCK_METHOD_TONE[method] ?? '#555';
