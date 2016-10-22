const cmd = require('node-cmd');
const fs = require('fs');
const path = require('path');

var switchbox = require("switchbox");


var parsePathArray = function(paths) {
    var parsed = {};
    for(var i = 0; i < paths.length; i++) {
        var position = parsed;
        var split = paths[i].relativepath.split('/');
        var size = paths[i].size;
        for(var j = 0; j < split.length; j++) {
            if(split[j] !== "") {
                if(typeof position[split[j]] === 'undefined'){
                  position[split[j]] = Object.assign({},paths[i],{size:0});
                }
                position = position[split[j]];
                position.size+=size;
            }
        }
    }
    return parsed;
}


exports.base = (req, res) => {

  if ( ! req.query.username || ! req.query.repo) {
    res.json({'error': 'username or repo field is empty'});
    return;
  }
  var url = 'git clone https://rickyhan:123@github.com/' + req.query.username+"/"+req.query.repo+ ".git";
  var dir = "/root/clones/" + req.query.username + "_" + req.query.repo;

  Promise.resolve(cmd.run(url + " " + dir)).then(function() {
    cmd.get(
      "for file in `find "+dir+" -not -path '*/\.*'`; do if file \"$file\" | grep -q ASCII; then echo $file; fi; done",
      function(data) {
        var lines = data.split('\n').filter((r)=>(r!=""));
        var ret = [];
        for (var i = lines.length - 1; i >= 0; i--) {
          var filename = lines[i];

          var relativepath = filename.match(/(\/root\/clones\/.+?\/)(.+)/)[2];

          var content = fs.readFileSync(filename, 'utf8');
          var ext = path.extname(filename);
          var file = {
        	  size: content.length,
            relativepath: relativepath,
            filename: path.basename(filename),
            extension: ext,
            content: content,
            // moc: switchbox.finder(ext)(content),
          };

          ret.push(file);
        }

        res.json(parsePathArray(ret));
      }
    );
  })

};
