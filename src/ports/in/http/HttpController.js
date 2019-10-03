const { Router } = require('express');

module.exports = class HttpController {
    constructor ({ logger }) {
        this.logger = logger
    }

    get router () {
        const router = Router()
        router.get('/', this.home())
        return router
    }

    home () {
        return async (request, response, next) => {
            try {
                response.json({
                    "status_code": 200,
                    "message": "Bem vindo a home!!"
                }).end()
            } catch (error) {
                next(error)
            }
        }
    }

}
