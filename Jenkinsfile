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
        
        NODE_OPTIONS = '--max-old-space-size=4096'
        NPM_CONFIG_PREFIX = "${WORKSPACE}/.npm-global"
        PATH = "${WORKSPACE}/.npm-global/bin:${env.PATH}"
        
        DEPLOYMENT_SUCCESS = 'false'
        TESTS_SUCCESS = 'false'
        APP_PID = ''
        
        // Updated branch detection
        BRANCH_NAME = "${env.GIT_BRANCH?.tokenize('/')?.last() ?: env.BRANCH_NAME}"
    }
    stages {
        stage('Debug Info') {
            steps {
                sh 'git branch --show-current'
                sh 'echo GIT_BRANCH: $GIT_BRANCH'
                sh 'echo BRANCH_NAME: $BRANCH_NAME'
                sh 'git rev-parse --abbrev-ref HEAD'
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
                    wget -q -O chrome.deb https://dl.google.com/linux/chrome/deb/pool/main/g/google-chrome-stable/google-chrome-stable_${CHROME_VERSION}_amd64.deb
                    dpkg -x chrome.deb ${WORKSPACE}/chrome
                    ln -s ${WORKSPACE}/chrome/opt/google/chrome/chrome ${CHROME_BIN}
                    
                    mkdir -p ${CHROMEDRIVER_DIR}
                    wget -q -O chromedriver.zip https://edgedl.me.gvt1.com/edgedl/chrome/chrome-for-testing/${CHROMEDRIVER_VERSION}/linux64/chromedriver-linux64.zip
                    unzip -q -o chromedriver.zip -d ${CHROMEDRIVER_DIR}
                    mv ${CHROMEDRIVER_DIR}/chromedriver-linux64/chromedriver ${CHROMEDRIVER_BIN}
                    rm -rf ${CHROMEDRIVER_DIR}/chromedriver-linux64
                    chmod +x ${CHROMEDRIVER_BIN}
                    
                    echo "Installed Chrome version:"
                    ${CHROME_BIN} --version
                    echo "Installed ChromeDriver version:"
                    ${CHROMEDRIVER_BIN} --version
                '''
            }
        }
        
        stage('Install Dependencies') {
            steps {
                sh 'npm config set prefix ${NPM_CONFIG_PREFIX}'
                sh 'npm install --no-fund'
                sh 'npm install --save-dev selenium-webdriver @types/selenium-webdriver'
                sh 'npm install -g concurrently wait-on start-server-and-test'
            }
        }
        
        stage('Run All Tests') {
            steps {
                script {
                    try {
                        sh '''
                            export CHROME_BIN=${CHROME_BIN}
                            export CHROMEDRIVER_BIN=${CHROMEDRIVER_BIN}
                            npm run test:all
                        '''
                        echo "All tests passed"
                        env.TESTS_SUCCESS = 'true'
                    } catch (Exception e) {
                        echo "Tests failed: ${e.getMessage()}"
                        env.TESTS_SUCCESS = 'false'
                        error "Tests failed"
                    }
                }
            }
        }
		stage('Create Zip') {
			steps {
				sh 'npm run create-zip'
				sh 'ls -l dist.zip'
				sh 'pwd'
			}
		}
       
	   
	   
	   stage('Deploy to Dev') {
			when {
				expression {
					return env.BRANCH_NAME == 'develop'
				}
			}
    steps {
        script {
            echo "Current branch: ${env.BRANCH_NAME}"
            echo "Starting deployment to Dev"
            try {
                withCredentials([azureServicePrincipal('azure-credentials')]) {
                    sh '''
                        az login --service-principal -u $AZURE_CLIENT_ID -p $AZURE_CLIENT_SECRET -t $AZURE_TENANT_ID
                        
                        az group create --name ${AZURE_RESOURCE_GROUP} --location ${AZURE_LOCATION}
                        
                        az appservice plan create --name ${AZURE_APP_PLAN} --resource-group ${AZURE_RESOURCE_GROUP} --sku ${AZURE_APP_SKU} --is-linux
                        
                        az webapp create --name ${AZURE_WEBAPP_NAME} --resource-group ${AZURE_RESOURCE_GROUP} --plan ${AZURE_APP_PLAN} --runtime "NODE:16-lts"
                        
                        az webapp config appsettings set --name ${AZURE_WEBAPP_NAME} --resource-group ${AZURE_RESOURCE_GROUP} --settings WEBSITE_NODE_DEFAULT_VERSION=16-lts
                        
                        az webapp config set --name ${AZURE_WEBAPP_NAME} --resource-group ${AZURE_RESOURCE_GROUP} --always-on true
                        
                        az webapp log config --name ${AZURE_WEBAPP_NAME} --resource-group ${AZURE_RESOURCE_GROUP} --web-server-logging filesystem
                        
                        az webapp deploy --resource-group ${AZURE_RESOURCE_GROUP} --name ${AZURE_WEBAPP_NAME} --src-path "${WORKSPACE}/dist.zip" --type zip
                        
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
                expression {
                    return env.BRANCH_NAME == 'develop' && env.DEPLOYMENT_SUCCESS == 'true'
                }
            }
            steps {
                script {
                    try {
                        sh '''
                            export CHROME_BIN=${CHROME_BIN}
                            export CHROMEDRIVER_BIN=${CHROMEDRIVER_BIN}
                            export APP_URL=${APP_URL}
                            npm run test:e2e
                        '''
                        echo "All tests passed on Dev environment"
                    } catch (Exception e) {
                        echo "Tests failed on Dev environment: ${e.getMessage()}"
                        error "Tests failed on Dev environment"
                    }
                }
            }
        }
        
        stage('Manual Testing Approval') {
            when {
                expression {
                    return env.BRANCH_NAME == 'develop' && env.DEPLOYMENT_SUCCESS == 'true'
                }
            }
            steps {
                script {
                    def userInput = input(
                        id: 'userInput',
                        message: 'Do you want to proceed with manual testing?',
                        parameters: [
                            [$class: 'BooleanParameterDefinition', defaultValue: true, description: 'Proceed with manual testing?', name: 'PROCEED_MANUAL_TESTING']
                        ]
                    )
                    if (userInput) {
                        echo "Proceeding with manual testing. App URL: https://${env.APP_URL}"
                        timeout(time: 1, unit: 'HOURS') {
                            input message: "Manual testing completed? (App URL: https://${env.APP_URL})"
                        }
                    } else {
                        echo "Manual testing skipped."
                    }
                }
            }
        }
        
        stage('Delete Azure Resources') {
            when {
                expression {
                    return env.BRANCH_NAME == 'develop' && env.DEPLOYMENT_SUCCESS == 'true'
                }
            }
            steps {
                script {
                    def userInput = input(
                        id: 'deleteResources',
                        message: 'Do you want to delete the Azure resources?',
                        parameters: [
                            [$class: 'BooleanParameterDefinition', defaultValue: false, description: 'Delete Azure resources?', name: 'DELETE_RESOURCES']
                        ]
                    )
                    if (userInput) {
                        withCredentials([azureServicePrincipal('azure-credentials')]) {
                            sh '''
                                az login --service-principal -u $AZURE_CLIENT_ID -p $AZURE_CLIENT_SECRET -t $AZURE_TENANT_ID
                                az group delete --name ${AZURE_RESOURCE_GROUP} --yes --no-wait
                            '''
                        }
                        echo "Azure resources deletion initiated."
                    } else {
                        echo "Azure resources deletion skipped."
                    }
                }
            }
        }
    }
    
    post {
        always {
            withCredentials([azureServicePrincipal('azure-credentials')]) {
                sh '''
                    az login --service-principal -u $AZURE_CLIENT_ID -p $AZURE_CLIENT_SECRET -t $AZURE_TENANT_ID
                    COST=$(az consumption usage list --start-date $(date -d "today" '+%Y-%m-%d') --end-date $(date -d "tomorrow" '+%Y-%m-%d') --query "[].{Cost:pretaxCost}" -o tsv | awk '{sum += $1} END {print sum}')
                    echo "Today's Azure cost: $COST"
                '''
            }
            cleanWs()
        }
        success {
            script {
                echo "Pipeline completed successfully!"
            }
        }
        failure {
            script {
                echo "Pipeline failed!"
            }
        }
    }
}