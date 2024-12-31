pipeline {
    agent any
    environment {
        CHROME_VERSION = "131.0.6778.204-1"
        CHROMEDRIVER_VERSION = "131.0.6778.0"
        
        CHROME_BIN = "${WORKSPACE}/google-chrome"
        CHROMEDRIVER_DIR = "${WORKSPACE}/chromedriver"
        CHROMEDRIVER_BIN = "${CHROMEDRIVER_DIR}/chromedriver"
        
        AZURE_WEBAPP_NAME = 'reactjs-express-typescript-app'
        AZURE_RESOURCE_GROUP = 'reactjs-express-typescript-app-rg'
        AZURE_LOCATION = 'uksouth'
        AZURE_APP_PLAN = 'reactjs-express-typescript-app-plan'
        AZURE_APP_SKU = 'B1'
        
        GITHUB_REPO_URL = 'https://github.com/karthikeyan-manoharan/reactjs-express-typescript-app.git'
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
            set -e  # Exit immediately if a command exits with a non-zero status

            # Install Chrome
            wget -q -O chrome.deb https://dl.google.com/linux/chrome/deb/pool/main/g/google-chrome-stable/google-chrome-stable_131.0.6778.204-1_amd64.deb
            dpkg -x chrome.deb ${WORKSPACE}/chrome
            if [ ! -L ${WORKSPACE}/google-chrome ]; then
                ln -s ${WORKSPACE}/chrome/opt/google/chrome/chrome ${WORKSPACE}/google-chrome
            else
                echo "Symbolic link already exists, skipping creation."
            fi

            # Get Chrome version
            CHROME_VERSION=$(${WORKSPACE}/google-chrome --version | awk '{ print $3 }' | awk -F. '{ print $1 }')
            echo "Chrome version: ${CHROME_VERSION}"

            # Download and setup ChromeDriver
            CHROMEDRIVER_VERSION=$(wget -qO- https://chromedriver.storage.googleapis.com/LATEST_RELEASE_${CHROME_VERSION} || echo "")
            if [ -z "${CHROMEDRIVER_VERSION}" ]; then
                echo "Failed to retrieve ChromeDriver version. Using latest version."
                CHROMEDRIVER_VERSION=$(wget -qO- https://chromedriver.storage.googleapis.com/LATEST_RELEASE || echo "")
            fi

            if [ -z "${CHROMEDRIVER_VERSION}" ]; then
                echo "Failed to retrieve ChromeDriver version. Exiting."
                exit 1
            fi

            echo "ChromeDriver version: ${CHROMEDRIVER_VERSION}"
            wget -q -O chromedriver.zip https://chromedriver.storage.googleapis.com/${CHROMEDRIVER_VERSION}/chromedriver_linux64.zip
            unzip -o chromedriver.zip -d ${WORKSPACE}
            chmod +x ${WORKSPACE}/chromedriver

            # Set environment variables
            echo "export CHROME_BIN=${WORKSPACE}/google-chrome" > ${WORKSPACE}/env.sh
            echo "export CHROMEDRIVER_BIN=${WORKSPACE}/chromedriver" >> ${WORKSPACE}/env.sh
            echo "export PATH=\$PATH:${WORKSPACE}" >> ${WORKSPACE}/env.sh

            # Print versions for verification
            echo "Chrome version:"
            ${WORKSPACE}/google-chrome --version
            echo "ChromeDriver version:"
            ${WORKSPACE}/chromedriver --version
        '''
    }
}
       
        stage('Install Dependencies') {
            steps {
                sh '''
                    source ${WORKSPACE}/env.sh
                    npm install
                '''
            }
        }

        stage('Build') {
            steps {
                sh '''
                    source ${WORKSPACE}/env.sh
                    npm run build
                '''
            }
        }

        stage('Start Application') {
            steps {
                sh '''
                    source ${WORKSPACE}/env.sh
                    npm run build
                    nohup npm start &
                    echo $! > .pidfile
                    sleep 10
                '''
            }
        }

        stage('Test') {
            steps {
                sh '''
                    source ${WORKSPACE}/env.sh
                    echo "Chrome binary path: ${CHROME_BIN}"
                    echo "ChromeDriver binary path: ${CHROMEDRIVER_BIN}"
                    echo "PATH: $PATH"
                    echo "Chrome version:"
                    ${CHROME_BIN} --version
                    echo "ChromeDriver version:"
                    ${CHROMEDRIVER_BIN} --version
                    echo "Node version:"
                    node --version
                    echo "NPM version:"
                    npm --version
                    echo "Selenium WebDriver version:"
                    npm list selenium-webdriver
                    echo "Running tests..."
                    npm run test:ci || (echo "Test failed. Printing error logs:"; find . -name "*.log" -type f -print0 | xargs -0 cat; exit 1)
                '''
            }
        }

        stage('Stop Application') {
            steps {
                sh '''
                    if [ -f .pidfile ]; then
                        kill $(cat .pidfile)
                        rm .pidfile
                    fi
                '''
            }
        }
stage('Debug') {
    steps {
        sh '''
            echo "Current directory contents:"
            ls -la
            echo "Node version:"
            node --version
            echo "NPM version:"
            npm --version
            echo "Selenium version:"
            npm list selenium-webdriver
            echo "ChromeDriver version in node_modules:"
            npm list chromedriver
            echo "Global ChromeDriver version:"
            ${CHROMEDRIVER_BIN} --version
        '''
    }
}
stage('Debug File Location') {
    steps {
        sh 'pwd && ls -R'
    }
}
stage('Create Zip') {
    steps {
        sh '''
            echo "Creating zip file..."
            zip -r dist.zip dist
            echo "Zip file created successfully."
        '''
    }
}


        stage('Register Resource Providers') {
            steps {
                withCredentials([azureServicePrincipal('azure-credentials')]) {
                    sh '''
                        echo "Registering resource providers..."
                        az login --service-principal -u $AZURE_CLIENT_ID -p $AZURE_CLIENT_SECRET -t $AZURE_TENANT_ID
                        az account set --subscription $AZURE_SUBSCRIPTION_ID
                        az provider register --namespace Microsoft.Web
                    '''
                }
            }
        }

        stage('Create or Update Azure Resources') {
            steps {
                withCredentials([azureServicePrincipal('azure-credentials')]) {
                    sh '''
                        echo "Creating or updating Azure resources..."
                        az login --service-principal -u $AZURE_CLIENT_ID -p $AZURE_CLIENT_SECRET -t $AZURE_TENANT_ID
                        az account set --subscription $AZURE_SUBSCRIPTION_ID
                        # Add your Azure resource creation/update commands here
                    '''
                }
            }
        }

        stage('Deploy to Dev') {
            steps {
                withCredentials([azureServicePrincipal('azure-credentials')]) {
                    sh '''
                        echo "Deploying to Dev environment..."
                        az login --service-principal -u $AZURE_CLIENT_ID -p $AZURE_CLIENT_SECRET -t $AZURE_TENANT_ID
                        az account set --subscription $AZURE_SUBSCRIPTION_ID
                        # Add your deployment commands here
                    '''
                }
            }
        }

        stage('Run Tests on Dev') {
            steps {
                sh '''
                    echo "Running tests on Dev environment..."
                    # Add your test commands here
                '''
            }
        }
    }

    post {
        always {
            withCredentials([azureServicePrincipal('azure-credentials')]) {
                sh '''
                    echo "Calculating Azure cost..."
                    az login --service-principal -u $AZURE_CLIENT_ID -p $AZURE_CLIENT_SECRET -t $AZURE_TENANT_ID
                    az account set --subscription $AZURE_SUBSCRIPTION_ID
                    START_DATE=$(date -d "today" '+%Y-%m-%d')
                    END_DATE=$(date -d "tomorrow" '+%Y-%m-%d')
                    COST=$(az consumption usage list --start-date $START_DATE --end-date $END_DATE --query "[].{Cost:pretaxCost}" -o tsv | awk '{sum += $1} END {print sum}')
                    echo "Today's Azure cost: $COST"
                '''
            }
            cleanWs()
        }
    }
}