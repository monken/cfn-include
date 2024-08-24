module.exports = {
  ifEval: [
    {
      name: 'truthy',
      doEval: true,
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
      doEval: true,
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
      doEval: true,
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
      doEval: true,
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
