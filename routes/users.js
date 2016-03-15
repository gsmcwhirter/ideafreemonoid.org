var router = new require("koa-router")();

/* GET home page. */
router.get('/', function *(next) {
  res.render('index', { title: 'Home' });
});

module.exports = router;
