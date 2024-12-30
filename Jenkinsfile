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
                script {
                    def chromeInstalled = fileExists('/usr/bin/google-chrome')
                    if (!chromeInstalled) {
                        sh '''
                            # Download and install Chrome
                            wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | sudo apt-key add -
                            sudo sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google-chrome.list'
                            sudo apt-get update
                            sudo apt-get install -y google-chrome-stable
                        '''
                    }
                    
                    sh '''
                        # Get Chrome version
                        CHROME_VERSION=$(google-chrome --version | awk '{print $3}')
                        echo "Chrome version: $CHROME_VERSION"
                        
                        # Install ChromeDriver
                        CHROMEDRIVER_VERSION=$(curl -sS chromedriver.storage.googleapis.com/LATEST_RELEASE_${CHROME_VERSION%%.*})
                        echo "ChromeDriver version: $CHROMEDRIVER_VERSION"
                        wget -N -q "https://chromedriver.storage.googleapis.com/${CHROMEDRIVER_VERSION}/chromedriver_linux64.zip"
                        unzip -o -q chromedriver_linux64.zip -d $WORKSPACE/chromedriver
                        chmod +x $WORKSPACE/chromedriver/chromedriver
                        
                        # Clean up
                        rm chromedriver_linux64.zip
                        
                        # Verify versions
                        google-chrome --version
                        $WORKSPACE/chromedriver/chromedriver --version
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
                    export CHROME_BIN=$(which google-chrome)
                    export CHROMEDRIVER_PATH=$WORKSPACE/chromedriver/chromedriver
                    npm run test:selenium
                '''
            }
        }
    }
}