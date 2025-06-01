pipeline {
	agent any
	
	environment {
		SONAR_PROJECT_KEY = 'node-app'
		SONAR_SCANNER_HOME = tool 'SonarQubeScanner'
	}

	stages {
		stage('Checkout Github'){
			steps {
				git branch: 'mootaz',  url: 'https://github.com/Motazfarwa/E_learning_backend.git'
			}
		}
		
		stage('Install node dependencies'){
			steps {
				sh 'npm install'
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
