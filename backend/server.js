require('dotenv').config();
const express = require('express');
const sql = require('mssql');
const cors = require('cors');
const multer = require('multer');
const path = require('path'); // ✅ Add this line
const port = 3000; // ✅ Define the port number
const fs = require('fs');
const app = express();
const http = require('http');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const pdf = require('pdf-poppler');
const { exec } = require('child_process');
var formidable = require('formidable');
const router = express.Router(); // ✅ Define router before using it
app.use(cors());
const secretKey = 'yourSecretKey';

app.use(bodyParser.json());
const JWT_SECRET = 'your_jwt_secret_key_here'; // Keep this secret and safe
// app.use(express.urlencoded({ extended: true })); // Middleware for form data
app.use('/uploads', express.static('uploads'));
// Ensure "uploads/" directory exists
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

// ✅ Define dbConfig properly
const dbConfig = {
    user: process.env.DB_USER || 'my_db_user',
    password: process.env.DB_PASSWORD || 'yasmineamamou',
    server: process.env.DB_SERVER || 'localhost',
    database: process.env.DB_NAME || 'zen_portail1',
    options: {
        encrypt: true,
        enableArithAbort: true,
        trustServerCertificate: true
    },
    port: 1433 // Ensure SQL Server is running on this port
};
const pool = new sql.ConnectionPool(dbConfig);
const poolConnect = pool.connect();
sql.connect(dbConfig)
    .then(() => console.log('Connected to SQL Server'))
    .catch(err => console.error('Database connection failed', err));


function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.sendStatus(401); // No token

    jwt.verify(token, secretKey, (err, user) => {
        if (err) return res.sendStatus(403); // Invalid token
        req.user = user; // Attach decoded user
        next();
    });
}
function authorizeRoles(...allowedRoles) {
    return (req, res, next) => {
        if (!req.user || !allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ message: 'Access denied: insufficient permissions' });
        }
        next();
    };
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/'); // Save files in 'uploads' folder
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname)); // Rename file with timestamp
    }
});
// Start Server
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max size
    fileFilter: function (req, file, cb) {
        if (file.mimetype !== 'application/pdf') {
            return cb(new Error('Only PDF files are allowed!'), false);
        }
        cb(null, true);
    }
});

app.post('/login', async (req, res) => {
    try {
        await poolConnect;
        const { email, password } = req.body;
        console.log("📩 Email received:", email);
        console.log("🔑 Password received:", password);

        const request = pool.request();
        request.input('email', sql.NVarChar, email);
        const result = await request.query(`SELECT * FROM users WHERE email = @email AND status = 1`);

        if (!result.recordset || result.recordset.length === 0) {
            console.log("❌ No user found");
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const user = result.recordset[0];
        console.log("✅ User found:", user.email);
        console.log("📦 Password from DB:", user.password);

        const match = await bcrypt.compare(password, user.password);
        console.log("🔍 Password match:", match);

        if (!match) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { id: user.id, role: user.role, email: user.email },
            secretKey,
            { expiresIn: '1h' }
        );

        res.json({ token });
    } catch (err) {
        console.error("🔥 Login error:", err);
        res.status(500).json({ error: err.message });
    }
});


app.post('/api/upload-photo/:id', authenticateToken,
    authorizeRoles('admin', 'super-admin'), (req, res) => {
        const userId = req.params.id;
        if (!userId) {
            return res.status(400).json({ message: "userId ID is required" });
        }

        const form = new formidable.IncomingForm();
        form.uploadDir = path.join(__dirname, 'uploads'); // Ensure this folder exists
        form.keepExtensions = true;

        form.parse(req, async (err, fields, files) => {
            if (err) {
                return res.status(500).json({ message: 'File upload failed', error: err });
            }

            console.log("Files received:", files);

            const fileArray = files.file;
            if (!fileArray || fileArray.length === 0) {
                return res.status(400).json({ message: "No file uploaded" });
            }

            const file = fileArray[0]; // Get the uploaded file
            const originalFileName = file.originalFilename; // ✅ Keep the original name
            const fileExtension = path.extname(originalFileName); // Extract extension
            const newFileName = `${userId}_${originalFileName}`; // Use original name with ID
            const newPath = path.join(form.uploadDir, newFileName);
            const dbFilePath = `/uploads/${newFileName}`; // Store relative path in DB

            try {
                // 🔹 Get the old file path from the database
                const selectQuery = `SELECT profilePicture FROM Users WHERE id = @id`;
                const request = new sql.Request();
                request.input('id', sql.Int, userId);
                const result = await request.query(selectQuery);

                if (result.recordset.length > 0 && result.recordset[0].profilePicture) {
                    const oldFilePath = path.join(__dirname, result.recordset[0].profilePicture);
                    if (fs.existsSync(oldFilePath)) {
                        fs.unlinkSync(oldFilePath); // Delete old file
                    }
                }

                // Move the uploaded file to the correct location
                fs.rename(file.filepath, newPath, async (err) => {
                    if (err) {
                        return res.status(500).json({ message: 'Error moving file', error: err });
                    }

                    // ✅ Update the database with the original file name
                    const updateQuery = `
                    UPDATE Users 
                    SET profilePicture = @profilePicture 
                    WHERE id = @id
                `;
                    request.input('profilePicture', sql.NVarChar, dbFilePath);
                    await request.query(updateQuery);

                    res.status(200).json({
                        message: 'File uploaded and path updated successfully',
                        fileName: originalFileName, // ✅ Return the original file name
                        filePath: dbFilePath
                    });
                });

            } catch (dbErr) {
                res.status(500).json({ message: "Database update failed", error: dbErr.message });
            }
        });
    });

app.post('/api/users', authenticateToken,
    authorizeRoles('admin', 'super-admin'), async (req, res) => {
        try {
            const {
                name,
                email,
                password,
                societe_id,
                poste_id,
                departement_id,
                status,
                role
            } = req.body;

            const validRoles = ['admin', 'client', 'super-admin'];
            if (!validRoles.includes(role)) {
                return res.status(400).json({ message: 'Invalid role' });
            }

            const hashedPassword = await bcrypt.hash(password, 10); // ✅ Hash the password
            const statusBit = status === 1 ? 1 : 0;

            const request = new sql.Request();
            request.input('name', sql.NVarChar, name);
            request.input('email', sql.NVarChar, email);
            request.input('password', sql.NVarChar, hashedPassword); // ✅ Store hashed
            request.input('societe_id', sql.Int, societe_id);
            request.input('poste_id', sql.Int, poste_id);
            request.input('departement_id', sql.Int, departement_id);
            request.input('status', sql.Bit, statusBit);
            request.input('role', sql.NVarChar, role);
            request.input('date_creation', sql.DateTime, new Date());

            const query = `
            INSERT INTO Users (name, email, password, societe_id, poste_id, departement_id, status, date_creation, role)
            OUTPUT INSERTED.id
            VALUES (@name, @email, @password, @societe_id, @poste_id, @departement_id, @status, @date_creation, @role)
        `;

            const result = await request.query(query);

            if (result.recordset.length > 0) {
                res.status(201).json({ message: 'User created', userId: result.recordset[0].id });
            } else {
                res.status(500).json({ message: 'Insert failed' });
            }

        } catch (err) {
            console.error('Create user error:', err);
            res.status(500).json({ error: err.message });
        }
    });

