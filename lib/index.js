(function() {
  const { inspect } = require("util");
  const path = require("path");
  const os = require("os");
  const fs = require("fs");
  const crypto = require("crypto");
  const Busboy = require("busboy");

  /**
   * 同步创建文件目录
   * @param  {string} dirname 目录绝对地址
   * @return {boolean}        创建目录结果
   */
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
  /**
   * 默认文件命名规则
   * @param {any} filename 自定义字符串
   * @returns {string} md5字符串
   */
  function defaultRule(filename, index) {
    const timestamp = Date.now();
    const md5 = crypto
      .createHash("md5")
      .update(timestamp + filename + index)
      .digest("hex");
    return md5;
  }

  /**
   * 获取上传文件的后缀名
   * @param  {string} fileName 获取上传文件的后缀名
   * @return {string}          文件后缀名
   */
  function getSuffixName(fileName, mimeType) {
    let nameList = fileName.split(".");
    return fileName === "blob" ? mimeType.split("/")[1] : nameList[nameList.length - 1];
  }

  /**
   * 上传文件
   * @param {any} options ctx koa上下文
   * @returns {promise}
   */
  module.exports = function() {
    return function formBody(options) {
      if (typeof options.ctx === "undefined" || typeof options.path === "undefined") {
        const ctxError = options.ctx === undefined ? "ctx" : "";
        const pathError = options.path === undefined ? "path" : "";
        throw new ReferenceError(`${ctxError} ${pathError} is not defined`);
        return Promise.reject(`${ctxError} ${pathError} is not defined`);
      }
      const req = options.ctx.req;
      const res = options.ctx.res;
      const busboy = new Busboy({ headers: req.headers });
      let index = 0;
      // 获取类型
      let dir = options.dir || "/";
      let filePath = path.join(options.path, dir);
      let mkdirResult = mkdirsSync(filePath);
      const result = [];
      return new Promise((resolve, reject) => {
        // 解析请求文件事件
        busboy.on("file", function(fieldname, file, filename, encoding, mimetype) {
          let { nameRule } = options;
          let fileName = fieldname;
          index += 1;
          if (typeof nameRule === "function") {
            if (!nameRule()) {
              fileName = `${defaultRule(fieldname, index)}.${getSuffixName(filename, mimetype)}`;
            } else {
              fileName = `${nameRule(fieldname, index)}.${getSuffixName(filename, mimetype)}`;
            }
          }
          let saveTo = path.join(filePath, fileName);
          // 文件保存到制定路径
          file.pipe(fs.createWriteStream(saveTo));
          // 单个文件写入事件结束
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

        // 全部解析结束事件
        busboy.on("finish", function() {
          resolve(result);
        });

        // 解析错误事件
        busboy.on("error", function(err) {
          reject(result);
        });
        return req.pipe(busboy);
      });
    };
  };
})();
