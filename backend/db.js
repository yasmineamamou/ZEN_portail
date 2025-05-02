const sql = require('mssql');

const dbConfig = {
    user: 'my_db_user',
    password: 'yasmineamamou',
    server: 'localhost',
    database: 'zen_portail1',
    options: {
        encrypt: false,
        trustServerCertificate: true
    }
};

const poolPromise = new sql.ConnectionPool(dbConfig)
    .connect()
    .then(pool => {
        console.log('✅ Connected to SQL Server');
        return pool;
    })
    .catch(err => {
        console.error('❌ Database connection failed:', err.message);
    });

module.exports = {
    sql,
    poolPromise
};
