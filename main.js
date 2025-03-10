'use strict';
const Hapi = require('@hapi/hapi');

if ( global.v8debug) {
	global.v8debug.Debug.setBreakOnException(); // enable it, global.v8debug is only defined when the --debug or --debug-brk flag is set
}

async function start()
{
	var app = require('./js/application.js');
	const server = new Hapi.Server({ port: 3000});

  server.application_ = app;

  await server.register(require('@hapi/inert'));

  // set up static routes

	server.route({
      method: 'GET',
      path: '/',
      handler: function (request, h) {
          return h.file('public/index-edit.html');
      }
  });

	server.route({
			method: 'GET',
			path: '/{file*}',
			handler: {
					directory: {
							path: 'public'
					}
			}
	});

	server.route({
			method: 'GET',
			path: '/grammar.txt',
			handler: function (request, h) {
					return h.file('grammar.txt');
			}
	});


  // route command url to the parser

  server.route({
      method: 'GET',
      path: '/command',
      handler: function (request, reply) {
          var input = request.url.searchParams.get('command');
          var response;
          try {
              var result = request.server.application_.parse(input);
              response = { reply: result};
          }
          catch(err)
          {
              console.log(err);
              console.log(err.stack);
              response = { reply: "*error*: " + err.message };
          }
          return(response);
      }
  });
	await server.start();
	console.log('Server running at:', server.info.uri);
}

start();
