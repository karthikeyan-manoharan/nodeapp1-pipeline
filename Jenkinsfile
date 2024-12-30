pipeline {
    agent any

    environment {
        CHROME_VERSION = '114.0.5735.90'
        CHROMEDRIVER_VERSION = '114.0.5735.90'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }
        stage('Install Dependencies') {
            steps {
                sh 'npm install'
            }
        }
        stage('Install Chrome and ChromeDriver') {
            steps {
                sh '''
                    # Download and install Chrome
                    wget https://dl.google.com/linux/chrome/deb/pool/main/g/google-chrome-stable/google-chrome-stable_${CHROME_VERSION}-1_amd64.deb
                    dpkg -x google-chrome-stable_${CHROME_VERSION}-1_amd64.deb $WORKSPACE/chrome
                    
                    # Install ChromeDriver
                    wget -N "https://chromedriver.storage.googleapis.com/${CHROMEDRIVER_VERSION}/chromedriver_linux64.zip"
                    unzip -o chromedriver_linux64.zip -d $WORKSPACE/chromedriver
                    chmod +x $WORKSPACE/chromedriver/chromedriver
                    
                    # Clean up
                    rm google-chrome-stable_${CHROME_VERSION}-1_amd64.deb chromedriver_linux64.zip
                    
                    # Verify versions
                    ${WORKSPACE}/chrome/opt/google/chrome/chrome --version
                    ${WORKSPACE}/chromedriver/chromedriver --version
                    
                    # Set environment variables for Selenium tests
                    export CHROME_BIN=${WORKSPACE}/chrome/opt/google/chrome/chrome
                    export CHROMEDRIVER_PATH=${WORKSPACE}/chromedriver/chromedriver
                '''
            }
        }
        stage('Build') {
            steps {
                sh 'npm run build'
            }
        }
        stage('Unit Tests') {
            steps {
                sh 'npm run test:coverage'
            }
        }
        stage('Selenium Tests') {
            steps {
                sh '''
                    export CHROME_BIN=${WORKSPACE}/chrome/opt/google/chrome/chrome
                    export CHROMEDRIVER_PATH=${WORKSPACE}/chromedriver/chromedriver
                    npm run test:selenium
                '''
            }
        }
    }

    post {
        success {
            echo 'Pipeline succeeded! The application is ready for deployment.'
        }
        failure {
            echo 'Pipeline failed. Please check the logs for details.'
        }
    }
}