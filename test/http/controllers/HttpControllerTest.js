const NodeBoot = require('../../../node-boot');
const { assert } = require('chai');
const request = require('supertest');

const nodeboot = new NodeBoot();

const url = "http://localhost:" + nodeboot.configuration().server.port;

describe('GET /', function() {
    before(function () {
        nodeboot.start();
    });

    after(function() {
        nodeboot.shutdown();
    });

    it('Get Home.', function(done) {
        request(url)
            .get('/')
            .expect('Content-Type', /json/)
            .expect(200)
            .end((err, response) => {
                if (err) return done(err);

                const doc = response.body;
                assert.equal(doc.status_code, 200);
                assert.equal(doc.version, "1.0.0");
                assert.equal(doc.message, "Testando o pipeline");

                return done();
            });
    });
});

