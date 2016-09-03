module.exports = {
  errors: [{
    name: "yaml",
    template: {
      "Fn::Include": "includes/broken/error.yaml"
    },
    catch: function(err) {
      return err instanceof Error && err.name === 'SyntaxError';
    }
  }, {
    name: "json comma",
    template: {
      "Fn::Include": "includes/broken/simplecomma.json"
    },
    output: {"foo":"bar"}
  }, {
    name: "json comma and comment",
    "description": "this is not a valid JSON document because of the trailing comma in line 2. However, it's valid YAML and therefore parseable.",
    template: {
      "Fn::Include": "includes/broken/commawithcomment.json"
    },
    output: {"foo":"bar", "/* coment": "value */"}
  }]
}
