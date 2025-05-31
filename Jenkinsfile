pipeline {
    agent {
        docker {
            image 'node:18'
            args '-v /var/run/docker.sock:/var/run/docker.sock -v ${JENKINS_HOME}/workspace/${JOB_NAME}:/home/jenkins/agent/workspace'
            reuseNode true
        }
    }

    environment {
        SONAR_PROJECT_KEY = 'node-app-token'
        SONAR_SCANNER_HOME = tool 'SonarQubeScanner'
    }

    stages {
        stage('Checkout Github') {
            steps {
                cleanWs() // Clean before checkout
                dir('/home/jenkins/agent/workspace') {
                    checkout([$class: 'GitSCM',
                        branches: [[name: '*/mootaz']],
                        doGenerateSubmoduleConfigurations: false,
                        extensions: [],
                        userRemoteConfigs: [[
                            credentialsId: 'github-cred',
                            url: 'https://github.com/Motazfarwa/E_learning_backend.git'
                        ]]
                    ])
                }
            }
        }

        stage('Install node dependencies') {
            steps {
                dir('/home/jenkins/agent/workspace') {
                    sh 'npm install'
                }
            }
        }

        stage('SonarQube Analysis') {
            steps {
                dir('/home/jenkins/agent/workspace') {
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
        }

        stage('Build Docker Image') {
            steps {
                dir('/home/jenkins/agent/workspace') {
                    sh 'docker build -t mootezfarwa/noderepo .'
                }
            }
        }

        stage('Push to Docker Hub') {
            steps {
                withCredentials([usernamePassword(credentialsId: 'dockerhub-mootezfarwa', passwordVariable: 'DOCKER_PASSWORD', usernameVariable: 'DOCKER_USERNAME')]) {
                    sh '''
                        echo "$DOCKER_PASSWORD" | docker login -u "$DOCKER_USERNAME" --password-stdin
                        docker push mootezfarwa/noderepo
                    '''
                }
            }
        }

        stage('Clean Workspace') {
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
