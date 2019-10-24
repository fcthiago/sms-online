const { createContainer, asClass, asValue, Lifetime } = require('awilix');
const application = require('./Application');

module.exports = class NodeBoot {

    constructor(initParams) {
        this.container = createContainer();
        this.appConfig = Object.assign(application, initParams);
        this.server = null;
    }

    start() {
        const { node_boot } = this.appConfig;

        try {
            this.appConfig = Object.assign(this.appConfig, require('../' + node_boot.application_path));
        } catch (e) {}

        let modules = [ 'node-boot/**/*.js' ].concat(Object.values(node_boot.modules));

        this.container.loadModules(modules,
            {
                formatName: 'camelCase',
                resolverOptions: {
                    lifetime: Lifetime.SINGLETON
                }
            }
        );

        this.container.register({
            application: asValue(this.appConfig)
        });

        //Logging config
        const logger = this.container.resolve('logger');
        logger.level = application.logging.level;

        this.server = this.container.resolve('expressWebServer');
        this.server.start(this.container);
    }

    shutdown() {
        this.server.shutdown();
    }

    configuration() {
        return this.appConfig;
    }
};