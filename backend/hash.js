// hash.js
const bcrypt = require('bcryptjs');
const password = 'your_plain_password'; // Replace with actual password (e.g., admin123)

bcrypt.hash(password, 10).then(hash => {
    console.log('Hashed password:', hash);
});
