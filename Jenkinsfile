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
        
        DEPLOYMENT_SUCCESS = 'false'
        TESTS_SUCCESS = 'false'
        APP_PID = ''
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
                    npm install --no-fund
                    npm install --save-dev selenium-webdriver @types/selenium-webdriver
                '''
            }
        }
        
        stage('Build') {
            steps {
                sh 'npm run build --no-fund'
            }
        }
        
        stage('Run Tests') {
            parallel {
                stage('Unit Tests') {
                    steps {
                        sh 'npm run test || true'
                    }
                }
                stage('Coverage Tests') {
                    steps {
                        sh 'npm run test:coverage || true'
                    }
                }
                stage('Selenium Tests') {
                    steps {
                        script {
                            try {
                                sh '''
                                    set -x
                                    export CHROME_BIN=${CHROME_BIN}
                                    export CHROMEDRIVER_BIN=${CHROMEDRIVER_BIN}
                                    npm start &
                                    APP_PID=$!
                                    echo "Application started with PID: $APP_PID"
                                    
                                    # Wait for the application to start
                                    for i in {1..30}; do
                                        if curl -s http://localhost:3000 > /dev/null; then
                                            echo "Application is up and running"
                                            break
                                        fi
                                        echo "Waiting for application to start... (Attempt $i/30)"
                                        sleep 2
                                    done
                                    
                                    npm run test:selenium
                                    TEST_EXIT_CODE=$?
                                    
                                    kill $APP_PID
                                    exit $TEST_EXIT_CODE
                                '''
                            } catch (Exception e) {
                                echo "Selenium tests failed: ${e.getMessage()}"
                                currentBuild.result = 'UNSTABLE'
                            }
                        }
                    }
                }
            }
        }
        stage('Deploy to Dev') {
            when {
                branch 'develop'
            }
            steps {
                script {
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
                    try {
                        sh """
                            export APP_URL=https://${env.APP_URL}
                            npm run test
                            npm run test:coverage
                            npm run test:selenium
                        """
                        env.TESTS_SUCCESS = 'true'
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
		}
		stage('Delete Azure Resources') {
		when {
			branch 'develop'
			expression { env.DEPLOYMENT_SUCCESS == 'true' && env.TESTS_SUCCESS == 'true' }
		}
		steps {
			script {
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