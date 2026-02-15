const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

async function testAPI() {
  const form = new FormData();

  form.append('image_blob', fs.createReadStream(path.join(__dirname, 'package.json')), 'test.jpg');
  form.append('box_coordinates', '[10,20,30,40]');
  form.append('timestamp', Date.now().toString());
  form.append('label', 'tree');
  form.append('latitude', '10.7769');
  form.append('longitude', '106.7009');

  const response = await fetch('http://localhost:3000/api/v1/detect-tree', {
    method: 'POST',
    body: form,
    headers: form.getHeaders()
  });

  const result = await response.json();
  console.log('Response:', result);
}

testAPI().catch(console.error);
