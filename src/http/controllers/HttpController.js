module.exports = class HttpController {

    constructor ({ logger, router, rabbitMqAmqpProvider }) {
        this.logger = logger;
        this.router = router;
        this.rabbitMQAmqpProvider = rabbitMqAmqpProvider;
    }

    get route () {
        this.router.get('/', this.home());
        return this.router;
    }

    home () {
        return async (request, response, next) => {
            try {
                response.json({
                    "status_code": 200,
                    "message": "Bem vindo ao treinamento!!"
                }).end()
            } catch (error) {
                next(error)
            }
        }
    }
}