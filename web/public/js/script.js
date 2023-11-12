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

    messages.forEach(function(message) {
        var messageDiv = document.createElement('div');
        messageDiv.innerHTML = '<strong>' + message.autor + ':</strong> ' + message.mensaje;
        messagesElement.appendChild(messageDiv);
    });
}

document.getElementById('messageForm').addEventListener('submit', function(event) {
    event.preventDefault();
    var message = document.getElementById('message').value;
    sendMessage(message);
    document.getElementById('message').value = '';
});

document.getElementById('loginForm').addEventListener('submit', function(event) {
    event.preventDefault();
    var username = document.getElementById('username').value;
    var password = document.getElementById('password').value;
    handleLogin(username, password);
});

document.getElementById('registerForm').addEventListener('submit', function(event) {
    event.preventDefault();
    var newUsername = document.getElementById('newUsername').value;
    var newPassword = document.getElementById('newPassword').value;
    handleRegister(newUsername, newPassword);
});

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
        if (data.loggedIn) {
            console.log('Inicio de sesión exitoso');
            getLoggedInUser();
            window.location.href = '/dashboard.html'; // Redirigir al usuario a dashboard
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
        if (data.registered) {
            console.log('Registro exitoso');
            handleLogin(username, password); // Iniciar sesión después de registrarse
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
