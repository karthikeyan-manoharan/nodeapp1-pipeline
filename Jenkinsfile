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
                    # Add Google Chrome repository
                    wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | sudo apt-key add -
                    sudo sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list'
                    
                    # Update package list and install Chrome
                    sudo apt-get update
                    sudo apt-get install -y google-chrome-stable
                    
                    # Install ChromeDriver
                    CHROME_VERSION=$(google-chrome --version | awk '{print $3}' | cut -d. -f1)
                    CHROMEDRIVER_VERSION=$(curl -s "https://chromedriver.storage.googleapis.com/LATEST_RELEASE_${CHROME_VERSION}")
                    wget -N "https://chromedriver.storage.googleapis.com/${CHROMEDRIVER_VERSION}/chromedriver_linux64.zip"
                    unzip -o chromedriver_linux64.zip
                    chmod +x chromedriver
                    
                    # Clean up
                    rm chromedriver_linux64.zip
                    
                    # Verify versions
                    google-chrome --version
                    ./chromedriver --version
                    
                    # Set environment variables for Selenium tests
                    export CHROME_BIN=$(which google-chrome)
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
                    export CHROME_BIN=$(which google-chrome)
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
            echo 'Pipeline failed. Please check the logs for details.'
        }
    }
}