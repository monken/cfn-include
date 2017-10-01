var url = require('url'),
  https = require('https'),
  http = require('http');

module.exports = function(location) {
  var parsed = url.parse(location),
    proto = parsed.protocol === 'https:' ? https : http;
  
  return new Promise((resolve, reject) => proto.get(location, res => {
    if (res.statusCode > 299) return reject(new Error('HTTP request failed with status code ' + res.statusCode));
    var rawData = [];
    res.setEncoding('utf8');
    res.on('data', chunk => rawData.push(chunk));
    res.on('end', () => resolve(rawData.join(''))); 
  }).on('error', reject));
  
}