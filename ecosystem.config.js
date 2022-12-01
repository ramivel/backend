module.exports = {
  apps : [{
    name: "monitoreo",
    script: "server/server.js",
    instances: 10,
	exec_mode: 'cluster'
  }]
}
