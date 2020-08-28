var fs = require('fs');
var path = require('path');
var crypto = require('crypto');

var download_url = 'http://www.angusj.com/resourcehacker/resource_hacker.zip';
var zip_hash = '7c46c1e9ef2d2e8d69d9962ed75a1938c62403dd8508e03d48a8daad5dda01bca0afcb4464e546f293c046e1d8bb42e54e393517b23ac16074ad35fa69fbe6a3';
var dir_path = path.join(__dirname,'../bin/');
var zip_path = path.join(__dirname,'../bin/resource_hacker.zip');
var bin_path = path.join(__dirname,'../bin/ResourceHacker.exe');

if(!fs.existsSync(dir_path)){
	fs.mkdirSync(dir_path);
}

if(fs.existsSync(bin_path)) {
	return;
}

var http = require('http');
http.globalAgent = require("caw")(process.env.npm_config_proxy || process.env.http_proxy || process.env.HTTP_PROXY);
var AdmZip = require('adm-zip');

console.log('Downloading ResourceHacker by Angus Johnson...')
var file = fs.createWriteStream(zip_path);
var request = http.get(download_url, function(response) {
	response.pipe(file);
	file.on('finish', function() {
		file.close(function(err){
			// Verify file using hash make MITM harder
			var fstream = fs.createReadStream(zip_path);
			var hash = crypto.createHash('sha512');
			hash.setEncoding('hex');
			console.log('Download complete');
			console.log('Starting integrity check...');

			fstream.on('end', function() {
				hash.end();
				calculated_hash = hash.read();
				if (zip_hash === calculated_hash){
					var zip	= new AdmZip(zip_path);
					zip.extractAllTo(dir_path, true);
					console.log("Extraction complete")
					process.exit(0);
				}else{
					console.log(`File verification failed:\nDownloaded file sha512: ${calculated_hash}`);
				}
			});

			fstream.pipe(hash);

		});
	});
}).on('error', function(err) { // Handle errors
	fs.unlink(zip_path);
	console.error(err.message);
	process.exit(-1);
});
