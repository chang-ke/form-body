
# form-body
Parse `multipart` for koa2 with Promise, based on busboy  [github](https://github.com/danmin25/form-body)<br>
**support for formData and blob(image)**

## Installation

```bash
$ npm install form-body
```

## Example
```
const FormBody = require("form-body");
const formBody = new FormBody()
const result = await formBody({
  ctx: ctx,
  path: path.join(__dirname, "../static"),
  dir: "/",
  rule: function() {
    return false;
  }
});
console.log(result); //[{ success: true,
                     //    file:{ 
                     //    name:'effffc74854cf92042b78bad9bec1c77.png',
                     //    path:'E:\\Node\\koa\\static\\effffc74854cf92042b78bad9bec1c77.png' }
                     //  }]
```
## Params

* `ctx` koa上下文 ( koa context )
* `dir` 文件存储文件夹名称, 默认使用当前文件夹, 如果文件夹不存在则会自动创建 ( directory's name, if it's not exits, it will be created ) `default: '/'`
* `rule` 文件命名规则, 如果不存在则会使用如下默认规则 ( the rule for file's name, if it's not exits, it will be use the follow function )
```
function defaultRule(filename, index) {
    const timestamp = Date.now();
    const md5 = crypto
      .createHash("md5")
      .update(timestamp + filename + index)
      .digest("hex");
    return md5;
}
```
如果你不想给文件重新命名。可以使用 ( if you don want to rename the files, you can use follow function )
```
function() { 
  return false
}
```
* `path` 文件储存路径 ( the path to save files )

# License

  MIT