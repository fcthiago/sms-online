module.exports = class Subscription {

    constructor ({ logger, router, application }) {
        this.logger = logger;
        this.router = router;
        this.application = application;
    }

    get route () {
        this.router.get('/clients', this.home());
        return this.router;
    }

    home () {
        return async (request, response, next) => {
            try {
                response.json({
                    "status_code": 200,
                    "clients": "teste"
                }).end()
            } catch (error) {
                next(error)
            }
        }
    }
}