pipeline {
    agent any

    environment {
        CHROME_VERSION = "131.0.6778.204-1"
        CHROMEDRIVER_VERSION = "131.0.6778.0"
        CHROME_BIN = "${WORKSPACE}/google-chrome"
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
                    # Download and extract Chrome
                    wget -q -O chrome.deb https://dl.google.com/linux/chrome/deb/pool/main/g/google-chrome-stable/google-chrome-stable_${CHROME_VERSION}_amd64.deb
                    dpkg -x chrome.deb ${WORKSPACE}/chrome
                    ln -s ${WORKSPACE}/chrome/opt/google/chrome/chrome ${CHROME_BIN}

                    # Install ChromeDriver
                    mkdir -p ${CHROMEDRIVER_DIR}
                    wget -q -O chromedriver.zip https://edgedl.me.gvt1.com/edgedl/chrome/chrome-for-testing/${CHROMEDRIVER_VERSION}/linux64/chromedriver-linux64.zip
                    unzip -q -o chromedriver.zip -d ${CHROMEDRIVER_DIR}
                    mv ${CHROMEDRIVER_DIR}/chromedriver-linux64/chromedriver ${CHROMEDRIVER_BIN}
                    rm -rf ${CHROMEDRIVER_DIR}/chromedriver-linux64
                    chmod +x ${CHROMEDRIVER_BIN}

                    # Verify installed versions
                    echo "Installed Chrome version:"
                    ${CHROME_BIN} --version
                    echo "Installed ChromeDriver version:"
                    ${CHROMEDRIVER_BIN} --version
                '''
            }
        }

        stage('Install Dependencies') {
            steps {
                sh 'npm install'
            }
        }

        stage('Build') {
            steps {
                sh 'npm run build'
            }
        }

        stage('Test') {
            steps {
                sh '''
                    export CHROME_BIN=${CHROME_BIN}
                    export CHROMEDRIVER_BIN=${CHROMEDRIVER_BIN}
                    npm test
                '''
            }
        }
    }

    post {
        always {
            cleanWs()
        }
    }
}