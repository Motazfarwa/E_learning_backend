pipeline {
	agent any
	tools {
		nodejs 'NodeJS'
	}
	environment {
		SONAR_PROJECT_KEY = 'node-app-token'
		SONAR_SCANNER_HOME = tool 'SonarQubeScanner'
	}

	stages {
		stage('Checkout Github'){
			steps {
				git branch: 'mootaz', credentialsId: 'github-cred', url: 'https://github.com/Motazfarwa/E_learning_backend.git'
			}
		}
		
		stage('Install node dependencies'){
			steps {
				sh 'npm install'
			}
		}
		
		stage('SonarQube Analysis'){
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
	}
	post {
		success {
			echo 'Build completed succesfully!'
		}
		failure {
			echo 'Build failed. Check logs.'
		}
	}
}
