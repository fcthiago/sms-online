const bodyParser = require('body-parser');
const accessLog = require('morgan');
const express = require('express');

module.exports = class ExpressWebServer {
    constructor ({ routerConfigurator, middlewareConfigurator, logger, application }) {
        this.application = application;
        this.logger = logger;
        this.routerConfigurator = routerConfigurator;
        this.middlewareConfigurator = middlewareConfigurator;
        this.express = express();
        this.server = null;
    }

    async start (container) {
        this.express.use(accessLog('dev'));
        this.express.use(bodyParser.json());

        const { server } = this.application;
        this.middlewareConfigurator.configure(this.express, container);
        this.routerConfigurator.configure(this.express, container);
        this.server = this.express.listen(server.port, () => {
            this.logger.info(`Express WebServer initialized in port: ${server.port}`);
        });
    }

    async shutdown() {
        this.logger.info(`Express WebServer shutdown in port: ${this.application.server.port}`);
        this.server.close();
    }
}