app.post('/api/user_unite', authenticateToken,
    authorizeRoles('admin', 'super-admin'), async (req, res) => {
        const { user_id, unite_id } = req.body;

        try {
            let pool = await sql.connect(dbConfig);

            await pool.request()
                .input('user_id', sql.Int, user_id)
                .input('unite_id', sql.Int, unite_id)
                .query(`INSERT INTO user_unite (user_id, unite_id) VALUES (@user_id, @unite_id)`);

            res.status(201).json({ message: 'User linked to Unite successfully' });
        } catch (error) {
            console.error('Error linking user to Unite:', error.message);
            res.status(500).json({ message: 'Server error', error: error.message });
        }
    });
app.post('/api/user_cube', authenticateToken,
    authorizeRoles('admin', 'super-admin'), async (req, res) => {
        const { user_id, cube_id } = req.body;

        try {
            let pool = await sql.connect(dbConfig);

            await pool.request()
                .input('user_id', sql.Int, user_id)
                .input('cube_id', sql.Int, cube_id)
                .query(`INSERT INTO user_cube (user_id, cube_id) VALUES (@user_id, @cube_id)`);

            res.status(201).json({ message: 'User linked to Cube successfully' });
        } catch (error) {
            console.error('Error linking user to Cube:', error.message);
            res.status(500).json({ message: 'Server error', error: error.message });
        }
    });
app.get('/api/users',
    authenticateToken,
    authorizeRoles('admin', 'super-admin'),
    async (req, res) => {
        try {
            const pool = await sql.connect(dbConfig);
            const result = await pool.request().query(`
        SELECT
          users.id,
          users.name,
          users.email,
          users.password,
          users.date_creation,
          users.role,
          users.status,
          Departement.nom AS departement,
          Postes.nom AS postes,
          Societe.nom AS societe
        FROM users
        LEFT JOIN Departement ON users.departement_id = Departement.id
        LEFT JOIN Postes ON users.poste_id = Postes.id
        LEFT JOIN Societe ON users.societe_id = Societe.id
      `);
            res.json(result.recordset);
        } catch (err) {
            console.error('Database Error:', err);
            res.status(500).json({ error: 'Database error', details: err.message });
        }
    }
);

