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
                    # Update package list
                    sudo apt-get update

                    # Remove existing Chrome
                    sudo apt-get remove -y google-chrome-stable
                    sudo apt-get purge -y google-chrome-stable

                    # Install Chrome 114 (a stable version with available ChromeDriver)
                    wget https://dl.google.com/linux/chrome/deb/pool/main/g/google-chrome-stable/google-chrome-stable_114.0.5735.198-1_amd64.deb
                    sudo dpkg -i google-chrome-stable_114.0.5735.198-1_amd64.deb
                    sudo apt-get install -f -y

                    # Install matching ChromeDriver
                    wget https://chromedriver.storage.googleapis.com/114.0.5735.90/chromedriver_linux64.zip
                    unzip chromedriver_linux64.zip
                    sudo mv chromedriver /usr/local/bin/
                    sudo chown root:root /usr/local/bin/chromedriver
                    sudo chmod +x /usr/local/bin/chromedriver

                    # Clean up
                    rm google-chrome-stable_114.0.5735.198-1_amd64.deb chromedriver_linux64.zip

                    # Verify versions
                    google-chrome --version
                    chromedriver --version
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
                sh 'npm run test:selenium'
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