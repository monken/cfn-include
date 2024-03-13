module.exports = {
  getenv: [
    {
      name: 'get existing variable',
      template: {
        readme: {
          'Fn::GetEnv': 'README',
        },
      },
      output: {
        readme: 'readme',
      },
    },
    {
      name: 'get non-existing variable',
      template: {
        readme: {
          'Fn::GetEnv': 'FOOBAR',
        },
      },
      catch: (err) => err instanceof Error,
    },
    {
      name: 'get non-existing variable with default',
      template: {
        readme: {
          'Fn::GetEnv': ['FOOBAR', true],
        },
      },
      output: {
        readme: true,
      },
    },
  ],
};
