# Usa una imagen base oficial de Node.js
FROM node:18

# Define el directorio de trabajo dentro del contenedor
WORKDIR /usr/src/app

# Copia los archivos de manifiesto (package.json y package-lock.json) para que las dependencias se instalen primero.
COPY package*.json ./

# Instala las dependencias del proyecto
RUN npm install --legacy-peer-deps

# Copia el resto del código fuente al contenedor
COPY . .

# Expón el puerto que usa tu aplicación
EXPOSE 3000

# Comando para iniciar la aplicación cuando el contenedor se ejecute
CMD ["node", "app.js"]`