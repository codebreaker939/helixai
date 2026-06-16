pipeline {
    agent any

    stages {

        stage('Checkout') {
            steps {
                git branch: 'main',
                    url: 'https://github.com/codebreaker939/helixai.git'
            }
        }

        stage('Build Docker Image') {
            steps {
                sh 'docker build -t helixai-api:v1 ./app'
            }
        }

    }
}