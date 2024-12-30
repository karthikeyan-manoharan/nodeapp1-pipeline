pipeline {
    agent any

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
                    wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb
                    dpkg -x google-chrome-stable_current_amd64.deb chrome-linux

                    # Get Chrome version
                    CHROME_VERSION=$(./chrome-linux/opt/google/chrome/chrome --version | awk '{print $3}' | cut -d. -f1-3)

                    # Install matching ChromeDriver
                    CHROMEDRIVER_VERSION=$(curl -sS chromedriver.storage.googleapis.com/LATEST_RELEASE_$CHROME_VERSION)
                    wget https://chromedriver.storage.googleapis.com/$CHROMEDRIVER_VERSION/chromedriver_linux64.zip
                    unzip chromedriver_linux64.zip
                    chmod +x chromedriver

                    # Clean up
                    rm google-chrome-stable_current_amd64.deb chromedriver_linux64.zip

                    # Verify versions
                    ./chrome-linux/opt/google/chrome/chrome --version
                    ./chromedriver --version

                    # Set environment variables for Selenium tests
                    export CHROME_BIN=./chrome-linux/opt/google/chrome/chrome
                    export CHROMEDRIVER_PATH=$PWD/chromedriver
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
                    export CHROME_BIN=./chrome-linux/opt/google/chrome/chrome
                    export CHROMEDRIVER_PATH=$PWD/chromedriver
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
            echo 'Pipeline failed. Please check the console output to fix the issues.'
        }
    }
}