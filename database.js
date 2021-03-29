var mysql = require('mysql');

const connect = mysql.createConnection({
    host:"localhost",
    user: "root",
    password:"milansql",
    database:"electrondb",
});
connect.connect((err)=>{
    if(err) throw err;
    console.log(connect.state);
})

module.exports = connect;