app.delete('/api/users/:ids', authenticateToken,
    authorizeRoles('admin', 'super-admin'), async (req, res) => {
        try {
            const userIds = req.params.ids.split(',').map(id => parseInt(id.trim())); // Convert to an array of integers
            if (userIds.some(isNaN)) {
                return res.status(400).json({ error: "Invalid user ID(s) provided." });
            }

            await sql.connect(dbConfig);
            const query = `DELETE FROM Users WHERE id IN (${userIds.join(",")})`;
            await sql.query(query);

            res.json({ message: "Users deleted successfully" });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

app.get('/api/users/:id', authenticateToken,
    authorizeRoles('admin', 'super-admin'), async (req, res) => {
        const userId = req.params.id;

        try {
            let pool = await sql.connect(dbConfig);

            // Fetch user details
            let userResult = await pool.request()
                .input('user_id', sql.Int, userId)
                .query(`
                SELECT * FROM Users WHERE id = @user_id
            `);

            if (userResult.recordset.length === 0) {
                return res.status(404).json({ message: 'User not found' });
            }

            let user = userResult.recordset[0];

            // Fetch associated Unites
            let unitesResult = await pool.request()
                .input('user_id', sql.Int, userId)
                .query(`
                SELECT u.id, u.nom, u.description 
                FROM unites u
                INNER JOIN user_unite uu ON uu.unite_id = u.id
                WHERE uu.user_id = @user_id
            `);

            let cubesResult = await pool.request()
                .input('user_id', sql.Int, userId)
                .query(`
                SELECT c.id, c.nom, c.description 
                FROM cubes c
                INNER JOIN user_cube uc ON uc.cube_id = c.id
                WHERE uc.user_id = @user_id
            `);

            user.unites = unitesResult.recordset;
            user.cubes = cubesResult.recordset;

            res.status(200).json(user);
        } catch (error) {
            console.error('Error fetching user:', error.message);
            res.status(500).json({ message: 'Server error', error: error.message });
        }
    });

app.put('/api/users/:id', authenticateToken,
    authorizeRoles('admin', 'super-admin'), async (req, res) => {
        try {
            const { id } = req.params;
            console.log("Received Update Request for User ID:", id);
            console.log("Request Body:", req.body);
            const { name, email, password, societe_id, poste_id, departement_id, status, role, unite_ids, menu_cube_ids } = req.body;

            const validRoles = ['admin', 'client', 'super-admin'];
            if (!validRoles.includes(role)) {
                return res.status(400).json({ message: 'Invalid role. Allowed values: admin, client, super-admin' });
            }

            let pool = await sql.connect(dbConfig);

            const hashedPassword = await bcrypt.hash(password, 10); // ✅ Hash the password
            const statusBit = status ? 1 : 0;

            // 🔹 **1. Update Users Table**
            await pool.request()
                .input('id', sql.Int, id)
                .input('name', sql.NVarChar, name)
                .input('email', sql.NVarChar, email)
                .input('password', sql.NVarChar, hashedPassword) // ✅ Store hashed
                .input('societe_id', sql.Int, societe_id)
                .input('poste_id', sql.Int, poste_id)
                .input('departement_id', sql.Int, departement_id)
                .input('status', sql.Bit, statusBit)
                .input('role', sql.NVarChar, role)
                .query(`
                UPDATE Users 
                SET name = @name, email = @email, password = @password, societe_id = @societe_id, 
                    poste_id = @poste_id, departement_id = @departement_id, 
                    status = @status, role = @role
                WHERE id = @id
            `);

            // 🔹 **2. Delete Old Unite Associations**
            await pool.request()
                .input('user_id', sql.Int, id)
                .query(`DELETE FROM user_unite WHERE user_id = @user_id`);

            // 🔹 **3. Insert New Unite Associations**
            if (unite_ids && unite_ids.length > 0) {
                for (let unite_id of unite_ids) {
                    await pool.request()
                        .input('user_id', sql.Int, id)
                        .input('unite_id', sql.Int, unite_id)
                        .query(`INSERT INTO user_unite (user_id, unite_id) VALUES (@user_id, @unite_id)`);
                }
            }

            // 🔹 **4. Delete Old Cube Associations**
            await pool.request()
                .input('user_id', sql.Int, id)
                .query(`DELETE FROM user_cube WHERE user_id = @user_id`);

            // 🔹 **5. Insert New Cube Associations**
            if (menu_cube_ids && menu_cube_ids.length > 0) {
                for (let cube_id of menu_cube_ids) {
                    await pool.request()
                        .input('user_id', sql.Int, id)
                        .input('cube_id', sql.Int, cube_id)
                        .query(`INSERT INTO user_cube (user_id, cube_id) VALUES (@user_id, @cube_id)`);
                }
            }

            res.json({ message: 'User and related tables updated successfully' });

        } catch (err) {
            console.error("Update Error:", err);
            res.status(500).json({ error: 'Database error', details: err.message });
        }
    });

app.get('/api/societes', async (req, res) => {
    try {
        const result = await sql.query('SELECT * FROM Societe');
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
app.post('/api/upload-organigramme/:id', (req, res) => {
    const societeId = req.params.id;
    if (!societeId) {
        return res.status(400).json({ message: "Société ID is required" });
    }

    const form = new formidable.IncomingForm();
    form.uploadDir = path.join(__dirname, 'uploads'); // Ensure this folder exists
    form.keepExtensions = true;

    form.parse(req, async (err, fields, files) => {
        if (err) {
            return res.status(500).json({ message: 'File upload failed', error: err });
        }

        console.log("Files received:", files);

        const fileArray = files.file;
        if (!fileArray || fileArray.length === 0) {
            return res.status(400).json({ message: "No file uploaded" });
        }

        const file = fileArray[0]; // Get the uploaded file
        const originalFileName = file.originalFilename; // ✅ Keep the original name
        const fileExtension = path.extname(originalFileName); // Extract extension
        const newFileName = `${societeId}_${originalFileName}`; // Use original name with ID
        const newPath = path.join(form.uploadDir, newFileName);
        const dbFilePath = `/uploads/${newFileName}`; // Store relative path in DB

        try {
            // 🔹 Get the old file path from the database
            const selectQuery = `SELECT organigramme_path FROM Societe WHERE id = @id`;
            const request = new sql.Request();
            request.input('id', sql.Int, societeId);
            const result = await request.query(selectQuery);

            if (result.recordset.length > 0 && result.recordset[0].organigramme_path) {
                const oldFilePath = path.join(__dirname, result.recordset[0].organigramme_path);
                if (fs.existsSync(oldFilePath)) {
                    fs.unlinkSync(oldFilePath); // Delete old file
                }
            }

            // Move the uploaded file to the correct location
            fs.rename(file.filepath, newPath, async (err) => {
                if (err) {
                    return res.status(500).json({ message: 'Error moving file', error: err });
                }

                // ✅ Update the database with the original file name
                const updateQuery = `
                    UPDATE Societe 
                    SET organigramme_path = @organigramme_path 
                    WHERE id = @id
                `;
                request.input('organigramme_path', sql.NVarChar, dbFilePath);
                await request.query(updateQuery);

                res.status(200).json({
                    message: 'File uploaded and path updated successfully',
                    fileName: originalFileName, // ✅ Return the original file name
                    filePath: dbFilePath
                });
            });

        } catch (dbErr) {
            res.status(500).json({ message: "Database update failed", error: dbErr.message });
        }
    });
});

app.post('/api/societes', async (req, res) => {
    try {
        const { nom, description, rne, pays, adresse, Type } = req.body;

        const query = `
            INSERT INTO Societe (nom, description, rne, pays, adresse, Type) 
            OUTPUT INSERTED.id
            VALUES (@nom, @description, @rne, @pays, @adresse, @Type)
        `;
        const request = new sql.Request();
        request.input('nom', sql.NVarChar, nom);
        request.input('description', sql.NVarChar, description);
        request.input('rne', sql.NVarChar, rne);
        request.input('pays', sql.NVarChar, pays);
        request.input('adresse', sql.NVarChar, adresse);
        request.input('Type', sql.NVarChar, Type);
        const result = await request.query(query);

        if (result.recordset.length > 0) {
            res.status(201).json({ message: 'Société added successfully', data: { id: result.recordset[0].id } });
        } else {
            res.status(500).json({ error: 'Insertion failed' });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/societes/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await sql.query`DELETE FROM Societe WHERE id = ${id}`;
        res.json({ message: 'Société deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/societes/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { nom, description, rne, pays, adresse, Type } = req.body;

        if (!id || !nom) {
            return res.status(400).json({ error: 'ID and nom are required.' });
        }

        const query = `
            UPDATE Societe 
            SET nom = @nom, description = @description, rne = @rne, pays = @pays, adresse = @adresse, Type = @Type 
            WHERE id = @id
        `;
        const request = new sql.Request();
        request.input('id', sql.Int, id);
        request.input('nom', sql.NVarChar, nom);
        request.input('description', sql.NVarChar, description);
        request.input('rne', sql.NVarChar, rne);
        request.input('pays', sql.NVarChar, pays);
        request.input('adresse', sql.NVarChar, adresse);
        request.input('Type', sql.NVarChar, Type);

        await request.query(query);
        res.json({ message: 'Société updated successfully.' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to update Société' });
    }
});

app.get('/api/departements', async (req, res) => {
    try {
        const result = await sql.query(`
            SELECT Departement.id, Departement.nom, organigramme_dep,
                   Departement.societe_id, Societe.nom AS societe 
            FROM Departement 
            JOIN Societe ON Departement.societe_id = Societe.id
        `);

        console.log('Departements Data:', result.recordset); // ✅ Debugging Log
        res.json(result.recordset);
    } catch (err) {
        console.error('Database Error:', err); // ✅ Log error to console
        res.status(500).json({ error: 'Database error', details: err.message });
    }
});
app.put('/api/departements/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { nom, societe_id } = req.body;

        if (!id || !nom) {
            return res.status(400).json({ error: 'ID and nom are required.' });
        }

        const query = `
            UPDATE departement 
            SET nom = @nom, societe_id = @societe_id
            WHERE id = @id
        `;
        const request = new sql.Request();
        request.input('id', sql.Int, id);
        request.input('nom', sql.NVarChar, nom);
        request.input('societe_id', sql.Int, societe_id);

        await request.query(query);
        res.json({ message: 'departement updated successfully.' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to update departement' });
    }
});

app.post('/api/upload-organigramme-dep/:id', (req, res) => {
    const departementId = req.params.id;
    if (!departementId) {
        return res.status(400).json({ message: "Departement ID is required" });
    }

    const form = new formidable.IncomingForm();
    form.uploadDir = path.join(__dirname, 'uploads'); // Ensure this folder exists
    form.keepExtensions = true;

    form.parse(req, async (err, fields, files) => {
        if (err) {
            console.error("Formidable error:", err);
            return res.status(500).json({ message: 'File upload failed', error: err });
        }

        console.log("Files received:", files);

        // 🔹 Fix: Correct way to get the file
        const file = files.organigramme ? files.organigramme[0] : null;

        if (!file) {
            return res.status(400).json({ message: "No file uploaded" });
        }

        const originalFileName = file.originalFilename;
        const newFileName = `${departementId}_${originalFileName}`;
        const newPath = path.join(form.uploadDir, newFileName);
        const dbFilePath = `/uploads/${newFileName}`;

        try {
            // Delete old file (if exists)
            const selectQuery = `SELECT organigramme_dep FROM Departement WHERE id = @id`;
            const request = new sql.Request();
            request.input('id', sql.Int, departementId);
            const result = await request.query(selectQuery);

            if (result.recordset.length > 0 && result.recordset[0].organigramme_dep) {
                const oldFilePath = path.join(__dirname, result.recordset[0].organigramme_dep);
                if (fs.existsSync(oldFilePath)) {
                    fs.unlinkSync(oldFilePath);
                }
            }

            // Move the uploaded file
            fs.rename(file.filepath, newPath, async (err) => {
                if (err) {
                    console.error("Error moving file:", err);
                    return res.status(500).json({ message: 'Error moving file', error: err });
                }

                // ✅ Update database
                const updateQuery = `UPDATE Departement SET organigramme_dep = @organigramme_dep WHERE id = @id`;
                request.input('organigramme_dep', sql.NVarChar, dbFilePath);
                await request.query(updateQuery);

                res.status(200).json({
                    message: 'File uploaded successfully',
                    fileName: originalFileName,
                    filePath: dbFilePath
                });
            });

        } catch (dbErr) {
            console.error("Database update error:", dbErr);
            res.status(500).json({ message: "Database update failed", error: dbErr.message });
        }
    });
});

app.post('/api/departements', async (req, res) => {
    try {
        const { nom, societe_id } = req.body;

        const query = `
            INSERT INTO departement (nom, societe_id) 
            OUTPUT INSERTED.id
            VALUES (@nom, @societe_id)
        `;
        const request = new sql.Request();
        request.input('nom', sql.NVarChar, nom);
        request.input('societe_id', sql.NVarChar, societe_id);
        const result = await request.query(query);

        if (result.recordset.length > 0) {
            res.status(201).json({ message: 'departement added successfully', data: { id: result.recordset[0].id } });
        } else {
            res.status(500).json({ error: 'Insertion failed' });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/departements/:societeId', async (req, res) => {
    try {
        const { societeId } = req.params;

        console.log(`🔍 Fetching départements for société ID: ${societeId}`);

        // Check if societeId is valid
        if (isNaN(societeId)) {
            return res.status(400).json({ error: 'Invalid société ID' });
        }

        // Query the database
        const result = await db.query(
            `SELECT * FROM departement WHERE societe_id = @societeId`,
            { societeId }
        );

        // If no records found
        if (!result.recordset || result.recordset.length === 0) {
            console.log("❌ No départements found.");
            return res.status(404).json({ error: 'No départements found for this société' });
        }

        // Return the results
        console.log("✅ Departements Loaded:", result.recordset);
        res.json(result.recordset);
    } catch (error) {
        console.error("❌ Error fetching départements:", error);
        res.status(500).json({ error: 'Failed to fetch départements' });
    }
});

app.delete('/api/departements/:id', async (req, res) => {
    try {
        await sql.query`DELETE FROM Departement WHERE id = ${req.params.id}`;
        res.json({ message: 'Département supprimé avec succès' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/unites', async (req, res) => {
    try {
        await sql.connect(dbConfig);
        const result = await sql.query('SELECT * FROM unites');
        res.json(result.recordset);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

app.get('/unites/:id', async (req, res) => {
    try {
        await sql.connect(dbConfig);
        const result = await sql.query(`SELECT * FROM unites WHERE id = ${req.params.id}`);
        res.json(result.recordset[0]);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

app.post('/unites', async (req, res) => {
    try {
        const { nom, description } = req.body;
        await sql.connect(dbConfig);
        await sql.query(`INSERT INTO unites (nom, description) VALUES ('${nom}', '${description}')`);
        res.status(201).json({ message: 'Unite added successfully' });
    } catch (err) {
        res.status(500).send(err.message);
    }
});

app.put('/unites/:id', async (req, res) => {
    try {
        const { nom, description } = req.body;
        await sql.connect(dbConfig);
        await sql.query(`UPDATE unites SET nom = '${nom}', description = '${description}' WHERE id = ${req.params.id}`);
        res.json({ message: 'Unite updated successfully' });
    } catch (err) {
        res.status(500).send(err.message);
    }
});

app.delete('/unites/:id', async (req, res) => {
    try {
        await sql.connect(dbConfig);
        await sql.query(`DELETE FROM unites WHERE id = ${req.params.id}`);
        res.json({ message: 'Unite deleted successfully' });
    } catch (err) {
        res.status(500).send(err.message);
    }
});
app.get('/api/postes', async (req, res) => {
    try {
        await sql.connect(dbConfig);
        const result = await sql.query('SELECT * FROM postes');
        res.json(result.recordset);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

app.get('/api/postes/:id', async (req, res) => {
    try {
        await sql.connect(dbConfig);
        const result = await sql.query(`SELECT * FROM postes WHERE id = ${req.params.id}`);
        res.json(result.recordset[0]);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

app.put('/api/postes/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { nom, description } = req.body;

        if (!id || !nom) {
            return res.status(400).json({ error: 'ID and nom are required.' });
        }

        const query = `
            UPDATE postes 
            SET nom = @nom, description = @description
            WHERE id = @id
        `;
        const request = new sql.Request();
        request.input('id', sql.Int, id);
        request.input('nom', sql.NVarChar, nom);
        request.input('description', sql.NVarChar, description);

        await request.query(query);
        res.json({ message: 'postes updated successfully.' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to update postes' });
    }
});

app.post('/api/upload-fiche-fonction/:id', (req, res) => {
    const posteId = req.params.id;
    if (!posteId) {
        return res.status(400).json({ message: "poste ID is required" });
    }

    const form = new formidable.IncomingForm();
    form.uploadDir = path.join(__dirname, 'uploads'); // Ensure this folder exists
    form.keepExtensions = true;

    form.parse(req, async (err, fields, files) => {
        if (err) {
            console.error("Formidable error:", err);
            return res.status(500).json({ message: 'File upload failed', error: err });
        }

        console.log("Files received:", files);

        // 🔹 Fix: Correct way to get the file
        const file = files.organigramme ? files.organigramme[0] : null;

        if (!file) {
            return res.status(400).json({ message: "No file uploaded" });
        }

        const originalFileName = file.originalFilename;
        const newFileName = `${posteId}_${originalFileName}`;
        const newPath = path.join(form.uploadDir, newFileName);
        const dbFilePath = `/uploads/${newFileName}`;

        try {
            // Delete old file (if exists)
            const selectQuery = `SELECT fiche_fonction FROM postes WHERE id = @id`;
            const request = new sql.Request();
            request.input('id', sql.Int, posteId);
            const result = await request.query(selectQuery);

            if (result.recordset.length > 0 && result.recordset[0].fiche_fonction) {
                const oldFilePath = path.join(__dirname, result.recordset[0].fiche_fonction);
                if (fs.existsSync(oldFilePath)) {
                    fs.unlinkSync(oldFilePath);
                }
            }

            // Move the uploaded file
            fs.rename(file.filepath, newPath, async (err) => {
                if (err) {
                    console.error("Error moving file:", err);
                    return res.status(500).json({ message: 'Error moving file', error: err });
                }

                const updateRequest = new sql.Request();
                updateRequest.input('id', sql.Int, posteId);
                updateRequest.input('fiche_fonction', sql.NVarChar, dbFilePath);
                const updateQuery = `UPDATE Postes SET fiche_fonction = @fiche_fonction WHERE id = @id`;
                await updateRequest.query(updateQuery);

                res.status(200).json({
                    message: 'File uploaded successfully',
                    fileName: originalFileName,
                    filePath: dbFilePath
                });
            });

        } catch (dbErr) {
            console.error("Database update error:", dbErr);
            res.status(500).json({ message: "Database update failed", error: dbErr.message });
        }
    });
});

app.post('/api/postes', async (req, res) => {
    try {
        const { nom, description } = req.body;

        if (!nom) {
            return res.status(400).json({ error: 'Nom du poste est requis' });
        }

        const query = `
            INSERT INTO Postes (nom, description)
            VALUES (@nom, @description);
            
            SELECT CAST(SCOPE_IDENTITY() AS int) AS id;
        `;

        const request = new sql.Request();
        request.input('nom', sql.NVarChar, nom);
        request.input('description', sql.NVarChar, description || null);

        const result = await request.query(query);

        console.log("Raw database query result:", result);

        const insertedId = result?.recordset?.[0]?.id;
        console.log("Extracted Inserted ID:", insertedId);

        if (insertedId) {
            console.log("Poste added successfully with ID:", insertedId);
            res.status(201).json({
                message: 'Poste added successfully',
                data: { id: insertedId }
            });
        } else {
            console.error("Error: No ID returned from the SQL query. Full result:", result);
            res.status(500).json({ error: 'Insertion failed: No ID returned' });
        }
    } catch (err) {
        console.error("Error while adding Poste:", err.message);
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/postes/:id', async (req, res) => {
    try {
        await sql.connect(dbConfig);
        await sql.query(`DELETE FROM postes WHERE id = ${req.params.id}`);
        res.json({ message: 'Poste deleted successfully' });
    } catch (err) {
        res.status(500).send(err.message);
    }
});

app.get('/cubes', async (req, res) => {
    try {
        await sql.connect(dbConfig);
        const result = await sql.query('SELECT * FROM cubes');
        res.json(result.recordset);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

app.get('/cubes/:id', async (req, res) => {
    try {
        await sql.connect(dbConfig);
        const result = await sql.query(`SELECT * FROM cubes WHERE id = ${req.params.id}`);
        res.json(result.recordset[0]);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

app.post('/cubes', async (req, res) => {
    try {
        const { nom, description } = req.body;
        await sql.connect(dbConfig);
        await sql.query(`INSERT INTO cubes (nom, description) VALUES ('${nom}', '${description}')`);
        res.status(201).json({ message: 'cube added successfully' });
    } catch (err) {
        res.status(500).send(err.message);
    }
});

app.put('/cubes/:id', async (req, res) => {
    try {
        const { nom, description } = req.body;
        await sql.connect(dbConfig);
        await sql.query(`UPDATE cubes SET nom = '${nom}', description = '${description}' WHERE id = ${req.params.id}`);
        res.json({ message: 'cube updated successfully' });
    } catch (err) {
        res.status(500).send(err.message);
    }
});

app.delete('/cubes/:id', async (req, res) => {
    try {
        await sql.connect(dbConfig);
        await sql.query(`DELETE FROM cubes WHERE id = ${req.params.id}`);
        res.json({ message: 'cube deleted successfully' });
    } catch (err) {
        res.status(500).send(err.message);
    }
});
app.get('/api/user_unite', async (req, res) => {
    try {
        const result = await sql.query('SELECT * FROM user_unite');
        res.json(result.recordset);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

app.post('/api/user_unite', async (req, res) => {
    const { user_id, unite_id } = req.body;
    try {
        await sql.query`INSERT INTO user_unite (user_id, unite_id) VALUES (${user_id}, ${unite_id})`;
        res.status(201).send('User_Unite added successfully');
    } catch (err) {
        res.status(500).send(err.message);
    }
});

app.get('/api/user_cube', async (req, res) => {
    try {
        const result = await sql.query('SELECT * FROM user_cube');
        res.json(result.recordset);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

app.post('/api/user_cube', async (req, res) => {
    const { user_id, cube_id } = req.body;
    try {
        await sql.query`INSERT INTO user_cube (user_id, cube_id) VALUES (${user_id}, ${cube_id})`;
        res.status(201).send('User_Cube added successfully');
    } catch (err) {
        res.status(500).send(err.message);
    }
});

app.get('/cubes/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const pool = await sql.connect(dbConfig);

        const result = await pool.request()
            .input('id', sql.Int, id)
            .query("SELECT nom FROM cube WHERE id_cube = @id");

        if (result.recordset.length > 0) {
            res.json(result.recordset[0]);
        } else {
            res.status(404).json({ error: 'Cube not found' });
        }
    } catch (error) {
        console.error('Error fetching cube:', error);
        res.status(500).json({ error: 'Database error' });
    }
});

app.get('/api/module', async (req, res) => {
    try {
        await sql.connect(dbConfig);
        const result = await sql.query('SELECT * FROM module');
        res.json(result.recordset);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

app.get('/api/module/:id', async (req, res) => {
    try {
        await sql.connect(dbConfig);
        const result = await sql.query(`SELECT * FROM module WHERE id = ${req.params.id}`);
        res.json(result.recordset[0]);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

app.post('/api/module', async (req, res) => {
    try {
        const { nom, description } = req.body;
        await sql.connect(dbConfig);
        await sql.query(`INSERT INTO module (nom, description) VALUES ('${nom}', '${description}')`);
        res.status(201).json({ message: 'module added successfully' });
    } catch (err) {
        res.status(500).send(err.message);
    }
});

app.put('/api/module/:id', async (req, res) => {
    try {
        const { nom, description } = req.body;
        await sql.connect(dbConfig);
        await sql.query(`UPDATE module SET nom = '${nom}', description = '${description}' WHERE id = ${req.params.id}`);
        res.json({ message: 'module updated successfully' });
    } catch (err) {
        res.status(500).send(err.message);
    }
});

app.delete('/api/module/:id', async (req, res) => {
    try {
        await sql.connect(dbConfig);
        await sql.query(`DELETE FROM module WHERE id = ${req.params.id}`);
        res.json({ message: 'module deleted successfully' });
    } catch (err) {
        res.status(500).send(err.message);
    }
});
app.get('/api/formations', async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query('SELECT * FROM dbo.formation');
        res.send(result.recordset); // ✅ must return array
    } catch (err) {
        console.error("Error fetching formations:", err.message);
        res.status(500).send({ error: err.message });
    }
});
app.post('/api/upload-formation/:id', (req, res) => {
    const formationId = req.params.id;

    const form = new formidable.IncomingForm();
    const uploadDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

    form.uploadDir = uploadDir;
    form.keepExtensions = true;

    form.parse(req, async (err, fields, files) => {
        if (err) return res.status(500).json({ message: 'Upload error', error: err });

        const file = files.organigramme?.[0];
        if (!file) return res.status(400).json({ message: "No file uploaded" });

        const originalFileName = file.originalFilename;
        const fileType = path.extname(originalFileName).substring(1).toLowerCase(); // ✅ detect type
        const newFileName = `${formationId}_${originalFileName}`;
        const newPath = path.join(uploadDir, newFileName);
        const dbFilePath = `/uploads/${newFileName}`;

        fs.rename(file.filepath, newPath, async (err) => {
            if (err) return res.status(500).json({ message: 'File move error', error: err });

            try {
                const pool = await sql.connect(dbConfig);
                await pool.request()
                    .input('id', sql.Int, formationId)
                    .input('piece_jointe', sql.NVarChar, dbFilePath)
                    .input('file_type', sql.NVarChar, fileType) // ✅ save type
                    .query(`
              UPDATE formation 
              SET piece_jointe = @piece_jointe,
                  file_type = @file_type
              WHERE id = @id
            `);

                res.status(200).json({
                    message: "✅ File uploaded and type saved",
                    filePath: dbFilePath,
                    fileType: fileType
                });

            } catch (err) {
                res.status(500).json({ message: "DB update failed", error: err.message });
            }
        });
    });
});
app.post('/api/formations', async (req, res) => {
    try {
        const { titre, description, objectif, piece_jointe, telechargable, modules, departements } = req.body;

        console.log("📦 Received formation data:", req.body);

        const pool = await sql.connect(dbConfig);
        const request = pool.request();

        // Insert formation
        request.input('titre', sql.NVarChar, titre);
        request.input('description', sql.NVarChar, description);
        request.input('objectif', sql.NVarChar, objectif);
        request.input('piece_jointe', sql.NVarChar, piece_jointe || '');
        request.input('telechargable', sql.NVarChar, String(telechargable));

        const insertQuery = `
            INSERT INTO formation (titre, description, objectif, piece_jointe, telechargable) 
            OUTPUT INSERTED.id
            VALUES (@titre, @description, @objectif, @piece_jointe, @telechargable)
        `;

        const result = await request.query(insertQuery);
        const formationId = result.recordset[0].id;

        // For modules
        if (modules && modules.length > 0) {
            for (const moduleId of modules) {
                await pool.request()
                    .input('formation_id', sql.Int, formationId)
                    .input('module_id', sql.Int, moduleId)
                    .query(`
          IF NOT EXISTS (
            SELECT 1 FROM formation_module
            WHERE formation_id = @formation_id AND module_id = @module_id
          )
          BEGIN
            INSERT INTO formation_module (formation_id, module_id)
            VALUES (@formation_id, @module_id)
          END
        `);
            }
        }

        // For departements
        if (departements && departements.length > 0) {
            for (const departementId of departements) {
                await pool.request()
                    .input('formation_id', sql.Int, formationId)
                    .input('departement_id', sql.Int, departementId)
                    .query(`
          IF NOT EXISTS (
            SELECT 1 FROM formation_departement
            WHERE formation_id = @formation_id AND departement_id = @departement_id
          )
          BEGIN
            INSERT INTO formation_departement (formation_id, departement_id)
            VALUES (@formation_id, @departement_id)
          END
        `);
            }
        }

        res.status(201).json({
            message: 'Formation added successfully',
            data: { id: formationId }
        });

        await pool.close();
    } catch (err) {
        console.error("🔥 Error in POST /api/formations:", err);
        res.status(500).json({ error: err.message });
    }
});
app.delete('/api/formations/:id', async (req, res) => {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid formation ID" });
    }

    try {
        const pool = await poolPromise;

        // ✅ Always declare `request` immediately after `pool`
        const request = pool.request();

        // 🔍 Confirm DB name for safety
        const dbCheck = await request.query("SELECT DB_NAME() AS dbName");
        console.log("✅ Connected to database:", dbCheck.recordset[0].dbName);

        // ✅ Safely delete from all tables
        await request.query(`DELETE FROM dbo.formation_module WHERE formation_id = ${id}`);
        await request.query(`DELETE FROM dbo.formation_departement WHERE formation_id = ${id}`);
        await request.query(`DELETE FROM dbo.formation WHERE id = ${id}`);

        console.log(`🗑️ Formation ${id} deleted successfully`);
        res.json({ message: "Formation deleted successfully" });

    } catch (err) {
        console.error("❌ Error deleting formation:", err.message);
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/formations/:id', async (req, res) => {
    const { id } = req.params;
    const { titre, description, objectif, telechargable, modules, departements } = req.body;

    try {
        const pool = await poolPromise;
        const request = pool.request();

        console.log("📦 Modules to insert:", modules);
        console.log("📦 Departements to insert:", departements);

        // Update main formation
        await request.query(`
        UPDATE dbo.formation
        SET titre = '${titre}', description = '${description}', objectif = '${objectif}', telechargable = ${telechargable ? 1 : 0}
        WHERE id = ${id}
      `);

        // Delete previous junctions
        await request.query(`DELETE FROM dbo.formation_module WHERE formation_id = ${id}`);
        await request.query(`DELETE FROM dbo.formation_departement WHERE formation_id = ${id}`);

        if (Array.isArray(modules) && modules.length > 0) {
            for (let moduleId of modules) {
                await pool.request().query(`
                INSERT INTO dbo.formation_module (formation_id, module_id)
                VALUES (${id}, ${moduleId})
              `);
            }
        }

        if (Array.isArray(departements) && departements.length > 0) {
            for (let depId of departements) {
                console.log(`🧩 Inserting departement: formation_id=${id}, departement_id=${depId}`);
                await pool.request().query(`
                  INSERT INTO dbo.formation_departement (formation_id, departement_id)
                  VALUES (${id}, ${depId})
                `);
            }

        }


        res.json({ message: 'Formation updated successfully' });

    } catch (err) {
        console.error("❌ Update error:", err); // 🔥 this will show the full reason
        res.status(500).json({ error: err.message });
    }
});

const { poolPromise } = require('./db');

app.get('/api/formation_module', async (req, res) => {
    try {
        const result = await sql.query('SELECT * FROM formation_module');
        res.json(result.recordset);
    } catch (err) {
        res.status(500).send(err.message);
    }
});
app.post('/api/formation_module', async (req, res) => {
    const { formation_id, module_id } = req.body;

    if (!formation_id || !module_id) {
        return res.status(400).json({ message: "formation_id et module_id sont requis" });
    }

    try {
        const pool = await sql.connect(dbConfig); // ✅ ouvre une connexion
        const request = pool.request(); // ✅ utilise la connexion

        request.input('formation_id', sql.Int, formation_id);
        request.input('module_id', sql.Int, module_id);

        await request.query(`
        INSERT INTO dbo.formation_module (formation_id, module_id)
        VALUES (@formation_id, @module_id)
      `);

        res.status(201).json({ message: 'Lien formation-module ajouté avec succès' });

        await pool.close(); // facultatif
    } catch (err) {
        console.error("❌ ERREUR formation_module:", err);
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/formation_departement', async (req, res) => {
    try {
        const pool = await poolPromise;

        const result = await pool.request().query(`SELECT * FROM formation_departement`);
        res.json(result.recordset);
    } catch (err) {
        res.status(500).send(err.message);
    }
});
app.post('/api/formation_departement', async (req, res) => {
    const { formation_id, departement_id } = req.body;

    if (!formation_id || !departement_id) {
        return res.status(400).json({ message: "formation_id et departement_id sont requis" });
    }

    try {
        const pool = await sql.connect(dbConfig); // <-- ajoute cette ligne
        const request = pool.request(); // <-- change ici

        request.input('formation_id', sql.Int, formation_id);
        request.input('departement_id', sql.Int, departement_id);

        await request.query(`
            INSERT INTO dbo.formation_departement (formation_id, departement_id)
            VALUES (@formation_id, @departement_id)
        `);

        res.status(201).json({ message: 'Lien formation-departement ajouté avec succès' });

        await pool.close(); // optionnel si tu veux fermer
    } catch (err) {
        console.error("❌ ERREUR formation_departement:", err);
        res.status(500).json({ error: err.message });
    }
});
app.get('/uploads/:filename', (req, res) => {
    const filePath = path.join(__dirname, 'uploads', req.params.filename);
    const fileExtension = path.extname(filePath).toLowerCase();

    // Only allow inline viewing for supported types (like PDFs)
    const mimeTypes = {
        '.pdf': 'application/pdf',
        '.mp4': 'video/mp4',
        '.mov': 'video/quicktime',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.gif': 'image/gif',
        '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        '.xls': 'application/vnd.ms-excel',
        '.doc': 'application/msword',
        '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    };

    const contentType = mimeTypes[fileExtension] || 'application/octet-stream';

    if (!contentType) {
        return res.status(415).send('Unsupported file type');
    }
    // 👇 Force inline viewing — especially for PDF
    if (fileExtension === '.pdf') {
        res.setHeader('Content-Disposition', `inline; filename="${req.params.filename}"`);
    }
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `inline; filename="${req.params.filename}"`);
    res.sendFile(filePath);
});

app.get('/convert-from-db/:id', async (req, res) => {
    const formationId = req.params.id;
    console.log(`📥 Converting PDF for formation ID: ${formationId}`);

    try {
        const request = new sql.Request();
        request.input('id', sql.Int, formationId);

        const result = await request.query(`
        SELECT piece_jointe FROM formation WHERE id = @id
      `);

        const record = result.recordset[0];
        if (!record || !record.piece_jointe) {
            console.log('❌ No piece_jointe found in DB');
            return res.status(404).send('PDF path not found in DB.');
        }

        const relativePath = record.piece_jointe.startsWith('/')
            ? record.piece_jointe.slice(1)
            : record.piece_jointe;

        const pdfPath = path.join(__dirname, relativePath);
        console.log(`🧭 Full PDF path resolved: ${pdfPath}`);

        if (!fs.existsSync(pdfPath)) {
            console.log('❌ File does not exist on disk:', pdfPath);
            return res.status(404).send('PDF file not found on disk.');
        }

        const outputDir = path.join(__dirname, 'converted', `formation_${formationId}`);
        fs.mkdirSync(outputDir, { recursive: true });

        console.log('🔧 Starting conversion...');
        await pdf.convert(pdfPath, {
            format: 'jpeg',
            out_dir: outputDir,
            out_prefix: 'page',
            page: null
        });


        const images = fs.readdirSync(outputDir)
            .filter(f => f.endsWith('.jpg'))
            .map(f => `/converted/formation_${formationId}/${f}`);

        console.log('✅ Conversion complete. Images:', images);
        res.json({ images });

    } catch (err) {
        console.error('❌ Error during PDF conversion:', err);
        res.status(500).send('Failed to convert PDF from path.');
    }
});
app.use('/converted', express.static(path.join(__dirname, 'converted')));
app.get('/secure-file/:id', async (req, res) => {
    const formationId = req.params.id;

    try {
        const pool = await poolPromise;
        const request = pool.request();
        request.input('id', sql.Int, formationId);

        const result = await request.query(`
        SELECT piece_jointe, telechargable FROM formation WHERE id = @id
      `);

        const formation = result.recordset[0];
        if (!formation || !formation.piece_jointe) {
            return res.status(404).send('Fichier non trouvé.');
        }

        const relativePath = formation.piece_jointe.startsWith('/')
            ? formation.piece_jointe.slice(1)
            : formation.piece_jointe;

        const filePath = path.join(__dirname, relativePath);
        const fileName = path.basename(filePath);
        const ext = path.extname(filePath).toLowerCase();

        const mimeTypes = {
            '.pdf': 'application/pdf',
            '.mp4': 'video/mp4',
            '.mov': 'video/quicktime',
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.png': 'image/png',
            '.gif': 'image/gif',
            '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            '.xls': 'application/vnd.ms-excel',
            '.doc': 'application/msword',
            '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        };

        const contentType = mimeTypes[ext] || 'application/octet-stream';
        res.setHeader('Content-Type', contentType);

        if (formation.telechargable) {
            // 👇 Send inline for preview (don't force download)
            res.setHeader('Content-Disposition', `inline; filename="${fileName}"`);
            res.sendFile(filePath);
        } else {
            res.setHeader('Content-Disposition', `inline; filename="${fileName}"`);
            res.sendFile(filePath);
        }

    } catch (err) {
        console.error('❌ Error:', err);
        res.status(500).send('Erreur serveur.');
    }
});

app.get('/convert-from-db/:id', async (req, res) => {
    const formationId = req.params.id;
    const outputDir = path.join(__dirname, 'converted', `formation_${formationId}`);

    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('id', sql.Int, formationId)
            .query(`SELECT piece_jointe, file_type FROM formation WHERE id = @id`);

        const formation = result.recordset[0];
        if (!formation?.piece_jointe) {
            return res.status(404).json({ error: 'Fichier non trouvé.' });
        }

        const filePath = path.join(__dirname, formation.piece_jointe.replace(/^\//, ''));
        const ext = path.extname(filePath).toLowerCase();
        let pdfPath = filePath;

        console.log("📥 Original file:", filePath);

        // ✅ Convert DOC/DOCX to PDF using LibreOffice
        if (ext === '.doc' || ext === '.docx') {
            const tempDir = path.dirname(filePath);
            const pdfName = path.basename(filePath, path.extname(filePath)) + '.pdf';
            const targetPdf = path.join(tempDir, pdfName);
            const libreOfficePath = `"C:\\Program Files\\LibreOffice\\program\\soffice.exe"`;

            await new Promise((resolve, reject) => {
                const command = `${libreOfficePath} --headless --convert-to pdf "${filePath}" --outdir "${tempDir}"`;
                console.log("🛠️ Running:", command);

                exec(command, (err, stdout, stderr) => {
                    console.log("📤 LibreOffice stdout:", stdout);
                    console.error("📤 LibreOffice stderr:", stderr);
                    console.log("📁 Expecting PDF at:", targetPdf);

                    if (err) {
                        console.error('❌ LibreOffice conversion error:', err);
                        return reject(err);
                    }

                    // Confirm the .pdf actually exists
                    if (!fs.existsSync(targetPdf)) {
                        console.error("❌ PDF NOT FOUND after conversion:", targetPdf);
                        return reject(new Error("PDF not created."));
                    }

                    console.log("✅ PDF successfully created:", targetPdf);

                    // ✅ CRITICAL: Set the correct path for Poppler to use
                    pdfPath = targetPdf;
                    resolve();
                });
            });
        }

        // ✅ Ensure PDF exists
        if (!fs.existsSync(pdfPath) || path.extname(pdfPath).toLowerCase() !== '.pdf') {
            console.error('❌ Not a valid PDF file:', pdfPath);
            return res.status(500).json({ error: 'PDF conversion failed. No valid PDF found.' });
        }

        // ✅ Convert PDF to JPG using Poppler
        if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

        console.log("🖼 Converting PDF to images:", pdfPath);
        const converter = new PdfConverter(pdfPath);
        await converter.convert(outputDir, {
            format: 'jpeg',
            out_prefix: 'page',
            page: null
        });

        const images = fs.readdirSync(outputDir)
            .filter(f => f.endsWith('.jpg'))
            .map(f => `/converted/formation_${formationId}/${f}`);

        console.log("✅ Images generated:", images);
        res.json({ images });

    } catch (err) {
        console.error('❌ Final error during conversion:', err);
        res.status(500).json({
            error: 'Erreur serveur lors de la conversion.',
            message: err.message
        });
    }
});

app.get('/api/evaluation', async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query('SELECT * FROM evaluation');
        res.send(result.recordset);
    } catch (err) {
        console.error('Error fetching evaluations:', err.message);
        res.status(500).send({ error: err.message });
    }
});
app.get('/api/evaluation/:id', async (req, res) => {
    try {
        await poolConnect;
        const id = req.params.id;

        const evaluation = await pool.request()
            .input('id', sql.Int, id)
            .query(`SELECT * FROM evaluation WHERE id = @id`);

        const formations = await pool.request()
            .input('id', sql.Int, id)
            .query(`SELECT f.* FROM formation f 
              JOIN evaluation_formation ef ON ef.formation_id = f.id 
              WHERE ef.evaluation_id = @id`);

        const departements = await pool.request()
            .input('id', sql.Int, id)
            .query(`SELECT d.* FROM departement d 
              JOIN evaluation_departement ed ON ed.departement_id = d.id 
              WHERE ed.evaluation_id = @id`);

        const questions = await pool.request()
            .input('id', sql.Int, id)
            .query(`SELECT * FROM question WHERE evaluation_id = @id`);

        res.json({
            evaluation: evaluation.recordset[0],
            formations: formations.recordset,
            departements: departements.recordset,
            questions: questions.recordset
        });
    } catch (err) {
        console.error('GET /api/evaluation/:id error:', err);
        res.status(500).send('Server error');
    }
});
app.post('/api/evaluation', async (req, res) => {
    const {
        titre,
        type_evaluation,
        type_question,
        duree,
        parent_evaluation_id,
        formation_ids,
        departement_ids,
        questions
    } = req.body;

    try {
        const pool = await poolPromise; // ✅ Replace this

        const result = await pool.request()
            .input('titre', sql.NVarChar, titre)
            .input('type_evaluation', sql.NVarChar, type_evaluation)
            .input('type_question', sql.NVarChar, type_question)
            .input('duree', sql.Int, duree)
            .input('parent', sql.Int, parent_evaluation_id || null)
            .query(`
        INSERT INTO evaluation (titre, type_evaluation, type_question, duree, parent_evaluation_id)
        OUTPUT INSERTED.id
        VALUES (@titre, @type_evaluation, @type_question, @duree, @parent)
      `);

        const evaluationId = result.recordset[0].id;

        for (const fid of formation_ids || []) {
            await pool.request()
                .input('eid', sql.Int, evaluationId)
                .input('fid', sql.Int, fid)
                .query(`INSERT INTO evaluation_formation (evaluation_id, formation_id) VALUES (@eid, @fid)`);
        }

        for (const did of departement_ids || []) {
            await pool.request()
                .input('eid', sql.Int, evaluationId)
                .input('did', sql.Int, did)
                .query(`INSERT INTO evaluation_departement (evaluation_id, departement_id) VALUES (@eid, @did)`);
        }

        for (const q of questions || []) {
            const qResult = await pool.request()
                .input('eid', sql.Int, evaluationId)
                .input('texte', sql.NVarChar, q.texte)
                .input('description', sql.NVarChar, q.description || null)
                .input('type', sql.NVarChar, q.type_question)
                .query(`
          INSERT INTO question (evaluation_id, texte, description, type_question)
          OUTPUT INSERTED.id
          VALUES (@eid, @texte, @description, @type)
        `);

            const questionId = qResult.recordset[0].id;

            for (const opt of q.options || []) {
                await pool.request()
                    .input('qid', sql.Int, questionId)
                    .input('texte', sql.NVarChar, opt.texte)
                    .input('correct', sql.Bit, opt.is_correct)
                    .query(`INSERT INTO question_option (question_id, texte, is_correct) VALUES (@qid, @texte, @correct)`);
            }
        }

        res.status(201).json({ message: 'Evaluation created', id: evaluationId });

    } catch (err) {
        console.error('POST /api/evaluation error:', err);
        res.status(500).send('Server error');
    }
});
app.get('/api/evaluation-types', async (req, res) => {
    try {
        const pool = await sql.connect(dbConfig);
        const result = await pool.request().query(`SELECT DISTINCT type_evaluation FROM evaluation`);
        const types = result.recordset.map(row => row.type_evaluation);
        res.json(types);
    } catch (err) {
        console.error("❌ Failed to get types:", err);
        res.status(500).send('Server error');
    }
});
app.post('/api/evaluation-types', (req, res) => {
    const { type } = req.body;
    console.log("🔄 Type POST received (ignored because saved via evaluation):", type);
    res.status(200).json({ message: "Type received, already handled elsewhere." });
});
