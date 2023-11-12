document.addEventListener('DOMContentLoaded', function () {
    // Manejar el formulario de mensajes si está presente
    var messageForm = document.getElementById('messageForm');
    if (messageForm) {
        messageForm.addEventListener('submit', function (event) {
            event.preventDefault();
            var message = document.getElementById('message').value;
            sendMessage(message);
            document.getElementById('message').value = '';
        });
    }

    // Manejar el formulario de inicio de sesión si está presente
    var loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', function (event) {
            event.preventDefault();
            var username = document.getElementById('loginUsername').value;
            var password = document.getElementById('loginPassword').value;
            handleLogin(username, password);
        });
    }

    // Manejar el formulario de registro si está presente
    var registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', function (event) {
            event.preventDefault();
            var newUsername = document.getElementById('registerUsername').value;
            var newPassword = document.getElementById('registerPassword').value;
            handleRegister(newUsername, newPassword);
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
