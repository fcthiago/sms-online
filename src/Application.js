module.exports = {
    server: {
        port: process.env.PORT || 5000
    },
    amqp:{
        verbose: true,
        rabbitmq: {
            connection_string: "amqp://localhost",
            bindings: [
                {
                    exchange : {
                        name : "x-message-created",
                        type: "fanout",
                        options: {
                            durable: true,
                        },
                    },
                    queues : [
                        {
                            name: "x-message-created.q-message-created",
                            routingKey: "created",
                            options: {
                                durable: true,
                            },
                        },
                    ]
                },
            ]
        },
        azure_service_bus: {
            connection_string: "Endpoint=sb://projetosms.servicebus.windows.net/;SharedAccessKeyName=RootManageSharedAccessKey;SharedAccessKey=d6JFIjnSx7f7mX5lLax1rha4cbrUg2rAmRGjqGvQ22k=",
            bindings: [
                {
                    topic : {
                        name : "x-message-created",
                        options: {
                        },
                    },
                    subscriptions : [
                        {
                            name: "x-message-created.q-message-created",
                            routingKey: "created",
                            options: {
                            },
                        },
                    ]
                }
            ]
        }
    }
};