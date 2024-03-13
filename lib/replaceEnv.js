const passThrough = (template) => template
const replaceProcessEnv = (template) => replaceEnv(template, process.env, false)

const replaceEnv = (template, inject = {}, doEnv) => {
  processTemplate = doEnv ? replaceProcessEnv : passThrough;

  if (!template || typeof template !== "string") {
    // return template;
    return processTemplate(template)
  };

  const keys = Object.keys(inject);

  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    let val = inject[key];

    template = template
      .replace(new RegExp(`\\$${key}`, "g"), val)
      .replace(new RegExp(`\\$\{${key}}`, "g"), val);
  }

  // return template;
  return processTemplate(template);
}

const IsRegExVar = (str) =>  /\$\w+/.test(str) || /\$\{\w+\}/.test(str)

replaceEnv.IsRegExVar = IsRegExVar; // hack to be backward compat

module.exports = replaceEnv;
