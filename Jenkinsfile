pipeline {
    agent any

    environment {
        CHROME_BIN = "/usr/bin/google-chrome"
        CHROMEDRIVER_DIR = "${WORKSPACE}/chromedriver"
        CHROMEDRIVER_BIN = "${CHROMEDRIVER_DIR}/chromedriver"
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
                script {
                    sh '''
                        # Check if Chrome is installed
                        if ! command -v google-chrome &> /dev/null; then
                            echo "Chrome is not installed. Please install Chrome manually."
                            exit 1
                        fi

                        # Get Chrome version
                        CHROME_VERSION=$(google-chrome --version | awk '{print $3}')
                        echo "Chrome version: $CHROME_VERSION"
                        
                        # Install ChromeDriver
                        CHROMEDRIVER_VERSION=$(curl -sS chromedriver.storage.googleapis.com/LATEST_RELEASE_${CHROME_VERSION%%.*})
                        echo "ChromeDriver version: $CHROMEDRIVER_VERSION"
                        wget -N -q "https://chromedriver.storage.googleapis.com/${CHROMEDRIVER_VERSION}/chromedriver_linux64.zip"
                        unzip -o -q chromedriver_linux64.zip -d ${CHROMEDRIVER_DIR}
                        chmod +x ${CHROMEDRIVER_BIN}
                        
                        # Clean up
                        rm chromedriver_linux64.zip
                        
                        # Verify versions
                        google-chrome --version
                        ${CHROMEDRIVER_BIN} --version
                    '''
                }
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
                    export CHROME_BIN=${CHROME_BIN}
                    export CHROMEDRIVER_PATH=${CHROMEDRIVER_BIN}
                    npm run test:selenium
                '''
            }
        }
    }
}