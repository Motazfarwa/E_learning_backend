pipeline {
    agent any

    environment {
        SONAR_PROJECT_KEY = 'node-app'
        SONAR_SCANNER_HOME = tool 'SonarQubeScanner'
        DOCKER_IMAGE = "mootezfarwa/noderepo"
        DOCKER_TAG = "latest"
    }

    stages {
        stage('Checkout Github') {
            steps {
                git branch: 'mootaz', url: 'https://github.com/Motazfarwa/E_learning_backend.git'
            }
        }

        stage('Install node dependencies') {
            steps {
                sh 'npm install'
            }
        }

            stage('SonarQube Analysis') {
            steps {
                withCredentials([string(credentialsId: 'node-app-token', variable: 'SONAR_TOKEN')]) {
                    withSonarQubeEnv('SonarQube') {
                        script {
                            def scannerHome = tool 'SonarQubeScanner'
                            sh """
                                ${scannerHome}/bin/sonar-scanner \\
                                -Dsonar.projectKey=${env.SONAR_PROJECT_KEY} \\
                                -Dsonar.sources=. \\
                                -Dsonar.host.url=http://192.168.1.2:9000 \\
                                -Dsonar.token=$SONAR_TOKEN
                            """
                        }
                    }
                }
            }
        }


        stage('Build Docker Image') {
            steps {
                sh "docker build -t ${DOCKER_IMAGE}:${DOCKER_TAG} ."
            }
        }

        stage('Docker Login') {
            steps {
                withCredentials([usernamePassword(credentialsId: 'dockerhub-mootezfarwa', usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS')]) {
                    sh 'echo $DOCKER_PASS | docker login -u $DOCKER_USER --password-stdin'
                }
            }
        }

        stage('Push Docker Image') {
            steps {
                sh "docker push ${DOCKER_IMAGE}:${DOCKER_TAG}"
            }
        }
    }

    post {
        success {
            echo 'Build completed successfully!'
        }
        failure {
            echo 'Build failed. Check logs.'
        }
    }
}
