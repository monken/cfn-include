var include = require("../index"),
  assert = require("assert"),
  extendEnv = require("./tests/extendEnv"),
  fs = require("fs"),
  exec = require("child_process").execFile;

["cli"].forEach(function (file) {
  var tests = require("./tests/" + file + ".json");
  for (var category in tests) {
    describe(category, function () {
      tests[category].forEach(function (test) {
        const fn = test.only ? it.only : it;
        fn(test.name || "include", function (done) {
          let cliArgs = test.template
            ? ["bin/cli.js", test.template]
            : ["bin/cli.js"];
          if (test.args) {
            cliArgs = cliArgs.concat(test.args);
          }
          extendEnv(test.env, () => {
            // console.log({cliArgs})
            var proc = exec("node", cliArgs, function (err, out, stderr) {
              // console.log({out});
              if (test.exitCode) {
                assert.ok(stderr.match(new RegExp(test.errorMessage)));
                assert.equal(test.exitCode, err.code);
                return done();
              }
              var json = JSON.parse(out.toString());
              delete json.Metadata;
              assert.deepEqual(json, test.output);
              done();
            });
            if (test.stdin) {
              proc.stdin.write(test.stdin);
              proc.stdin.end();
            }
          });
        });
      });
    });
  }
});
