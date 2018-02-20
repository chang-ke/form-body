(function() {
  const {inspect} = require("util");
  const path = require("path");
  const os = require("os");
  const fs = require("fs");
  const crypto = require("crypto");
  const Busboy = require("busboy");

  function mkdirsSync(dirname) {
    if (fs.existsSync(dirname)) {
      return true;
    } else {
      if (mkdirsSync(path.dirname(dirname))) {
        fs.mkdirSync(dirname);
        return true;
      }
    }
  }

  function defaultRule(filename, index) {
    const timestamp = Date.now();
    const md5 = crypto
      .createHash("md5")
      .update(timestamp + filename + index)
      .digest("hex");
    return md5;
  }


  function getSuffixName(fileName) {
    let nameList = fileName.split(".");
    return nameList[nameList.length - 1];
  }

  module.exports = function() {
    return function formBody(options) {
      if (typeof options.ctx === "undefined" || typeof options.path === "undefined") {
        const ctxError = options.ctx === undefined ? "ctx" : "";
        const pathError = options.path === undefined ? "path" : "";
        throw new Error(`${ctxError} ${pathError} is required`);
        return new Promise((resolve, reject) => {
          reject(`${ctxError} ${pathError} is required`);
        });
      }
      const req = options.ctx.req;
      const res = options.ctx.res;
      const busboy = new Busboy({headers: req.headers});
      let index = 0;

      let dir = options.dir || "/";
      let filePath = path.join(options.path, dir);
      let mkdirResult = mkdirsSync(filePath);
      const result = [];
      return new Promise((resolve, reject) => {

        busboy.on("file", function(fieldname, file, filename, encoding, mimetype) {
          let {rule} = options;
          let fileName = fieldname;
          index += 1;
          if (typeof rule === "function") {
            if (!rule()) {
              fileName = `${defaultRule(fieldname, index)}.${getSuffixName(filename)}`;
            } else {
              fileName = `${rule(fieldname, index)}.${getSuffixName(filename)}`;
            }
          }
          let saveTo = path.join(filePath, fileName);

          file.pipe(fs.createWriteStream(saveTo));

          file.on("end", function() {
            result.push({
              success: true,
              file: {
                name: fileName,
                path: saveTo
              }
            });
          });
        });


        busboy.on("finish", function() {
          resolve(result);
        });


        busboy.on("error", function(err) {
          reject(result);
        });
        return req.pipe(busboy);
      });
    };
  };
})();