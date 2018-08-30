var express = require('express');
var router = express.Router();

/* GET home page. */
/*router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});*/

router.get('/', (req, res) => {
  if (req.session.token) {
      res.cookie('token', req.session.token);
      res.json({
          status: 'session cookie set'
      });
  } else {
      res.cookie('token', '')
      res.json({
          status: 'session cookie not set'
      });
  }
});

module.exports = router;
