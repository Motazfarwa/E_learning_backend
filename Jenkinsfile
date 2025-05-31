pipeline {
    agent {
        docker {
            image 'node:18'
            args '-v /var/run/docker.sock:/var/run/docker.sock'
        }
    }
    
    environment {
        SONAR_PROJECT_KEY = 'node-app-token'
        SONAR_SCANNER_HOME = tool 'SonarQubeScanner'
    }
    
    stages {
        stage('Prepare Workspace') {
            steps {
                deleteDir()
                sh 'apt-get update && apt-get install -y git docker.io'
            }
        }
        
        stage('Checkout Code') {
            steps {
                git(
                    branch: 'mootaz',
                    url: 'https://github.com/Motazfarwa/E_learning_backend.git',
                    credentialsId: 'github-cred'
                )
            }
        }
        
        stage('Install Dependencies') {
            steps {
                sh 'npm install'
            }
        }
        
        stage('SonarQube Analysis') {
            steps {
                withCredentials([string(credentialsId: 'node-app-token', variable: 'SONAR_TOKEN')]) {
                    withSonarQubeEnv('SonarQube') {
                        sh """
                            ${SONAR_SCANNER_HOME}/bin/sonar-scanner \
                            -Dsonar.projectKey=${SONAR_PROJECT_KEY} \
                            -Dsonar.sources=. \
                            -Dsonar.host.url=http://localhost:9000 \
                            -Dsonar.login=${SONAR_TOKEN}
                        """
                    }
                }
            }
        }
        
        stage('Build Docker Image') {
            steps {
                script {
                    // Ensure consistent naming (fixed typo from mootezfarwa to mootazfarwa)
                    dockerImage = docker.build("mootazfarwa/noderepo:${env.BUILD_ID}")
                }
            }
        }
        
        stage('Push to Docker Hub') {
            steps {
                withCredentials([usernamePassword(
                    credentialsId: 'dockerhub-mootezfarwa',
                    passwordVariable: 'DOCKER_PASSWORD',
                    usernameVariable: 'DOCKER_USERNAME'
                )]) {
                    sh '''
                        echo "$DOCKER_PASSWORD" | docker login -u "$DOCKER_USERNAME" --password-stdin
                        docker push mootazfarwa/noderepo:${BUILD_ID}
                    '''
                }
            }
        }
        
        stage('Cleanup') {
            steps {
                cleanWs()
            }
        }
    }
    
    post {
        success {
            echo '✅ Build and push completed successfully!'
        }
        failure {
            echo '❌ Pipeline failed. Check logs for details.'
        }
    }
}
