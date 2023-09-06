const { MongoClient, ObjectId } = require('mongodb'); // Se eliminó la importación innecesaria de ObjectId
const mongoClient = new MongoClient(process.env.DB);
let conversationsCollection;
let vehiclesCollection;
let driversCollection;
let companiesCollection;
let reportsCollection;

mongoClient
    .connect()
    .then(() => {
        console.log('Connected to MongoDB');
        const db = mongoClient.db('driport');
        conversationsCollection = db.collection('conversations');
        vehiclesCollection = db.collection('vehicles');
        driversCollection = db.collection('drivers');
        companiesCollection = db.collection('companies');
        reportsCollection = db.collection('reports');
    })
    .catch((error) => {
        console.error('Error connecting to MongoDB:', error);
        process.exit(1);
    });

module.exports = {
    mongoClient,
    conversationsCollection,
    vehiclesCollection,
    driversCollection,
    companiesCollection,
    reportsCollection,
};
