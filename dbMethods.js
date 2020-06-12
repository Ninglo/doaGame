var assert = require('assert')

exports.insertDocuments = function (db, body, callback) {
    const collection = db.collection('documents')
    collection.insertMany([
        body
    ], function (err, result) {
        assert.equal(err, null)
        console.log(`Inserted ${result.ops.length} documents into the collection`)
        callback(result)
    })
}

exports.findDocuments = function (db, callback) {
    const collection = db.collection('documents')
    collection.find({}).toArray((err, docs) => {
        assert.equal(err, null)
        console.log('Found the following records')
        callback(docs)
    })
}

