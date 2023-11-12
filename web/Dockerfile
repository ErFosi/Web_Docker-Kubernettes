# Usa una imagen base que contenga Node.js y todo lo necesario para tu aplicación
FROM node:latest

# Establece el directorio de trabajo dentro del contenedor
WORKDIR /usr/src/app

# Copia el código de tu aplicación al contenedor
COPY . .

# Instala las dependencias (si las tienes)
# Si usas npm, puedes usar el siguiente comando:
RUN npm install

# Expon el puerto en el que tu aplicación escucha (por ejemplo, 3000)
EXPOSE 3000

# Comando para iniciar tu aplicación (esto puede variar según cómo inicies tu aplicación)
CMD ["node", "app.js"]
