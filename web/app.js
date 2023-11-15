const express = require('express');
const app = express();
const mysql = require('mysql');
const bcrypt = require('bcrypt');
const session = require('express-session');
const path = require('path');
const mqtt = require('mqtt');

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
const mqttClient = mqtt.connect('mqtt://mosquitto_container');  // Usa el nombre del contenedor Mosquitto
mqttClient.subscribe('mensajes');
mqttClient.on('message', (topic, message) => {
    // Aquí puedes procesar el mensaje recibido y añadirlo a la base de datos con un usuario anónimo
    console.log("Nuevo mensaje a traves de mqtt!!")
    const mensaje = message.toString(); // Convierte el mensaje a cadena si es necesario
    const autorAnonimo = 'Anónimo';

    // Añadir el mensaje a la base de datos
    db.query('INSERT INTO mensajes (autor, mensaje) VALUES (?, ?)', [autorAnonimo, mensaje], (err, results) => {
        if (err) {
            console.error('Error al añadir mensaje a la base de datos:', err);
        } else {
            console.log('Mensaje añadido a la base de datos:', mensaje);
        }
    });
});
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
        res.redirect('/login');
        return res.status(401).json({ sent: false, message: 'Usuario no autenticado' });
    }

    db.query('INSERT INTO mensajes (autor, mensaje) VALUES (?, ?)', [loggedInUser, mensaje], (err, results) => {
        if (err) {
            console.log([loggedInUser, mensaje])
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

app.get('/', (req, res) => {
    console.log("redireccionado a login")
    res.sendFile(path.join(__dirname, 'views', 'login.html'));
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

app.post('/logout', (req, res) => {
    // Limpiar la sesión
    loggedInUser=null
    req.session.destroy(err => {
        if (err) {
            console.error('Error al cerrar sesión:', err);
            res.json({ loggedOut: false });
        } else {
            res.json({ loggedOut: true });
        }
    });
});
app.post('/messagesMQTT', (req, res) => {
    try {
        const { mensaje, server } = req.body;
        console.log("Intentando conectar al servidor MQTT...");

        // Ajuste para redirigir a Mosquitto interno si server es localhost
        const mqttServer = (server === 'localhost') ? 'mosquitto' : server;
        //mqttServer = (server === '127.0.0.1') ? 'mosquitto' : server;
        // Crea un nuevo cliente MQTT para cada solicitud
        const mqttClientLocal = mqtt.connect(`mqtt://${mqttServer}`);

        // Verifica la conexión al servidor MQTT
        mqttClientLocal.on('connect', () => {
            console.log("Conectado al servidor MQTT");

            // Publica el mensaje en el tópico 'mensajes' del servidor MQTT
            mqttClientLocal.publish('mensajes', mensaje, (error) => {
                if (error) {
                    console.error('Error al enviar mensaje MQTT:', error);
                    res.json({ sent: false });
                } else {
                    console.log('Mensaje MQTT enviado correctamente');
                    res.json({ sent: true });
                }

                // Desconecta el cliente después de usarlo
                mqttClientLocal.end();
            });
        });

        // Maneja los errores de conexión al servidor MQTT
        mqttClientLocal.on('error', (error) => {
            console.error('Error al conectar al servidor MQTT:', error);
            console.log("No se ha podido conectar al servidor MQTT");
            res.json({ sent: false });
        });

    } catch (error) {
        console.error('Error en el manejo del mensaje MQTT:', error);
        res.json({ sent: false, error: error.message });
    }
});


app.listen(3000, () => {
    console.log('Servidor iniciado en http://localhost:3000');
});
