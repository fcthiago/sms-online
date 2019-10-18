const { listModules } = require('awilix');

module.exports = class RouterConfigurator {
    constructor ({ application }) {
        this.modules = application.node_boot.modules;
    }

    configure (express, container) {

    }

}
