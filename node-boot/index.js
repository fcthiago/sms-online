const { createContainer, asClass, asValue, Lifetime } = require('awilix');
const application = require('../src/Application');

module.exports = class NodeBoot {

    constructor() {
        this.container = createContainer();
    }

    start() {
        this.container.loadModules([
                'node-boot/**/*.js',
                'src/**/*.js',
            ],
            {
                formatName: 'camelCase',
                resolverOptions: {
                    lifetime: Lifetime.SINGLETON,
                    register: asClass
                }
            }
        );

        this.container.register({
            application: asValue(application)
        });

        //Logging config
        const logger = this.container.resolve('logger');
        logger.level = application.logging.level;

        this.container.resolve('nodeWebServer').start();
    }
};