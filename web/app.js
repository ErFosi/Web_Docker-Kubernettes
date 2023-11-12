const express = require('express');
const app = express();
const mysql = require('mysql');

const db = mysql.createConnection({
    host: 'mysql', // El nombre del contenedor MySQL en la red Docker
    user: 'web_admin', // Usuario MySQL
    password: 'admin_sistemas', // Contraseña MySQL
    database: 'mensajes' // Nombre de la base de datos
});

let loggedInUser = null; // Variable global para almacenar el nombre de usuario

db.connect((err) => {
    if (err) {
        console.error('Error al conectar a la base de datos:', err);
    } else {
        console.log('Conexión a la base de datos exitosa');
    }
});

app.use(express.json());

// Ruta para autenticar usuario
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    const sql = 'SELECT * FROM usuarios WHERE username = ? AND password = ?';

    db.query(sql, [username, password], (err, rows) => {
        if (err) {
            console.error('Error al autenticar usuario:', err);
            res.json({ loggedIn: false });
        } else {
            if (rows.length > 0) {
                loggedInUser = username; // Almacenar el nombre de usuario
                res.json({ loggedIn: true });
            } else {
                res.json({ loggedIn: false });
            }
        }
    });
});

// Ruta para registrar un nuevo usuario
app.post('/register', (req, res) => {
    const { username, password } = req.body;
    const sql = 'INSERT INTO usuarios (username, password) VALUES (?, ?)';

    db.query(sql, [username, password], (err, result) => {
        if (err) {
            console.error('Error al registrar usuario:', err);
            res.json({ registered: false });
        } else {
            res.json({ registered: true });
        }
    });
});

// Ruta para obtener mensajes
app.get('/messages', (req, res) => {
    db.query('SELECT * FROM mensajes', (err, results) => {
        if (err) {
            console.error('Error al obtener mensajes:', err);
            res.json([]);
        } else {
            res.json(results);
        }
    });
});

// Ruta para enviar mensajes
app.post('/messages', (req, res) => {
    const { mensaje } = req.body;

    db.query('INSERT INTO mensajes (autor, mensaje) VALUES (?, ?)', [loggedInUser, mensaje], (err, results) => {
        if (err) {
            console.error('Error al enviar mensaje:', err);
            res.json({ sent: false });
        } else {
            res.json({ sent: true });
        }
    });
});

// Ruta para obtener el usuario loggeado
app.get('/getLoggedInUser', (req, res) => {
    res.json({ username: loggedInUser });
});

// Ruta para cerrar sesión
app.post('/logout', (req, res) => {
    loggedInUser = null; // Limpiar el nombre de usuario almacenado
    res.json({ loggedOut: true });
});

// Definir ruta para la página principal (inicio de sesión / registro)
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/views/login.html');
});
// Ruta para el dashboard
app.get('/dashboard', (req, res) => {
    res.sendFile(__dirname + '/views/dashboard.html');
});
app.listen(3000, () => {
    console.log('Servidor iniciado en http://localhost:3000');
});
