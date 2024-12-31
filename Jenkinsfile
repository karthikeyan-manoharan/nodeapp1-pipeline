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
        
	    // Add these new variables
        NODE_OPTIONS = '--max-old-space-size=4096'
        NPM_CONFIG_PREFIX = "${WORKSPACE}/.npm-global"
        PATH = "${WORKSPACE}/.npm-global/bin:${env.PATH}"
    
        DEPLOYMENT_SUCCESS = 'false'
        TESTS_SUCCESS = 'false'
        APP_PID = ''
    }
    stages {
        stage('Debug Info') {
            steps {
                sh 'git branch --show-current'
                sh 'echo $GIT_BRANCH'
                sh 'echo $BRANCH_NAME'
            }
        }
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
                    npm config set prefix "${NPM_CONFIG_PREFIX}"
                    npm install --no-fund
                    npm install --save-dev selenium-webdriver @types/selenium-webdriver
                    npm install -g concurrently wait-on
                '''
            }
        }

        stage('Run Tests') {
            parallel {
                stage('Unit Tests') {
                    steps {
                        script {
                            try {
                                sh 'npm run test'
                                echo "Unit tests passed"
                            } catch (Exception e) {
                                echo "Unit tests failed: ${e.getMessage()}"
                                currentBuild.result = 'UNSTABLE'
                            }
                        }
                    }
                }
                stage('Coverage Tests') {
                    steps {
                        script {
                            try {
                                sh 'npm run test:coverage'
                                echo "Coverage tests passed"
                            } catch (Exception e) {
                                echo "Coverage tests failed: ${e.getMessage()}"
                                currentBuild.result = 'UNSTABLE'
                            }
                        }
                    }
                }
              /*  stage('Selenium Tests') {
                    steps {
                        script {
                            try {
                                sh '''
                                    set -x
                                    export CHROME_BIN=${CHROME_BIN}
                                    export CHROMEDRIVER_BIN=${CHROMEDRIVER_BIN}
                                    concurrently --kill-others --success first "npm start" "wait-on http://localhost:3000 && jest tests/selenium.test.ts"
                                '''
                                echo "Selenium tests passed"
                            } catch (Exception e) {
                                echo "Selenium tests failed: ${e.getMessage()}"
                                currentBuild.result = 'UNSTABLE'
                            }
                        }
                    }
                }
            }
        */ }
        stage('Deploy to Dev') {
            when {
                branch 'develop'
            }
            steps {
                script {
                    echo "Starting deployment to Dev"
                    try {
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
                                
                                # Deploy the dist.zip file
                                az webapp deployment source config-zip --resource-group ${AZURE_RESOURCE_GROUP} --name ${AZURE_WEBAPP_NAME} --src dist.zip
                                
                                # Get and print the app URL
                                APP_URL=$(az webapp show --name ${AZURE_WEBAPP_NAME} --resource-group ${AZURE_RESOURCE_GROUP} --query "defaultHostName" -o tsv)
                                echo "App URL: https://$APP_URL"
                            '''
                            env.DEPLOYMENT_SUCCESS = 'true'
                            env.APP_URL = sh(script: 'az webapp show --name ${AZURE_WEBAPP_NAME} --resource-group ${AZURE_RESOURCE_GROUP} --query "defaultHostName" -o tsv', returnStdout: true).trim()
                            echo "Deployment successful. APP_URL: ${env.APP_URL}"
                        }
                    } catch (Exception e) {
                        echo "Deployment failed: ${e.getMessage()}"
                        error "Deployment failed"
                    }
                }
            }
        }

        stage('Run Automated Tests on Dev') {
            when {
                branch 'develop'
                expression { env.DEPLOYMENT_SUCCESS == 'true' }
            }
            steps {
                script {
                    echo "Starting automated tests on Dev"
                    try {
                        sh """
                            export APP_URL=https://${env.APP_URL}
                            npm run test
                            npm run test:coverage
                            npm run test:selenium
                        """
                        env.TESTS_SUCCESS = 'true'
                        echo "Automated tests on Dev passed"
                    } catch (Exception e) {
                        echo "Tests failed: ${e.getMessage()}"
                        error "Tests failed"
                    }
                }
            }
        }

        stage('Manual Testing Approval') {
            when {
                branch 'develop'
                expression { env.DEPLOYMENT_SUCCESS == 'true' && env.TESTS_SUCCESS == 'true' }
            }
            steps {
                script {
                    echo "Application is ready for manual testing at https://${env.APP_URL}"
                    echo "Please perform your manual tests and approve or reject the deployment."
                    
                    timeout(time: 24, unit: 'HOURS') {
                        input message: "Have you completed manual testing? (Application URL: https://${env.APP_URL})", ok: "Manual Testing Complete"
                    }
                }
            }
        }
        
        stage('Delete Azure Resources') {
            when {
                branch 'develop'
                expression { env.DEPLOYMENT_SUCCESS == 'true' && env.TESTS_SUCCESS == 'true' }
            }
            steps {
                script {
                    echo "Starting Azure resource deletion process"
                    try {
                        timeout(time: 1, unit: 'HOURS') {
                            input message: "Do you want to delete the Azure resources?", ok: "Yes, delete resources"
                        }
                        withCredentials([azureServicePrincipal('azure-credentials')]) {
                            sh '''
                                az login --service-principal -u $AZURE_CLIENT_ID -p $AZURE_CLIENT_SECRET -t $AZURE_TENANT_ID
                                
                                # Delete the Web App
                                az webapp delete --name ${AZURE_WEBAPP_NAME} --resource-group ${AZURE_RESOURCE_GROUP}
                                
                                # Delete the App Service Plan
                                az appservice plan delete --name ${AZURE_APP_PLAN} --resource-group ${AZURE_RESOURCE_GROUP} --yes
                                
                                # Delete the Resource Group
                                az group delete --name ${AZURE_RESOURCE_GROUP} --yes --no-wait
                                
                                echo "Azure resources deletion initiated"
                            '''
                        }
                    } catch (Exception e) {
                        echo "Resource deletion skipped or failed: ${e.getMessage()}"
                    }
                }
            }
        }
    }
    
    post {
        failure {
            script {
                if (env.DEPLOYMENT_SUCCESS == 'true' && env.TESTS_SUCCESS == 'false') {
                    echo "Tests failed, initiating rollback..."
                    withCredentials([azureServicePrincipal('azure-credentials')]) {
                        sh '''
                            az login --service-principal -u $AZURE_CLIENT_ID -p $AZURE_CLIENT_SECRET -t $AZURE_TENANT_ID
                            
                            # Rollback to the previous deployment
                            az webapp deployment slot swap --resource-group ${AZURE_RESOURCE_GROUP} --name ${AZURE_WEBAPP_NAME} --slot production --target-slot staging
                            
                            echo "Rollback completed"
                        '''
                    }
                }
                echo 'Pipeline failed!'
            }
        }
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
    }
}