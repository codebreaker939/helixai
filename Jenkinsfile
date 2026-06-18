pipeline {
    agent any

    triggers {
        pollSCM('H/2 * * * *')
    }

    parameters {
        string(name: 'BRANCH', defaultValue: 'main', description: 'Git branch to build')
        string(name: 'DOCKER_TAG', defaultValue: 'v1', description: 'Docker image tag')
        booleanParam(name: 'PUSH_IMAGES', defaultValue: false, description: 'Push built images to the configured registry')
        booleanParam(name: 'DEPLOY_TO_KUBERNETES', defaultValue: false, description: 'Deploy validated images to the configured Kubernetes cluster')
    }

    stages {

        stage('Checkout') {
            steps {
                git branch: "${params.BRANCH}",
                    url: 'https://github.com/codebreaker939/helixai.git'
            }
        }

        stage('Install Frontend Dependencies') {
            steps {
                dir('frontend') {
                    sh 'npm ci'
                }
            }
        }

        stage('Frontend Lint') {
            steps {
                dir('frontend') {
                    sh 'npm run lint'
                }
            }
        }

        stage('Frontend Type Check') {
            steps {
                dir('frontend') {
                    sh 'npm run typecheck'
                }
            }
        }

        stage('Frontend Tests') {
            steps {
                dir('frontend') {
                    sh 'npm run test'
                }
            }
        }

        stage('Build Frontend') {
            steps {
                dir('frontend') {
                    sh 'npm run build'
                }
            }
        }

        stage('Build Docker Images') {
            steps {
                sh "docker build -t helixai-api:${params.DOCKER_TAG} ./app"
                sh "docker build -t helixai-frontend:${params.DOCKER_TAG} ./frontend"
            }
        }

        stage('Push Docker Images') {
            when {
                expression { params.PUSH_IMAGES }
            }
            steps {
                sh "docker push helixai-api:${params.DOCKER_TAG}"
                sh "docker push helixai-frontend:${params.DOCKER_TAG}"
            }
        }

        stage('Kubernetes Deployment') {
            when {
                expression { params.DEPLOY_TO_KUBERNETES }
            }
            steps {
                sh 'kubectl apply -f k8s/configmap.yaml'
                sh 'kubectl apply -f k8s/secret.yaml'
                sh 'kubectl apply -f k8s/api-ops-rbac.yaml'
                sh 'kubectl apply -f k8s/postgres-deployment.yaml'
                sh 'kubectl apply -f k8s/service.yaml'
                sh 'kubectl apply -f k8s/api-deployment.yaml'
                sh 'kubectl apply -f k8s/frontend-deployment.yaml'
                sh 'kubectl apply -f k8s/hpa.yaml'
                sh "kubectl set image deployment/helixai-api helixai-api=helixai-api:${params.DOCKER_TAG}"
                sh "kubectl set image deployment/helixai-frontend helixai-frontend=helixai-frontend:${params.DOCKER_TAG}"
            }
        }

        stage('Health Verification') {
            when {
                expression { params.DEPLOY_TO_KUBERNETES }
            }
            steps {
                sh 'kubectl rollout status deployment/helixai-api --timeout=180s'
                sh 'kubectl rollout status deployment/helixai-frontend --timeout=180s'
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
