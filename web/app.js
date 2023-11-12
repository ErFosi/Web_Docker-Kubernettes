const express = require('express');
const app = express();
const mysql = require('mysql');
const bcrypt = require('bcrypt');
const session = require('express-session');
const path = require('path');

const dbConfig = {
    host: 'mysql', // El nombre del contenedor MySQL en la red Docker
    user: 'web_admin', // Usuario MySQL
    password: 'admin_sistemas', // Contraseña MySQL
    database: 'mensajes', // Nombre de la base de datos
    port: 3306
};

let loggedInUser = null; // Variable global para almacenar el nombre de usuario
let db;

const connectWithRetry = () => {
    db = mysql.createConnection(dbConfig);

    db.connect((err) => {
        if (err) {
            console.error('Error al conectar a la base de datos:', err);
            console.log('Reintentando la conexión en 5 segundos...');
            setTimeout(connectWithRetry, 5000); // Reintentar después de 5 segundos
        } else {
            console.log('Conexión a la base de datos exitosa');
            const sql = 'INSERT INTO usuarios (usuario, contrasena) VALUES (?, ?)';
            db.query(sql, ["test", "test"], (err, result) => {});
        }
    });
};

// Iniciar la conexión con reintento
connectWithRetry();

app.use(session({
    secret: 'tu_secreto', // Cambia esto a una cadena segura
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 60 * 60 * 1000 } // 1 hora en milisegundos
}));

app.use(express.json());
app.use('/public', express.static('public'));
app.use(express.static('public'));
// Ruta para autenticar usuario
app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const sql = 'SELECT * FROM usuarios WHERE usuario = ?';

    db.query(sql, [username], async (err, rows) => {
        if (err) {
            console.error('Error al buscar usuario en la base de datos:', err);
            return res.json({ loggedIn: false, message: 'Error al autenticar usuario' });
        }
        console.log("usuario")
        console.log(username)
        console.log(password)
        console.log(rows)
        if (rows.length > 0) {
            const storedPassword = rows[0].contrasena;
            console.log(rows)
            // Verificar la contraseña hasheada
            try {
                const match = await bcrypt.compare(password, storedPassword);
                if (match) {
                    req.session.loggedInUser = username;
                    res.json({ loggedIn: true, message: 'Credenciales correctas' });
                    return;
                } else {
                    res.json({ loggedIn: false, message: 'Credenciales incorrectas' });
                }
            } catch (error) {
                console.error('Error al comparar contraseñas:', error);
                res.json({ loggedIn: false, message: 'Error al autenticar usuario' });
            }
        } else {
            res.json({ loggedIn: false, message: 'Usuario no encontrado' });
        }
    });
});








// Ruta para registrar un nuevo usuario
app.post('/register', async (req, res) => {
    const { username, password } = req.body;

    // Verificar que la contraseña tenga al menos 6 caracteres
    if (password.length < 6) {
        return res.json({ registered: false, message: 'La contraseña debe tener al menos 6 caracteres' });
    }

    // Generar el hash de la contraseña
    try {
        const hashedPassword = await bcrypt.hash(password, 10);

        const sql = 'INSERT INTO usuarios (usuario, contrasena) VALUES (?, ?)';
        db.query(sql, [username, hashedPassword], (err, result) => {
            if (err) {
                console.error('Error al registrar usuario:', err);
                res.json({ registered: false });
            } else {
                res.json({ registered: true });
            }
        });
    } catch (error) {
        console.error('Error al hashear la contraseña:', error);
        res.json({ registered: false });
    }
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
    const loggedInUser = req.session.loggedInUser;

    if (!loggedInUser) {
        return res.status(401).json({ sent: false, message: 'Usuario no autenticado' });
    }

    db.query('INSERT INTO mensajes (autor, mensaje) VALUES (?, ?)', [loggedInUser, mensaje], (err, results) => {
        if (err) {
            console.error('Error al enviar mensaje:', err);
            res.status(500).json({ sent: false, message: 'Error interno del servidor' });
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
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'login.html'));
});
// Ruta para el dashboard
app.get('/dashboard', (req, res) => {
    // Verificar si hay una sesión iniciada
    if (req.session.loggedInUser) {
        // Si hay una sesión iniciada, redirigir al dashboard
        res.sendFile(path.join(__dirname, 'views', 'dashboard.html'));
    } else {
        // Si no hay una sesión iniciada, redirigir al inicio de sesión u otra página
        res.redirect('/login'); // Puedes ajustar esto según tus necesidades
    }
});

app.listen(3000, () => {
    console.log('Servidor iniciado en http://localhost:3000');
});
