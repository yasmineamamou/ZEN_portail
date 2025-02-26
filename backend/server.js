require('dotenv').config();
const express = require('express');
const sql = require('mssql');
const cors = require('cors');
const multer = require('multer');
const path = require('path'); // ✅ Add this line
const port = 3000; // ✅ Define the port number
const fs = require('fs');
const app = express();
var formidable = require('formidable');
const router = express.Router(); // ✅ Define router before using it
app.use(cors());
app.use(express.json()); // Enable JSON body parsing 
app.use(express.urlencoded({ extended: true })); // Middleware for form data
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
    database: process.env.DB_NAME || 'zen_portail',
    options: {
        encrypt: true,
        trustServerCertificate: true
    },
    port: 1433 // Ensure SQL Server is running on this port
};
sql.connect(dbConfig)
    .then(() => console.log('Connected to SQL Server'))
    .catch(err => console.error('Database connection failed', err));



// ✅ Set up Multer storage configuration
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


app.post('/api/users', upload.single('profilePicture'), async (req, res) => {
    const { name, email, password, societe_id, poste_id, departement_id, status, profilePicture, role } = req.body;
    const validRoles = ['admin', 'client', 'super-admin'];
    if (!validRoles.includes(role)) {
        return res.status(400).json({ message: 'Invalid role. Allowed values: admin, client, super-admin' });
    }

    try {
        let pool = await sql.connect(dbConfig);
        const statusBit = status === 1 ? 1 : 0;
        let userResult = await pool.request()
            .input('name', sql.NVarChar, name)
            .input('email', sql.NVarChar, email)
            .input('password', sql.NVarChar, password)
            .input('societe_id', sql.Int, societe_id)
            .input('poste_id', sql.Int, poste_id)
            .input('departement_id', sql.Int, departement_id)
            .input('status', sql.Bit, statusBit) // Use BIT instead of NVARCHAR
            .input('profilePicture', sql.NVarChar, profilePicture)
            .input('date_creation', sql.DateTime, new Date())

            .input('role', sql.NVarChar, role)
            .query(`
                INSERT INTO Users (name, email, password, societe_id, poste_id, departement_id, status, date_creation, profilePicture,role)
                OUTPUT INSERTED.id
                VALUES (@name, @email, @password, @societe_id, @poste_id, @departement_id, @status, @date_creation, @profilePicture, @role)
            `);

        let newUserId = userResult.recordset[0].id;
        res.status(201).json({ message: 'User created successfully', userId: newUserId });

    } catch (error) {
        console.error('Error inserting user:', error.message);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});
app.post('/api/user_unite', async (req, res) => {
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
app.post('/api/user_cube', async (req, res) => {
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

app.get('/api/users', async (req, res) => {
    try {
        const result = await sql.query('SELECT users.id, users.name, users.email, users.password,users.date_creation ,users.profilePicture,users.role,users.status, Departement.nom AS departement,postes.nom AS postes  ,Societe.nom AS societe FROM Users JOIN Departement ON Users.departement_id = Departement.id JOIN Societe ON Users.societe_id = Societe.id JOIN postes ON Users.poste_id = postes.id ');

        // ✅ Fix image URLs before sending response
        const users = result.recordset.map(user => ({
            ...user,
            profilePicture: user.profilePicture
                ? `http://localhost:3000${user.profilePicture}`  // ✅ Ensure full image URL
                : null  // No image uploaded
        }));
        res.json(users);
    } catch (err) {
        console.error('Database Error:', err); // ✅ Log error to console
        res.status(500).json({ error: 'Database error', details: err.message });
    }
});

// Delete User API
app.delete('/api/users/:ids', async (req, res) => {
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

app.get('/api/users/:id', async (req, res) => {
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

app.put('/api/users/:id', upload.single('profilePicture'), async (req, res) => {
    try {
        const { id } = req.params;
        console.log("Received Update Request for User ID:", id);
        console.log("Request Body:", req.body);

        const { name, email, password, societe_id, poste_id, departement_id, status, profilePicture, role, unite_ids, menu_cube_ids } = req.body;

        const validRoles = ['admin', 'client', 'super-admin'];
        if (!validRoles.includes(role)) {
            return res.status(400).json({ message: 'Invalid role. Allowed values: admin, client, super-admin' });
        }

        let pool = await sql.connect(dbConfig);

        const statusBit = status ? 1 : 0;

        // 🔹 **1. Update Users Table**
        await pool.request()
            .input('id', sql.Int, id)
            .input('name', sql.NVarChar, name)
            .input('email', sql.NVarChar, email)
            .input('password', sql.NVarChar, password)
            .input('societe_id', sql.Int, societe_id)
            .input('poste_id', sql.Int, poste_id)
            .input('departement_id', sql.Int, departement_id)
            .input('status', sql.Bit, statusBit)
            .input('profilePicture', sql.NVarChar, profilePicture)
            .input('role', sql.NVarChar, role)
            .query(`
                UPDATE Users 
                SET name = @name, email = @email, password = @password, societe_id = @societe_id, 
                    poste_id = @poste_id, departement_id = @departement_id, 
                    status = @status, profilePicture = @profilePicture, role = @role
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

// Get unite by ID
app.get('/unites/:id', async (req, res) => {
    try {
        await sql.connect(dbConfig);
        const result = await sql.query(`SELECT * FROM unites WHERE id = ${req.params.id}`);
        res.json(result.recordset[0]);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// Add unite
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

// Update unite
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

// Delete unite
app.delete('/unites/:id', async (req, res) => {
    try {
        await sql.connect(dbConfig);
        await sql.query(`DELETE FROM unites WHERE id = ${req.params.id}`);
        res.json({ message: 'Unite deleted successfully' });
    } catch (err) {
        res.status(500).send(err.message);
    }
});
app.get('/postes', async (req, res) => {
    try {
        await sql.connect(dbConfig);
        const result = await sql.query('SELECT * FROM postes');
        res.json(result.recordset);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// Get poste by ID
app.get('/postes/:id', async (req, res) => {
    try {
        await sql.connect(dbConfig);
        const result = await sql.query(`SELECT * FROM postes WHERE id = ${req.params.id}`);
        res.json(result.recordset[0]);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// Add poste
app.post('/postes', async (req, res) => {
    try {
        const { nom, description } = req.body;
        await sql.connect(dbConfig);
        await sql.query(`INSERT INTO postes (nom, description) VALUES ('${nom}', '${description}')`);
        res.status(201).json({ message: 'Poste added successfully' });
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// Update poste
app.put('/postes/:id', async (req, res) => {
    try {
        const { nom, description } = req.body;
        await sql.connect(dbConfig);
        await sql.query(`UPDATE postes SET nom = '${nom}', description = '${description}' WHERE id = ${req.params.id}`);
        res.json({ message: 'Poste updated successfully' });
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// Delete poste
app.delete('/postes/:id', async (req, res) => {
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

// Get poste by ID
app.get('/cubes/:id', async (req, res) => {
    try {
        await sql.connect(dbConfig);
        const result = await sql.query(`SELECT * FROM cubes WHERE id = ${req.params.id}`);
        res.json(result.recordset[0]);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// Add poste
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

// Update poste
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

// Delete poste
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

// POST a new user_unite record
app.post('/api/user_unite', async (req, res) => {
    const { user_id, unite_id } = req.body;
    try {
        await sql.query`INSERT INTO user_unite (user_id, unite_id) VALUES (${user_id}, ${unite_id})`;
        res.status(201).send('User_Unite added successfully');
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// GET all user_cube records
app.get('/api/user_cube', async (req, res) => {
    try {
        const result = await sql.query('SELECT * FROM user_cube');
        res.json(result.recordset);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// POST a new user_cube record
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

