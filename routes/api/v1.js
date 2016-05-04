var router = new require("koa-router")();
var genify = require("thunkify-wrap").genify;

/* GET home page. */
router.get('/sidebar-info', function *(next) {
  console.log(this.app);
  var data = yield* genify(this.app.db.getSidebarInfo);
  console.log(data);
  this.body = {};
});

module.exports = router;
