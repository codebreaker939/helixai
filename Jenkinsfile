pipeline {
    agent any

    parameters {
        string(name: 'BRANCH', defaultValue: 'main', description: 'Git branch to build')
        string(name: 'DOCKER_TAG', defaultValue: 'v1', description: 'Docker image tag')
    }

    stages {

        stage('Checkout') {
            steps {
                git branch: "${params.BRANCH}",
                    url: 'https://github.com/codebreaker939/helixai.git'
            }
        }

        stage('Build Docker Image') {
            steps {
                sh "docker build -t helixai-api:${params.DOCKER_TAG} ./app"
            }
        }

        stage('Push Docker Image') {
            steps {
                sh "docker push helixai-api:${params.DOCKER_TAG}"
            }
        }

    }

    post {
        success {
            echo 'Pipeline completed successfully!'
        }
        failure {
            echo 'Pipeline failed. Please check the logs.'
        }
    }
}
