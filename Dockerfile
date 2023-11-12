# Use an official Node runtime as a parent image
FROM node:latest

# Establece el directorio de trabajo dentro del contenedor
WORKDIR /usr/src/app

# Copia el package.json y package-lock.json a tu directorio de trabajo
COPY ./web .

# Instala las dependencias de la aplicación
RUN npm install


# Exponer el puerto en el que la aplicación escucha (si es necesario)
EXPOSE 3000

# Define el comando para iniciar la aplicación
CMD ["node", "app.js"]

