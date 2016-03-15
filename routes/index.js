var router = new require("koa-router")();

/* GET home page. */
router.get('/', function *(next) {
  this.render('index', { title: 'Home' });
});

module.exports = router;
