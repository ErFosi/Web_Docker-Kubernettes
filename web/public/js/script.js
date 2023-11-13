
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
            getMessages();
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

    var messageForm = document.getElementById('messagemqtt');
    if (messageForm) {
        messageForm.addEventListener('submit', function (event) {
            event.preventDefault();
            var messagemqtt = document.getElementById('mqttMessage').value;
            sendMessageMqtt(messagemqtt);
            document.getElementById('mqttMessage').value = '';
        });
}
});


function sendMessage(message) {
    fetch('/messages', {
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
    fetch('/messagesMQTT', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ mensaje: message, server: server })  // Incluir la dirección IP del servidor en la solicitud
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
    fetch('/messages')
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
        messageDiv.innerHTML = '<strong>' + message.autor + ':</strong> ' + message.mensaje;
        messagesElement.appendChild(messageDiv);
    });
}

function handleLogin(username, password) {
    fetch('/login', {
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
            
            window.location.href = '/dashboard';
           
        } else {
            console.error('Error al iniciar sesión');
        }
    })
    .catch(error => {
        console.error('Error al iniciar sesión:', error);
    });
}

function handleRegister(username, password) {
    fetch('/register', {
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
                console.error('Error al registrar');
            }
        })
        .catch(error => {
            console.error('Error al registrar:', error);
        });
}

function getLoggedInUser() {
    fetch('/getLoggedInUser')
        .then(response => response.json())
        .then(data => {
            console.log('Usuario loggeado:', data.username);
        })
        .catch(error => {
            console.error('Error al obtener usuario loggeado:', error);
        });
}
function handleLogout() {
    fetch('/logout', {
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