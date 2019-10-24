module.exports = {
    server: {
        port: process.env.PORT || 3000
    },
    logging: {
        level: process.env.LOGGING_LEVEL || "debug"
    },
    node_boot: {
        modules: {
            controllers: "src/http/controllers/**/*.js",
            middlewares: "src/http/middlewares/**/*.js"
        },
        application_path: "src/Application.js"
    },
    constants: {
        EXCHANGE_MESSAGE_CREATED: "x-message-created",
        QUEUE_MESSAGE_CREATED : "x-message-created.q-message-created",
    },
    // amqpProvider: "RabbitMQ",
    amqp: {
        provider: "AzureServiceBus",
        connectionString: "Endpoint=sb://projetosms.servicebus.windows.net/;SharedAccessKeyName=RootManageSharedAccessKey;SharedAccessKey=d6JFIjnSx7f7mX5lLax1rha4cbrUg2rAmRGjqGvQ22k=",
    },
    bindDebug: true,
    binds:[
            {
                exchange : {
                    name : "EXCHANGE_MESSAGE_CREATED",
                    type: "fanout",
                    options: {
                        durable: true,
                    },
                },
                queues : [
                    {
                        name: "QUEUE_MESSAGE_CREATED",
                        options: {
                            durable: true,
                        },
                    },
                ]
            },
    ]
}