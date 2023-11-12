ALTER USER 'web_admin' IDENTIFIED WITH mysql_native_password BY 'admin_sistemas';
FLUSH PRIVILEGES;

CREATE TABLE mensajes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    autor VARCHAR(255) NOT NULL,
    mensaje TEXT NOT NULL
);

INSERT INTO mensajes (autor, mensaje) VALUES
    ('Usuario1', 'Hola, este es un mensaje de prueba.'),
    ('Usuario2', 'Otro mensaje de prueba.');

