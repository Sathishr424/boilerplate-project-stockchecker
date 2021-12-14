'use strict';

const mongoose = require('mongoose');
mongoose.connect(process.env.DB, { useNewUrlParser: true, useUnifiedTopology: true });

const bcrypt = require('bcrypt');
const request = require('request');

function hashIP(ip){
  return new Promise(async function(resolve){
    var hash = await bcrypt.hash(ip, 10);
    resolve(hash);
  })
}

function compareHashIP(ip, hIp){
  return new Promise(async function(resolve){
    var match = await bcrypt.compareSync(ip, hIp);
    resolve(match);
  })
}

const stock = new mongoose.Schema({
  stock: String,
  price: mongoose.Schema.Types.Decimal128,
  likes: Number,
  ip: [String]
});

let Stock = new mongoose.model('Stock', stock);

function getStockPrice(stock){
  return new Promise(resolve=>{
    request({
      url: "https://stock-price-checker-proxy.freecodecamp.rocks/v1/stock/"+stock+"/quote",
      json: true,
      }, (err,res,data)=>{
      if (!err && res.statusCode == 200) resolve(data.latestPrice);
    });
  });
}

function checkIPInStock(ip, ips){
  return new Promise(async function(resolve){
    for (var i in ips){
      var there = await compareHashIP(ip, ips[i]);
      if (there) resolve(!there)
    }resolve(true);
  })
}

function getStockFromDB(stockName, like, price, ip){
  console.log(stockName, like, price, ip);
  return new Promise(function(resolve){Stock.findOne({stock: stockName}, async function(err,data){
      if (data) {
        var isIpThere = await checkIPInStock(ip, data.ip);
        console.log("Like:",like, isIpThere);
        if (like && isIpThere){
          data.likes += 1;
          ip = await hashIP(ip);
          data.ip.push(ip);
          data.markModified('likes');
          data.markModified('ip');
          await data.save((e,d)=>{
            if (e) {resolve({stock: data.stock, price: price, likes: data.likes}); console.log("Cant save like in stock: " + stockName);
            }else resolve({stock: data.stock, price: price, likes: data.likes});
          });
        }else resolve({stock: data.stock, price: price, likes: data.likes});
      }
      else {
        ip = await hashIP(ip);
        Stock.create({stock:stockName, price:price, likes: like ? 1 : 0, ip:like ? [ip] : []}, (e,d)=>{
          if (d) resolve({stock: d.stock, price: price, likes: d.like});
          else {console.log(e);}
        });
      }
    })
  })
}

module.exports = function (app) {

  app.route('/api/stock-prices')
    .get(async function (req, res){
      var stock = req.query.stock;
      var like = req.query.like == 'false' ? false : true;
      console.log(req.query);
      if (stock){
          if (Array.isArray(stock)){
            stock = [stock[0].toUpperCase(), stock[1].toUpperCase()];
            var p1 = await getStockPrice(stock[0]);
            var p2 = await getStockPrice(stock[0]);
            var prices = [p1,p2]
            var s1 = await getStockFromDB(stock[0], like, prices[0], req.ip.toString())
            var s2 = await getStockFromDB(stock[1], like, prices[1], req.ip.toString())
            var stocks = [s1,s2];
            res.send({
              stockData: [
                {stock: stocks[0].stock, price: stocks[0].price, rel_likes: stocks[0].likes - stocks[1].likes},
                {stock: stocks[1].stock, price: stocks[1].price, rel_likes: stocks[1].likes - stocks[0].likes}
              ]
            })
          }else {
            stock = stock.toUpperCase();
            var price = await getStockPrice(stock);
            var stk = await getStockFromDB(stock, like, price,req.ip.toString());
            console.log("Price: ", price);
            console.log(stk);
            res.send({stockData: stk});
          };
      }
    });
};
