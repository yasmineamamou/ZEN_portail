require('dotenv').config();
const express = require('express');
const sql = require('mssql');
const cors = require('cors');
const multer = require('multer');
const path = require('path'); // ✅ Add this line
const port = 3000; // ✅ Define the port number
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.json()); // Enable JSON body parsing
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
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



const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname)); // Unique filename
    }
});
// Start Server
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
const upload = multer({ storage });
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Add a user
app.post('/api/users', upload.single('profilePicture'), async (req, res) => {
    console.log('Received Data:', req.body); // Debugging Log
    console.log('Uploaded File:', req.file); // Debugging Log

    try {
        const { name, email, password, societe, unite, poste, departement, menuCube, active } = req.body;
        const profilePicture = req.file ? `/uploads/${req.file.filename}` : null;

        if (!name || !email || !password) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const query = `
        INSERT INTO Users (name, email, password, societe, unite, poste, departement, menu_cube, status, date_creation, profilePicture)
        VALUES (@name, @email, @password, @societe, @unite, @poste, @departement, @menuCube, @active, GETDATE(), @profilePicture)
      `;

        const request = new sql.Request();
        request.input('name', sql.NVarChar, name);
        request.input('email', sql.NVarChar, email);
        request.input('password', sql.NVarChar, password);
        request.input('societe', sql.NVarChar, societe);
        request.input('unite', sql.NVarChar, unite);
        request.input('poste', sql.NVarChar, poste);
        request.input('departement', sql.NVarChar, departement);
        request.input('menuCube', sql.NVarChar, menuCube);
        request.input('active', sql.NVarChar, active ? 'Activé' : 'Désactivé');
        request.input('profilePicture', sql.NVarChar, profilePicture);

        await request.query(query);
        res.status(201).json({ message: 'User added successfully' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to add user', details: err.message });
    }
});

app.get('/api/users', async (req, res) => {
    try {
        const result = await sql.query('SELECT * FROM users');

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
app.delete('/api/users/:id', async (req, res) => {
    try {
        await sql.connect(dbConfig);
        await sql.query`DELETE FROM Users WHERE id = ${req.params.id}`;
        res.json({ message: "User deleted successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/users/:id', async (req, res) => {
    try {
        const userId = req.params.id;
        const { name, email, password, societe, unite, poste, departement, menuCube, active, profilePicture } = req.body;

        const query = `
            UPDATE Users 
            SET name = @name, email = @email, password = @password, societe = @societe, 
                unite = @unite, poste = @poste, departement = @departement, menu_cube = @menuCube, 
                status = @active, profilePicture = @profilePicture
            WHERE id = @userId
        `;

        const request = new sql.Request();
        request.input('userId', sql.Int, userId);
        request.input('name', sql.NVarChar, name);
        request.input('email', sql.NVarChar, email);
        request.input('password', sql.NVarChar, password);
        request.input('societe', sql.NVarChar, societe);
        request.input('unite', sql.NVarChar, unite);
        request.input('poste', sql.NVarChar, poste);
        request.input('departement', sql.NVarChar, departement);
        request.input('menuCube', sql.NVarChar, menuCube);
        request.input('active', sql.NVarChar, active);
        request.input('profilePicture', sql.NVarChar, profilePicture);

        await request.query(query);
        res.json({ message: 'User updated successfully' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to update user', details: err.message });
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

app.post('/api/societes', async (req, res) => {
    try {
        const { nom, description } = req.body;

        const query = `
            INSERT INTO Societe (nom, description) 
            VALUES (@nom, @description)
        `;
        const request = new sql.Request();
        request.input('nom', sql.NVarChar, nom);
        request.input('description', sql.NVarChar, description);

        await request.query(query);
        res.status(201).json({ message: 'Société added successfully' });
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
        const { nom, description } = req.body;

        if (!id || !nom) {
            return res.status(400).json({ error: 'ID and nom are required.' });
        }

        const request = new sql.Request();
        request.input('id', sql.Int, id);
        request.input('nom', sql.NVarChar, nom);
        request.input('description', sql.NVarChar, description || null);

        const query = `UPDATE Societes SET nom = @nom, description = @description WHERE id = @id`;
        await request.query(query);

        res.json({ message: 'Société updated successfully.' });
    } catch (err) {
        console.error('Update Error:', err);
        res.status(500).json({ error: 'Failed to update Société' });
    }
});

app.get('/api/departements', async (req, res) => {
    try {
        const result = await sql.query(`
            SELECT Departement.id, Departement.nom, Departement.description, 
                   Societe.nom AS societe  
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

app.post('/api/departements', async (req, res) => {
    try {
        const { nom, description, societe_id } = req.body;

        // ✅ Debugging Log: Check received data
        console.log('Received Data:', req.body);

        // Validate Required Fields
        if (!nom || !societe_id) {
            console.error('Validation Error: Nom and Société are required');
            return res.status(400).json({ error: 'Nom and Société are required' });
        }

        const query = `
            INSERT INTO Departement (nom, description, societe_id) 
            VALUES (@nom, @description, @societe_id)
        `;

        const request = new sql.Request();
        request.input('nom', sql.NVarChar, nom);
        request.input('description', sql.NVarChar, description || null);
        request.input('societe_id', sql.Int, societe_id);

        await request.query(query);

        console.log('Département added successfully!');
        res.status(201).json({ message: 'Département ajouté avec succès' });
    } catch (err) {
        console.error('Database Error:', err); // ✅ Debugging Log
        res.status(500).json({ error: 'Database error', details: err.message });
    }
});

app.put('/api/departements/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { nom, description, societe_id } = req.body;

        if (!nom || !societe_id) {
            return res.status(400).json({ error: 'Nom et Société sont requis' });
        }

        const query = `
            UPDATE Departement 
            SET nom = @nom, description = @description, societe_id = @societe_id 
            WHERE id = @id
        `;

        const request = new sql.Request();
        request.input('id', sql.Int, id);
        request.input('nom', sql.NVarChar, nom);
        request.input('description', sql.NVarChar, description || null);
        request.input('societe_id', sql.Int, societe_id);

        await request.query(query);
        res.json({ message: 'Département mis à jour avec succès' });
    } catch (err) {
        res.status(500).json({ error: 'Database error', details: err.message });
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