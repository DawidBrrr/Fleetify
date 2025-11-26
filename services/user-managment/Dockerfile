#user managment Dockerfile
FROM python:3.12-slim AS base

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE 1  #Prevents Python from writing .pyc files
ENV PYTHONUNBUFFERED 1        #Ensures output is logged immediately

#Working directory for the docker file
WORKDIR /app

#copy the requirements file
COPY requirements.txt /app/

#install dependencies
RUN pip install --no-cache-dir -r requirements.txt

#copy the project files into the container
COPY . /app/

#Expose the port the app runs on
EXPOSE 8000

#Run django development server
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]