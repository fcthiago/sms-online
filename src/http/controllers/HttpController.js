module.exports = class HttpController {

    constructor ({ logger, router }) {
        this.logger = logger;
        this.router = router;
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
                    "message": "Testando o pipeline",
                    "company": "My Company LTDA",
                    "address": "Rua do infinito e alem"
                }).end()
            } catch (error) {
                next(error)
            }
        }
    }
}