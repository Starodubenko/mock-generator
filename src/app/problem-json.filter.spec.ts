import type { ArgumentsHost } from '@nestjs/common';
import { ProblemJsonFilter } from './problem-json.filter';
import { DomainHttpException } from './domain-http.exception';

const hostOf = (
  request: { url: string },
  response: Record<string, unknown>,
): ArgumentsHost =>
  ({
    switchToHttp: () => ({
      getRequest: () => request,
      getResponse: () => response,
    }),
  }) as ArgumentsHost;

describe('ProblemJsonFilter', () => {
  it('should_not_write_when_headers_already_sent', () => {
    const response = {
      headersSent: true,
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
      json: jest.fn(),
      type: jest.fn().mockReturnThis(),
    };
    new ProblemJsonFilter().catch(
      new Error('after redirect'),
      hostOf({ url: '/profiles/document/trainings' }, response),
    );
    expect(response.status).not.toHaveBeenCalled();
    expect(response.send).not.toHaveBeenCalled();
    expect(response.json).not.toHaveBeenCalled();
  });

  it('should_write_problem_json_on_api_v1', () => {
    const response = {
      headersSent: false,
      status: jest.fn().mockReturnThis(),
      type: jest.fn().mockReturnThis(),
      json: jest.fn(),
      send: jest.fn(),
    };
    new ProblemJsonFilter().catch(
      new DomainHttpException(
        422,
        'empty_corpus',
        'Эталонные файлы не приложены',
        '/api/v1/profiles/document/trainings',
      ),
      hostOf({ url: '/api/v1/profiles/document/trainings' }, response),
    );
    expect(response.status).toHaveBeenCalledWith(422);
    expect(response.type).toHaveBeenCalledWith('application/problem+json');
    expect(response.json).toHaveBeenCalled();
  });
});
