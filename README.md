# Docker Compose

La aplicación web se despliega fácilmente utilizando Docker Compose. Al ejecutar el comando `docker-compose up`, se inicia la infraestructura completa.

```bash
docker-compose up
```
Traefik actúa como un proxy inverso y se configura para escuchar en el puerto 80. Al acceder a localhost/, se redirige automáticamente a la aplicación web. Además, el portal de control de Traefik está disponible en localhost:8080 para gestionar las configuraciones del proxy.

PhpMyAdmin, utilizado para administrar la base de datos MySQL, se encuentra en localhost:8081. Proporciona una interfaz gráfica amigable para gestionar la base de datos de la aplicación.

En resumen, el proceso de lanzar la aplicación se simplifica con Docker Compose, y Traefik facilita el acceso a la aplicación en el puerto 80, mientras que PhpMyAdmin está disponible en el puerto 8081.

# Kubernetes

Para lanzar la aplicación en Kubernetes, se utilizan varios archivos YAML que describen los recursos necesarios para ejecutar la aplicación en un clúster. A continuación, se detallan los archivos YAML y sus funciones:
- **containers_kubernetes.yml:**
  Contiene descripciones de los contenedores de la aplicación,
  incluyendo detalles de las imágenes Docker, puertos expuestos y configuraciones adicionales.

- **ingress_kubernetes.yml:**
  Define reglas de enrutamiento y configuraciones para el Ingress.
  Este se ha eliminado ya que dejó de funcionar y solo enrutaba a un pod, por lo que no tenía mucho uso.

- **mosquitto-configmap.yml:**
  Almacena configuraciones específicas de Mosquitto y se aplican mediante configmap.

- **mysql_config.yml:**
  Describe la configuración específica de MySQL y comandos iniciales (init.sql)
  para el despliegue en Kubernetes y se aplican mediante configmap.

- **services.yml:**
  Define los servicios disponibles en el clúster, incluyendo la aplicación principal,
  Mosquitto, MySQL, entre otros.

- **persistant.yml:**
  Hace el claim del volumen persistente usado en la base por MySQL.

  Para lanzar la aplicación en Kubernetes, es necesario aplicar estos archivos YAML utilizando el siguiente comando para cada uno. Una vez desplegados, los servicios estarán disponibles en el clúster. El servicio de la web escucha por el puerto 3000, esto se puede mirar en los servicios.

```bash
kubectl apply -f containers_kubernetes.yml
kubectl apply -f persistant.yml
kubectl apply -f mysql_config.yml
kubectl apply -f mosquitto-configmap.yml
kubectl apply -f services.yml
```
