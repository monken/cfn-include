module.exports = {
  errors: [
    {
      name: 'yaml',
      template: {
        'Fn::Include': 'includes/broken/error.yaml',
      },
      catch(err) {
        return err instanceof Error && err.name === 'SyntaxError';
      },
    },
    {
      name: 'json comma',
      template: {
        'Fn::Include': 'includes/broken/simplecomma.json',
      },
      output: { foo: 'bar' },
    },
    {
      name: 'json comma and comment',
      description:
        // eslint-disable-next-line max-len
        "this is not a valid JSON document because of the trailing comma in line 2. However, it's valid YAML and therefore parseable.",
      template: {
        'Fn::Include': 'includes/broken/commawithcomment.json',
      },
      output: { foo: 'bar', '/* coment': 'value */' },
    },
    {
      name: 'ref in string',
      template: {
        'Fn::Include': 'includes/literal.txt',
        context: {
          Ref: 'AWS::StackId',
        },
      },
      output() {
        return true;
      },
      catch(err) {
        return err instanceof Error && err.message === 'refs not allowed in strings';
      },
    },
  ],
};
