// /tmp/react-dom/client.js
import * as m from "react-dom";
var __commonJS = (cb, mod) => () => (mod || cb((mod = { exports: {} }).exports, mod), mod.exports);
var require_client = __commonJS((exports) => {
  if (false) {
  } else {
    i = m.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED;
    exports.createRoot = function(c, o) {
      i.usingClientEntryPoint = true;
      try {
        return m.createRoot(c, o);
      } finally {
        i.usingClientEntryPoint = false;
      }
    };
    exports.hydrateRoot = function(c, h, o) {
      i.usingClientEntryPoint = true;
      try {
        return m.hydrateRoot(c, h, o);
      } finally {
        i.usingClientEntryPoint = false;
      }
    };
  }
  var i;
});
var client_default = require_client();

// /tmp/react-dom/client.shell.js
var { createRoot: createRoot2, hydrateRoot: hydrateRoot2 } = client_default;
var client_shell_default = client_default;
export {
  hydrateRoot2 as hydrateRoot,
  client_shell_default as default,
  createRoot2 as createRoot
};
