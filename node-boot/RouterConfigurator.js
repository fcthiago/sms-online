const bodyParser = require('body-parser');
const accessLog = require('morgan');

module.exports = class RouterConfigurator {
    constructor ({ httpController }) {
        this.httpController = httpController
    }

    configure (express) {
        express.use(accessLog('dev'));
        express.use(bodyParser.json());
        express.use(this.httpController.router);
    }
}
