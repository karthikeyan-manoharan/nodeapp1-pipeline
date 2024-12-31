pipeline {
    agent any
   
    environment {
        AZURE_WEBAPP_NAME = 'reactjs-express-typescript-app'
        AZURE_RESOURCE_GROUP = 'reactjs-express-typescript-app-rg'
        AZURE_LOCATION = 'uksouth'
        AZURE_APP_PLAN = 'reactjs-express-typescript-app-plan'
        AZURE_APP_SKU = 'B1'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Install Dependencies') {
            steps {
                sh 'npm ci --no-fund'
            }
        }

        stage('Build and Create Zip') {
            steps {
                sh 'npm run build:ci'
            }
        }
		
    

stage('Deploy to Azure App Service') {
    steps {
        withCredentials([azureServicePrincipal('azure-credentials')]) {
            sh '''
                echo "Deploying to Azure App Service..."
                
                # Print current directory and list files
                pwd
                ls -la
                
                # Copy dist.zip to a Windows-accessible location
                cp dist.zip /mnt/c/dist.zip
                
                # Login to Azure
                az login --service-principal -u $AZURE_CLIENT_ID -p $AZURE_CLIENT_SECRET -t $AZURE_TENANT_ID
                az account set --subscription $AZURE_SUBSCRIPTION_ID
                
                # Create resource group if it doesn't exist
                az group create --name $AZURE_RESOURCE_GROUP --location $AZURE_LOCATION

                # Create App Service plan if it doesn't exist
                az appservice plan create --name $AZURE_APP_PLAN --resource-group $AZURE_RESOURCE_GROUP --sku $AZURE_APP_SKU --is-linux

                # Create or update the web app
                az webapp create --name $AZURE_WEBAPP_NAME --resource-group $AZURE_RESOURCE_GROUP --plan $AZURE_APP_PLAN --runtime "NODE:18-lts"

                # Deploy the app using the Windows path
                az webapp deployment source config-zip --resource-group $AZURE_RESOURCE_GROUP --name $AZURE_WEBAPP_NAME --src "C:\\dist.zip"
                
                # Clean up
                rm /mnt/c/dist.zip
            '''
        }
    }
}

        stage('Manual Testing Approval') {
            steps {
                input message: 'Please perform manual testing and approve when ready', ok: 'Testing completed'
            }
        }

        stage('Approval for Resource Deletion') {
            steps {
                input message: 'Do you want to delete Azure resources?', ok: 'Proceed with deletion'
            }
        }

        stage('Delete Azure Resources') {
            steps {
                withCredentials([azureServicePrincipal('azure-credentials')]) {
                    sh '''
                        echo "Deleting Azure resources..."
                        az login --service-principal -u $AZURE_CLIENT_ID -p $AZURE_CLIENT_SECRET -t $AZURE_TENANT_ID
                        az account set --subscription $AZURE_SUBSCRIPTION_ID
                        
                        # Delete the entire resource group
                        az group delete --name $AZURE_RESOURCE_GROUP --yes --no-wait
                    '''
                }
            }
        }
    }

    post {
        always {
            cleanWs()
        }
    }
}