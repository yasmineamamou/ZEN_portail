const sql = require("mssql");
const bcrypt = require("bcrypt");

// Add User
exports.addUser = async (req, res) => {
    try {
        const {
            name, email, password, profilePicture, societe_id, departement_id, poste_id, unite_ids, menu_cube_ids, profil, active
        } = req.body;

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert into Users table
        const pool = await sql.connect();
        const result = await pool.request()
            .input("name", sql.NVarChar, name)
            .input("email", sql.NVarChar, email)
            .input("password", sql.NVarChar, hashedPassword)
            .input("profilePicture", sql.NVarChar, profilePicture)
            .input("societe_id", sql.Int, societe_id)
            .input("departement_id", sql.Int, departement_id)
            .input("poste_id", sql.Int, poste_id)
            .input("status", sql.NVarChar, active ? "active" : "inactive")
            .query(`
                INSERT INTO Users (name, email, password, profilePicture, societe_id, departement_id, poste_id, status)
                OUTPUT INSERTED.id
                VALUES (@name, @email, @password, @profilePicture, @societe_id, @departement_id, @poste_id, @status)
            `);

        const userId = result.recordset[0].id;

        // Insert into user_unite table
        if (unite_ids && unite_ids.length > 0) {
            for (const unite_id of unite_ids) {
                await pool.request()
                    .input("user_id", sql.Int, userId)
                    .input("unite_id", sql.Int, unite_id)
                    .query(`INSERT INTO user_unite (user_id, unite_id) VALUES (@user_id, @unite_id)`);
            }
        }

        // Insert into user_cube table
        if (menu_cube_ids && menu_cube_ids.length > 0) {
            for (const cube_id of menu_cube_ids) {
                await pool.request()
                    .input("user_id", sql.Int, userId)
                    .input("cube_id", sql.Int, cube_id)
                    .query(`INSERT INTO user_cube (user_id, cube_id) VALUES (@user_id, @cube_id)`);
            }
        }

        res.status(201).json({ message: "User added successfully", userId });

    } catch (error) {
        console.error("Error adding user:", error);
        res.status(500).json({ message: "Error adding user" });
    }
};

// Get Unités for a User
exports.getUserUnite = async (req, res) => {
    try {
        const { userId } = req.params;
        const pool = await sql.connect();
        const result = await pool.request()
            .input("userId", sql.Int, userId)
            .query(`SELECT unite_id FROM user_unite WHERE user_id = @userId`);

        res.status(200).json(result.recordset.map(row => row.unite_id));
    } catch (error) {
        console.error("Error fetching user unités:", error);
        res.status(500).json({ message: "Error retrieving user unités" });
    }
};

// Get Menu Cubes for a User
exports.getUserCube = async (req, res) => {
    try {
        const { userId } = req.params;
        const pool = await sql.connect();
        const result = await pool.request()
            .input("userId", sql.Int, userId)
            .query(`SELECT cube_id FROM user_cube WHERE user_id = @userId`);

        res.status(200).json(result.recordset.map(row => row.cube_id));
    } catch (error) {
        console.error("Error fetching user menu cubes:", error);
        res.status(500).json({ message: "Error retrieving user menu cubes" });
    }
};
