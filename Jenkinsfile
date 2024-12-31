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
                sh '''
                    npm install
                    npm install --save-dev selenium-webdriver @types/selenium-webdriver
                '''
            }
        }
        stage('Build') {
            steps {
                sh 'npm run build'
            }
        }
        stage('Start Application') {
            steps {
                sh '''
                    npm run build
                    nohup npm start &
                    echo $! > .pidfile
                    sleep 10  # Give the app some time to start
                '''
            }
        }
        stage('Test') {
            steps {
                sh '''
                    export CHROME_BIN=${CHROME_BIN}
                    export CHROMEDRIVER_BIN=${CHROMEDRIVER_BIN}
                    export PATH=$PATH:${CHROMEDRIVER_DIR}
                    echo "Chrome binary path: ${CHROME_BIN}"
                    echo "ChromeDriver binary path: ${CHROMEDRIVER_BIN}"
                    echo "PATH: $PATH"
                    echo "Chrome version:"
                    ${CHROME_BIN} --version
                    echo "ChromeDriver version:"
                    ${CHROMEDRIVER_BIN} --version
                    echo "Running tests..."
                    npm run test || (echo "Test failed. Printing error logs:"; find . -name "*.log" -type f -print0 | xargs -0 cat; exit 1)
                    npm run test:coverage
                    npm run test:all
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
                '''
            }
        }
        stage('Debug File Location') {
            steps {
                sh '''
                    echo "Current working directory:"
                    pwd
                    echo "Contents of current directory:"
                    ls -la
                    echo "Contents of dist directory (if it exists):"
                    ls -la dist || echo "dist directory does not exist"
                '''
            }
        }
        stage('Create Zip') {
            steps {
                sh '''
                    npm run create-zip
                    echo "Contents of current directory after zip creation:"
                    ls -la
                    echo "Location of dist.zip:"
                    find . -name dist.zip
                '''
            }
        }
        stage('Register Resource Providers') {
            when {
                expression {
                     return sh(script: 'az provider show -n Microsoft.Web --query "registrationState" -o tsv', returnStdout: true).trim() != "Registered"
                }
            }
            steps {
                withCredentials([azureServicePrincipal('azure-credentials')]) {
                    sh '''
                        az login --service-principal -u $AZURE_CLIENT_ID -p $AZURE_CLIENT_SECRET -t $AZURE_TENANT_ID
                        az provider register --namespace Microsoft.Web
                        az provider register --namespace Microsoft.OperationsManagement
                        az provider register --namespace Microsoft.OperationalInsights
                    '''
                }
            }
        }
        stage('Create or Update Azure Resources') {
            when {
                branch 'develop'
            }
            steps {
                withCredentials([azureServicePrincipal('azure-credentials')]) {
                    sh '''
                        az login --service-principal -u $AZURE_CLIENT_ID -p $AZURE_CLIENT_SECRET -t $AZURE_TENANT_ID
                        
                        # Create Resource Group if it doesn't exist
                        az group create --name ${AZURE_RESOURCE_GROUP} --location ${AZURE_LOCATION}
                        
                        # Create or update App Service Plan
                        az appservice plan create --name ${AZURE_APP_PLAN} --resource-group ${AZURE_RESOURCE_GROUP} --sku ${AZURE_APP_SKU} --is-linux
                        
                        # Create or update Web App
                        az webapp create --name ${AZURE_WEBAPP_NAME} --resource-group ${AZURE_RESOURCE_GROUP} --plan ${AZURE_APP_PLAN} --runtime "NODE|14-lts"
                        az webapp config appsettings set --name ${AZURE_WEBAPP_NAME} --resource-group ${AZURE_RESOURCE_GROUP} --settings WEBSITE_NODE_DEFAULT_VERSION=14-lts
                        az webapp config set --name ${AZURE_WEBAPP_NAME} --resource-group ${AZURE_RESOURCE_GROUP} --always-on true
                        az webapp log config --name ${AZURE_WEBAPP_NAME} --resource-group ${AZURE_RESOURCE_GROUP} --web-server-logging filesystem
                        
                        # Get and print the app URL
                        APP_URL=$(az webapp show --name ${AZURE_WEBAPP_NAME} --resource-group ${AZURE_RESOURCE_GROUP} --query "defaultHostName" -o tsv)
                        echo "App URL: https://$APP_URL"
                        
                        # Print resource creation logs
                        az monitor activity-log list --resource-group ${AZURE_RESOURCE_GROUP} --start-time $(date -d "1 hour ago" -u +"%Y-%m-%dT%H:%M:%S") --query "[].{Operation:operationName.localizedValue, Status:status.localizedValue, Timestamp:eventTimestamp}" -o table
                    '''
                }
            }
        }
        stage('Deploy to Dev') {
            when {
                branch 'develop'
            }
            steps {
                script {
                    echo "Current branch: ${env.BRANCH_NAME}"
                    echo "Starting deployment to Dev"
                    try {
                        withCredentials([azureServicePrincipal('azure-credentials')]) {
                            sh '''
                                # Find the dist.zip file
                                ZIP_PATH=$(find . -name dist.zip)
                                if [ -z "$ZIP_PATH" ]; then
                                    echo "dist.zip not found"
                                    exit 1
                                fi
                                echo "dist.zip found at: $ZIP_PATH"
                                # Azure CLI commands
                                az login --service-principal -u $AZURE_CLIENT_ID -p $AZURE_CLIENT_SECRET -t $AZURE_TENANT_ID
                                az webapp deploy --resource-group $AZURE_RESOURCE_GROUP --name $AZURE_WEBAPP_NAME --src-path "$ZIP_PATH" --type zip
                                APP_URL=$(az webapp show --name $AZURE_WEBAPP_NAME --resource-group $AZURE_RESOURCE_GROUP --query "defaultHostName" -o tsv)
                                echo "App URL: https://$APP_URL"
                            '''
                            env.DEPLOYMENT_SUCCESS = 'true'
                            env.APP_URL = sh(script: 'az webapp show --name $AZURE_WEBAPP_NAME --resource-group $AZURE_RESOURCE_GROUP --query "defaultHostName" -o tsv', returnStdout: true).trim()
                            echo "Deployment successful. APP_URL: ${env.APP_URL}"
                        }
                    } catch (Exception e) {
                        echo "Deployment failed: ${e.getMessage()}"
                        error "Deployment failed"
                    }
                }
            }
        }
        stage('Run Tests on Dev') {
            when {
                branch 'develop'
            }
            steps {
                sh 'npm run test'
            }
        }
    }
    post {
        always {
            withCredentials([azureServicePrincipal('azure-credentials')]) {
                sh '''
                    az login --service-principal -u $AZURE_CLIENT_ID -p $AZURE_CLIENT_SECRET -t $AZURE_TENANT_ID
                    
                    # Get Azure cost for the day
                    COST=$(az consumption usage list --start-date $(date -d "today" '+%Y-%m-%d') --end-date $(date -d "tomorrow" '+%Y-%m-%d') --query "[].{Cost:pretaxCost}" -o tsv | awk '{sum += $1} END {print sum}')
                    echo "Today's Azure cost: $COST"
                '''
            }
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