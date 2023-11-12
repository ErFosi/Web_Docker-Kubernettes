ALTER USER 'web_admin' IDENTIFIED WITH mysql_native_password BY 'admin_sistemas';
FLUSH PRIVILEGES;

-- Crear tabla de usuarios
CREATE TABLE usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario VARCHAR(255) NOT NULL,
    contrasena VARCHAR(255) NOT NULL
);

-- Insertar usuarios de ejemplo
INSERT INTO usuarios (usuario, contrasena) VALUES
    ('usuario1', 'contrasena1'),
    ('usuario2', 'contrasena2');

-- Crear tabla de mensajes
CREATE TABLE mensajes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    autor VARCHAR(255) NOT NULL,
    mensaje TEXT NOT NULL
);

-- Insertar mensajes de ejemplo
INSERT INTO mensajes (autor, mensaje) VALUES
    ('Usuario1', 'Hola, este es un mensaje de prueba.'),
    ('Usuario2', 'Otro mensaje de prueba.');

