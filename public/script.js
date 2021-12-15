document.getElementById('testForm2').addEventListener('submit', e => {
  e.preventDefault();
  const stock = e.target[0].value;
  const checkbox = e.target[1].checked;
  fetch(`/api/stock-prices/?stock=${stock}&like=${checkbox}`)
    .then(res => res.json())
    .then(data => {
      // document.getElementById('jsonResult').innerText = JSON.stringify(data);
      document.getElementById('jsonResult').innerText = `{\n    stockData:{\n\tstock: ${data.stockData.stock},\n\tprice: ${data.stockData.price},\n\tlikes: ${data.stockData.likes}\n    }\n}`;
    });
});

document.getElementById('testForm').addEventListener('submit', e => {
  e.preventDefault();
  const stock1 = e.target[0].value;
  const stock2 = e.target[1].value;
  const checkbox = e.target[2].checked;
  fetch(`/api/stock-prices?stock=${stock1}&stock=${stock2}&like=${checkbox}`)
    .then(res => res.json())
    .then(data => {
      document.getElementById('jsonResult').innerText = JSON.stringify(data);
      document.getElementById('jsonResult').innerText = `{\n    stockData:[\n\t{\n\t    stock: ${data.stockData[0].stock},\n\t    price: ${data.stockData[0].price},\n\t    rel_likes: ${data.stockData[0].rel_likes}\n\t},\n\t{\n\t    stock: ${data.stockData[1].stock},\n\t    price: ${data.stockData[1].price},\n\t    rel_likes: ${data.stockData[1].rel_likes}\n\t}\n    ]\n}`;
    });
});
