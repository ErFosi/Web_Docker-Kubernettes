const express = require('express');
const app = express();
const mysql = require('mysql');
const bcrypt = require('bcrypt');
const session = require('express-session');
const path = require('path');
const mqtt = require('mqtt');
const axios = require('axios'); 

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
    
            // Consulta la base de datos para obtener todos los mensajes
            const getMessagesSQL = 'SELECT * FROM mensajes';
            db.query(getMessagesSQL, (err, messages) => {
                if (err) {
                    console.error('Error al obtener mensajes de la base de datos:', err);
                } else {
                    console.log('Mensajes cargados al iniciar la aplicación:', messages);
                }
            });
        }
    });
};

// Iniciar la conexión con reintento
connectWithRetry();
const mqttClient = mqtt.connect('mqtt://mosquitto_container');  // Usa el nombre del contenedor Mosquitto
mqttClient.subscribe('mensajes');
mqttClient.on('message', async (topic, message) => {
    try {
        const mensajeString = message.toString();
        console.log("Nuevo mensaje a través de MQTT:", mensajeString);

        const [usuario, mensaje] = mensajeString.split(': ');
        const usuarioConSufijo = `${usuario}MQTT`;

        // Inicia el bloque try-catch para el análisis de sentimiento
        try {
            // Analizar el sentimiento del mensaje
            const sentiment = await analyzeSentiment(mensaje);

            // Añadir el mensaje y el sentimiento a la base de datos MySQL
            db.query('INSERT INTO mensajes (autor, mensaje, sentimiento) VALUES (?, ?, ?)', [usuarioConSufijo, mensaje, sentiment], (err, results) => {
                if (err) {
                    console.error('Error al añadir mensaje a la base de datos:', err);
                } else {
                    console.log('Mensaje añadido a la base de datos:', mensaje);
                }
            });
        } catch (error) {
            console.error('Error al analizar el sentimiento:', error);

            // Puedes establecer el sentimiento a null en caso de error
            const sentiment = null;

            // Añadir el mensaje (con sentimiento nulo) a la base de datos MySQL
            db.query('INSERT INTO mensajes (autor, mensaje, sentimiento) VALUES (?, ?, ?)', [usuarioConSufijo, mensaje, sentiment], (err, results) => {
                if (err) {
                    console.error('Error al añadir mensaje a la base de datos:', err);
                } else {
                    console.log('Mensaje añadido a la base de datos con sentimiento nulo:', mensaje);
                }
            });
        }
    } catch (error) {
        console.error('Error al procesar el mensaje MQTT:', error);
    }
});
const analyzeSentiment = async (message) => {
    return axios.post('http://sentimentalist_container:5000/analyze_sentiment', { message })
        .then(response => response.data.sentiment)
        .catch(error => {
            console.error('Error al enviar mensaje a Python:', error);
            return 'error';
        });
};
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

    // Verificar si el usuario ya existe en la base de datos
    const checkUserQuery = 'SELECT * FROM usuarios WHERE usuario = ?';
    db.query(checkUserQuery, [username], async (checkErr, checkResults) => {
        if (checkErr) {
            console.error('Error al verificar si el usuario existe:', checkErr);
            return res.json({ registered: false });
        }

        // Si el usuario ya existe, devuelve un mensaje indicándolo
        if (checkResults.length > 0) {
            return res.json({ registered: false, message: 'El usuario ya está registrado' });
        }

        // Generar el hash de la contraseña y registrar al usuario
        try {
            const hashedPassword = await bcrypt.hash(password, 10);

            const registerUserQuery = 'INSERT INTO usuarios (usuario, contrasena) VALUES (?, ?)';
            db.query(registerUserQuery, [username, hashedPassword], (registerErr, result) => {
                if (registerErr) {
                    console.error('Error al registrar usuario:', registerErr);
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
// Ruta para enviar mensajes
app.post('/messages', async (req, res) => {
    const { mensaje } = req.body;
    const loggedInUser = req.session.loggedInUser;

    if (!loggedInUser) {
        res.redirect('/login');
        return res.status(401).json({ sent: false, message: 'Usuario no autenticado' });
    }

    try {
        // Analizar el sentimiento del mensaje
        const sentiment = await analyzeSentiment(mensaje);

        // Añadir el mensaje y el sentimiento a la base de datos MySQL
        db.query('INSERT INTO mensajes (autor, mensaje, sentimiento) VALUES (?, ?, ?)', [loggedInUser, mensaje, sentiment], (err, results) => {
            if (err) {
                console.error('Error al enviar mensaje a la base de datos:', err);
                res.status(500).json({ sent: false, message: 'Error interno del servidor' });
            } else {
                res.json({ sent: true, result: sentiment });
            }
        });
    } catch (error) {
        console.error('Error al procesar el mensaje:', error);
        res.status(500).json({ sent: false, message: 'Error interno del servidor' });
    }
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
        console.log("Se va a dashboard")
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
        const { mensaje, server, loggedInUser } = req.body;
        console.log("Intentando conectar al servidor MQTT...");

        // Ajuste para redirigir a Mosquitto interno si server es localhost
        const mqttServer = (server === 'localhost' || server === '127.0.0.1') ? 'mosquitto' : server;
        //mqttServer = (server === '127.0.0.1') ? 'mosquitto' : server;
        // Crea un nuevo cliente MQTT para cada solicitud
        const mqttClientLocal = mqtt.connect(`mqtt://${mqttServer}`);

        // Verifica la conexión al servidor MQTT
        mqttClientLocal.on('connect', () => {
            console.log("Conectado al servidor MQTT");
            usuario=req.session.loggedInUser;
            // Construye el mensaje MQTT que incluye el usuario y el mensaje
            const mensajeCompleto = `${usuario}: ${mensaje}`;

            // Publica el mensaje en el tópico 'mensajes' del servidor MQTT
            mqttClientLocal.publish('mensajes', mensajeCompleto, (error) => {
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
    } catch (error) {
        console.error('Error en la solicitud /messagesMQTT:', error);
        res.json({ sent: false });
    }
});


app.listen(3000, () => {
    console.log('Servidor iniciado en http://localhost:3000');
});
