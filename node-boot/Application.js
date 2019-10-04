module.exports = {
    server: {
        port: process.env.PORT || 3000
    },
    logging: {
        level: process.env.LOGGING_LEVEL || "debug"
    },
    node_boot: {
        modules: {
            controller: "src/http/controllers/**/*.js"
        },
        application_path: "src/Application.js"
    }
}