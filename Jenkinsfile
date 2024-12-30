pipeline {
    agent any

    environment {
        CHROME_VERSION = "131.0.6778.204-1"
        CHROMEDRIVER_VERSION = "131.0.6778.0"
        CHROME_BIN = "/usr/bin/google-chrome-stable"
        CHROMEDRIVER_DIR = "${WORKSPACE}/chromedriver"
        CHROMEDRIVER_BIN = "${CHROMEDRIVER_DIR}/chromedriver"
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Install Chrome and ChromeDriver') {
            steps {
                sh '''
                    # Add Google Chrome repository
                    wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | sudo apt-key add -
                    sudo sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" > /etc/apt/sources.list.d/google-chrome.list'

                    # Update package list
                    sudo apt-get update

                    # Install specific version of Chrome
                    sudo apt-get install -y google-chrome-stable=${CHROME_VERSION}
                    sudo apt-mark hold google-chrome-stable

                    # Install specific version of ChromeDriver
                    mkdir -p ${CHROMEDRIVER_DIR}
                    wget -q -O /tmp/chromedriver.zip https://edgedl.me.gvt1.com/edgedl/chrome/chrome-for-testing/${CHROMEDRIVER_VERSION}/linux64/chromedriver-linux64.zip
                    unzip -q -o /tmp/chromedriver.zip -d ${CHROMEDRIVER_DIR}
                    mv ${CHROMEDRIVER_DIR}/chromedriver-linux64/chromedriver ${CHROMEDRIVER_BIN}
                    rm -rf ${CHROMEDRIVER_DIR}/chromedriver-linux64
                    rm /tmp/chromedriver.zip
                    chmod +x ${CHROMEDRIVER_BIN}

                    # Verify installed versions
                    echo "Installed Chrome version:"
                    ${CHROME_BIN} --version
                    echo "Installed ChromeDriver version:"
                    ${CHROMEDRIVER_BIN} --version
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
                    export CHROME_BIN=${CHROME_BIN}
                    export CHROMEDRIVER_PATH=${CHROMEDRIVER_BIN}
                    npm run test:selenium
                '''
            }
        }
    }

    post {
        always {
            cleanWs()
        }
        success {
            echo 'Pipeline succeeded!'
        }
        failure {
            echo 'Pipeline failed!'
        }
    }
}