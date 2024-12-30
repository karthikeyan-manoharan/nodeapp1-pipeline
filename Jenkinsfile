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
                    # Wait for apt lock to be released
                    while sudo lsof /var/lib/dpkg/lock-frontend >/dev/null 2>&1; do
                        echo "Waiting for apt lock to be released..."
                        sleep 5
                    done

                    # Update package list
                    sudo apt-get update

                    # Remove existing Chrome
                    sudo apt-get remove -y google-chrome-stable || true
                    sudo apt-get purge -y google-chrome-stable || true

                    # Add Google Chrome repository
                    wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | sudo apt-key add -
                    sudo sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list'

                    # Update package list again
                    sudo apt-get update

                    # Install the latest stable Chrome
                    sudo apt-get install -y google-chrome-stable

                    # Get Chrome version
                    CHROME_VERSION=$(google-chrome --version | awk '{print $3}' | cut -d. -f1-3)

                    # Install matching ChromeDriver
                    CHROMEDRIVER_VERSION=$(curl -sS chromedriver.storage.googleapis.com/LATEST_RELEASE_$CHROME_VERSION)
                    wget https://chromedriver.storage.googleapis.com/$CHROMEDRIVER_VERSION/chromedriver_linux64.zip
                    unzip chromedriver_linux64.zip
                    sudo mv chromedriver /usr/local/bin/
                    sudo chown root:root /usr/local/bin/chromedriver
                    sudo chmod +x /usr/local/bin/chromedriver

                    # Clean up
                    rm chromedriver_linux64.zip

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