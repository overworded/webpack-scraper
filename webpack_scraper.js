let webpackChunk = webpackChunkdiscord_app // replace with wherever your webpack chunk is
let webpackRequire = webpackChunk.push([[Symbol()], {}, r => r]);
webpackChunk.pop();
let webpackModules = Object.values(webpackRequire.c);
const builtinPrototypes = new Set([
  Object, Function, String, Number, Boolean, Array,
  Map, Set, WeakMap, WeakSet, Date, RegExp, Error,
  Promise, Symbol, BigInt
].map(x => x.prototype));
let results = [];

for (let module of webpackModules) {
  if (!module?.exports) {
    continue;
  }

  let moduleData = {
    id: module.id,
    exports: []
  };

  for (let [key, exportedValue] of Object.entries(module.exports)) {
    if (exportedValue == null || !isNaN(key)) {
      continue;
    }

    let proto = Object.getPrototypeOf(exportedValue);
    // ignore built-in javascript prototypes
    if (!proto || builtinPrototypes.has(proto)) {
      continue;
    }

    let functions = Object.getOwnPropertyNames(proto)
      .filter(name => {
        let descriptor = Object.getOwnPropertyDescriptor(proto, name);
        return typeof descriptor?.value === "function" && name !== "constructor";
      });

    if (functions.length == 0) {
      continue;
    }

    moduleData.exports.push({
      key: key,
      proto: functions
    });
  }

  if (moduleData.exports.length > 0) {
    results.push(moduleData);
  }
}

const text = results
  .map(module => {
    let output = ""
    output += `${"=".repeat(10)}[ MODULE ${module.id} ]${"=".repeat(10)}\n`;
    for (const exp of module.exports) {
      output += `EXPORT: ${exp.key}\n`;
      for (const method of exp.proto) {
        output += `   ${method}\n`;
      }
    }
    return output;
  })
.join("\n");

const blob = new Blob([text], { type: "text/plain" });
const url = URL.createObjectURL(blob);

Object.assign(document.createElement("a"), {
  href: url,
  download: "webpack-prototypes.txt"
}).click();

URL.revokeObjectURL(url);
