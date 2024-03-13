module.exports = {
  ifEval: [
    {
      name: 'truthy',
      template: {
        'Fn::IfEval': {
          inject: {
            lastName: 'bear',
          },
          evalCond: "'$lastName' === 'bear'",
          truthy: {
            Name: 'Yogi',
            LastName: 'Bear',
          },
          falsy: {
            Name: 'Fred',
            LastName: 'Flint',
          },
        },
      },
      output: {
        Name: 'Yogi',
        LastName: 'Bear',
      },
    },
    {
      name: 'falsy',
      template: {
        'Fn::IfEval': {
          inject: {
            lastName: 'bears',
          },
          evalCond: "'$lastName' === 'bear'",
          truthy: {
            Name: 'Yogi',
            LastName: 'Bear',
          },
          falsy: {
            Name: 'Fred',
            LastName: 'Flint',
          },
        },
      },
      output: {
        Name: 'Fred',
        LastName: 'Flint',
      },
    },
    {
      name: 'no falsy',
      template: {
        'Fn::IfEval': {
          inject: {
            lastName: 'bears',
          },
          evalCond: "'$lastName' === 'bear'",
          truthy: {
            Name: 'Yogi',
            LastName: 'Bear',
          },
        },
      },
      output: '',
    },
    {
      name: 'evalCond required',
      template: {
        'Fn::IfEval': {
          inject: {
            lastName: 'bears',
          },
          truthy: {
            Name: 'Yogi',
            LastName: 'Bear',
          },
        },
      },
      catch: (err) => err instanceof Error,
    },
  ],
};
