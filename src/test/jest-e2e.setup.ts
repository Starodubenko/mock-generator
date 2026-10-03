jest.mock('@nestjs/swagger', () => {
  const decorator = () => () => undefined;
  return new Proxy(
    { SwaggerModule: { setup: jest.fn() }, DocumentBuilder: jest.fn() },
    {
      get: (target, prop) =>
        prop in target ? target[prop as keyof typeof target] : decorator,
    },
  );
});

jest.mock('@nestjs/axios', () => ({
  HttpModule: {
    register: () => ({
      module: class MockHttpModule {},
    }),
  },
  HttpService: class HttpService {},
}));

jest.mock('@nestjs-ssr/react', () => ({
  RenderModule: {
    forRoot: () => ({
      module: class MockRenderModule {},
    }),
  },
  Render: () => () => undefined,
  Layout: () => () => undefined,
}));
