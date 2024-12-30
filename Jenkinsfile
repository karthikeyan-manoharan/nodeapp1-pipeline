pipeline {
    agent any

    environment {
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

        stage('Install Dependencies') {
            steps {
                sh '''
                    npm install
                    npm install selenium-webdriver @types/selenium-webdriver
                    npm install chromedriver
                    npm audit fix --force
                '''
            }
        }

        stage('Install ChromeDriver') {
            steps {
                script {
                    sh '''
                        CHROME_VERSION=$("${CHROME_BIN}" --version | awk '{print $3}')
                        CHROME_MAJOR_VERSION=$(echo $CHROME_VERSION | cut -d. -f1)
                        echo "Chrome version: $CHROME_VERSION"
                        echo "Chrome major version: $CHROME_MAJOR_VERSION"
                        
                        CHROMEDRIVER_VERSION=$(curl -sS "https://chromedriver.storage.googleapis.com/LATEST_RELEASE_${CHROME_MAJOR_VERSION}")
                        echo "Required ChromeDriver version: $CHROMEDRIVER_VERSION"
                        
                        INSTALLED_CHROMEDRIVER_VERSION=$(npm ls chromedriver | grep chromedriver | awk '{print $2}' | sed 's/[^0-9.]//g')
                        echo "Installed ChromeDriver version: $INSTALLED_CHROMEDRIVER_VERSION"
                        
                        if [ "$CHROMEDRIVER_VERSION" != "$INSTALLED_CHROMEDRIVER_VERSION" ]; then
                            echo "ChromeDriver version mismatch. Installing correct version..."
                            npm install chromedriver@$CHROMEDRIVER_VERSION
                        fi
                        
                        mkdir -p ${CHROMEDRIVER_DIR}
                        cp ./node_modules/chromedriver/lib/chromedriver/chromedriver ${CHROMEDRIVER_BIN}
                        chmod +x ${CHROMEDRIVER_BIN}
                        
                        echo "Installed Chrome version:"
                        "${CHROME_BIN}" --version
                        echo "Installed ChromeDriver version:"
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