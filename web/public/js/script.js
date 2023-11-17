
document.addEventListener('DOMContentLoaded', function () {
    var messageForm = document.getElementById('messageForm');
    if (messageForm) {
        messageForm.addEventListener('submit', function (event) {
            event.preventDefault();
            var message = document.getElementById('message').value;
            sendMessage(message);
            document.getElementById('message').value = '';
        });
    }

    var loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', function (event) {
            event.preventDefault();
            var username = document.getElementById('loginUsername').value;
            var password = document.getElementById('loginPassword').value;
            handleLogin(username, password);
        });
    }

    var logoutButton = document.getElementById('logout');
    if (logoutButton) {
        logoutButton.addEventListener('click', function (event) {
            event.preventDefault();
            handleLogout();
        });
    }

    var registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', function (event) {
            event.preventDefault();
            var newUsername = document.getElementById('registerUsername').value;
            var newPassword = document.getElementById('registerPassword').value;
            handleRegister(newUsername, newPassword);
        });
    }

    var messageMqttForm = document.getElementById('messagemqtt');
    if (messageMqttForm) {
        messageMqttForm.addEventListener('submit', function (event) {
            event.preventDefault();
            var messagemqtt = document.getElementById('mqttMessage').value;
            sendMessageMqtt(messagemqtt);
            document.getElementById('mqttMessage').value = '';
        });
    }

    // Llama a la función para obtener y mostrar mensajes al cargar el dashboard
    getMessages();
});



function sendMessage(message) {
    fetch('/mensajesas/messages', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ mensaje: message })
    })
        .then(response => response.json())
        .then(data => {
            if (data.sent) {
                console.log('Mensaje enviado correctamente');
                getMessages();
            } else {
                console.error('Error al enviar mensaje');
            }
        })
        .catch(error => {
            console.error('Error al enviar mensaje:', error);
        });
}
function sendMessageMqtt(message) {
    var server = document.getElementById('mqttServer').value;  // Obtener el valor del campo de servidor
    fetch('/mensajesas/messagesMQTT', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ mensaje: message, server: server })
    })
        .then(response => response.json())
        .then(data => {
            if (data.sent) {
                console.log('Mensaje enviado correctamente');
                getMessages();
            } else {
                console.error('Error al enviar mensaje');
            }
        })
        .catch(error => {
            console.error('Error al enviar mensaje:', error);
        });
}

function getMessages() {
    fetch('/mensajesas/messages')
        .then(response => response.json())
        .then(data => {
            showMessages(data);
        })
        .catch(error => {
            console.error('Error al obtener mensajes:', error);
        });
}

function showMessages(messages) {
    var messagesElement = document.getElementById('messages');
    messagesElement.innerHTML = '';

    messages.forEach(function (message) {
        var messageDiv = document.createElement('div');
        messageDiv.innerHTML = `<strong>${message.autor}:</strong> ${message.mensaje} - Sentimiento: ${message.sentimiento}`;
        messagesElement.appendChild(messageDiv);
    });
}


function handleLogin(username, password) {
    fetch('/mensajesas/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
    })
    .then(response => response.json())
    .then(data => {
        console.log('Respuesta del servidor:', data);
        if (data.loggedIn) {
            console.log('Inicio de sesión exitoso');
            handleDashboard();
        } else {
            console.error('Error al iniciar sesión:', data.message);
            // Muestra el mensaje de error en la interfaz de usuario, por ejemplo, mediante una alerta
            alert('Error al iniciar sesión: ' + data.message);
        }
    })
    .catch(error => {
        console.error('Error al iniciar sesión:', error);
        // Muestra el mensaje de error en la interfaz de usuario, por ejemplo, mediante una alerta
        alert('Error al iniciar sesión. Por favor, intenta de nuevo.');
    });
}

function handleRegister(username, password) {
    fetch('/mensajesas/register', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
    })
    .then(response => response.json())
    .then(data => {
        console.log('Respuesta del servidor:', data);
        if (data.registered) {
            console.log('Registro exitoso');
            handleLogin(username, password);
        } else {
            console.error('Error al registrar:', data.message);
            // Muestra el mensaje de error en la interfaz de usuario, por ejemplo, mediante una alerta
            alert('Error al registrar: ' + data.message);
        }
    })
    .catch(error => {
        console.error('Error al registrar:', error);
        // Muestra el mensaje de error en la interfaz de usuario, por ejemplo, mediante una alerta
        alert('Error al registrar. Por favor, intenta de nuevo.');
    });
}

function getLoggedInUser() {
    fetch('/mensajesas/getLoggedInUser')
        .then(response => response.json())
        .then(data => {
            console.log('Usuario loggeado:', data.username);
        })
        .catch(error => {
            console.error('Error al obtener usuario loggeado:', error);
        });
}

function handleLogout() {
    fetch('/mensajesas/logout', {
        method: 'POST'
    })
    .then(response => response.json())
    .then(data => {
        if (data.loggedOut) {
            console.log('Sesión cerrada correctamente');
            window.location.href = '/login';
        } else {
            console.error('Error al cerrar sesión');
        }
    })
    .catch(error => {
        console.error('Error al cerrar sesión:', error);
    });
}
function handleDashboard() {
    // Realizar la solicitud al servidor para obtener el contenido del dashboard
    fetch('/mensajesas/dashboard')
        .then(response => response.text())
        .then(html => {
            // Limpiar el contenido actual del cuerpo de la página
            document.open();
            document.write(html);
            document.close();

            // Resto del código o lógica adicional del dashboard, si es necesario
        })
        .catch(error => {
            console.error('Error al obtener contenido del dashboard:', error);
        });
}