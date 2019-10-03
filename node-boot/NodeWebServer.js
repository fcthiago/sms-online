const express = require('express');

module.exports = class Server {
    constructor ({ routerConfigurator, logger, application }) {
        this.application = application;
        this.logger = logger;
        this.routerConfigurator = routerConfigurator
        this.express = express()
    }

    async start () {
        const { server } = this.application
        this.routerConfigurator.configure(this.express)
        this.express.listen(server.port, () => {
            this.logger.info(`Server initialized with port: ${server.port}`)
        })
    }
}