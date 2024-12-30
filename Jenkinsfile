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
                        echo "Checking for Chrome installation..."
                        
                        # Check common locations for Chrome
                        CHROME_FOUND=false
                        for loc in "/usr/bin/google-chrome" "/usr/bin/google-chrome-stable" "/opt/google/chrome/google-chrome"; do
                            if [ -x "$loc" ]; then
                                echo "Chrome found at: $loc"
                                export CHROME_BIN="$loc"
                                CHROME_FOUND=true
                                break
                            fi
                        done
                        
                        if [ "$CHROME_FOUND" = false ]; then
                            echo "Chrome not found in common locations. Checking PATH..."
                            if command -v google-chrome > /dev/null 2>&1; then
                                CHROME_BIN=$(command -v google-chrome)
                                echo "Chrome found in PATH: $CHROME_BIN"
                                CHROME_FOUND=true
                            elif command -v google-chrome-stable > /dev/null 2>&1; then
                                CHROME_BIN=$(command -v google-chrome-stable)
                                echo "Chrome found in PATH: $CHROME_BIN"
                                CHROME_FOUND=true
                            fi
                        fi
                        
                        if [ "$CHROME_FOUND" = false ]; then
                            echo "Chrome is not installed or not accessible. Please install Chrome manually."
                            exit 1
                        fi
                        
                        # Get Chrome version
                        CHROME_VERSION=$("$CHROME_BIN" --version | awk '{print $3}')
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
                        "$CHROME_BIN" --version
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