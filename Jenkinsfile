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
                    # Remove existing Chrome
                    apt-get remove -y google-chrome-stable
                    apt-get purge -y google-chrome-stable

                    # Install Chrome 114 (a stable version with available ChromeDriver)
                    wget https://dl.google.com/linux/chrome/deb/pool/main/g/google-chrome-stable/google-chrome-stable_114.0.5735.198-1_amd64.deb
                    dpkg -i google-chrome-stable_114.0.5735.198-1_amd64.deb
                    apt-get install -f -y

                    # Install matching ChromeDriver
                    wget https://chromedriver.storage.googleapis.com/114.0.5735.90/chromedriver_linux64.zip
                    unzip chromedriver_linux64.zip
                    mv chromedriver /usr/local/bin/
                    chown root:root /usr/local/bin/chromedriver
                    chmod +x /usr/local/bin/chromedriver

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
        stage('Start Server and Run Selenium Tests') {
            steps {
                script {
                    def serverProcess = sh(script: 'npm start &', returnStatus: true)
                    sh 'sleep 10' // Wait for the server to start
                    try {
                        sh 'npm run test:selenium'
                    } finally {
                        sh 'pkill -f "node dist/server/index.js"'
                    }
                }
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