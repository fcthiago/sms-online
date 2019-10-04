const express = require('express');

module.exports = class ExpressWebServer {
    constructor ({ routerConfigurator, logger, application }) {
        this.application = application;
        this.logger = logger;
        this.routerConfigurator = routerConfigurator;
        this.express = express();
    }

    async start (container) {
        const { server } = this.application;
        this.routerConfigurator.configure(this.express, container);
        this.express.listen(server.port, () => {
            this.logger.info(`Express WebServer initialized with port: ${server.port}`);
        })
    }
}