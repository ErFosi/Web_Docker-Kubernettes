# Dockerfile
FROM python:3.8-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .
# Make port 5000 available to the world outside this container
EXPOSE 5000

CMD ["python3", "app.py"]