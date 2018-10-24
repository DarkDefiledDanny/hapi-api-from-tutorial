/* @flow */
const fs = require("fs");

server.route({
    method: "POST",
    path: "/uploads/Uploader",
    config: {
        payload: {
            output: "stream",
            parse: true,
            allow: "multipart/form-data",
            maxBytes: 2 * 1000 * 1000
        }
    },
   // handler: (request, response) => {
       // var result = [];
      //  for(var i = 0; i < request.payload["file"].length; i++) {
       //     result.push(request.payload["file"][i].hapi);
       //     request.payload["file"][i].pipe(fs.createWriteStream(__dirname + "/uploads/" + request.payload["file"][i].hapi.filename))
      //  }
      //  return result;
   // },
    handler: function (request, reply) {
        var path = __dirname + "/uploads/" + name;
        var file = fs.createWriteStream(path);

        var data = request.payload;
        var name = data.photo.hapi.filename

    }

});