pipeline {
    agent any

    environment {
        AWS_REGION = 'ap-south-1'
    }

    stages {

        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Prepare Variables') {
            steps {
                script {

                    env.ACCOUNT_ID = sh(
                        script: 'aws sts get-caller-identity --query Account --output text',
                        returnStdout: true
                    ).trim()

                    env.GIT_SHA = sh(
                        script: 'git rev-parse --short HEAD',
                        returnStdout: true
                    ).trim()

                    env.BACKEND_REPO = "${env.ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/java-backend"
                    env.FRONTEND_REPO = "${env.ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/java-frontend"
                }
            }
        }

        stage('Login To ECR') {
            steps {
                sh '''
                aws ecr get-login-password --region ${AWS_REGION} \
                | docker login \
                --username AWS \
                --password-stdin \
                ${ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com
                '''
            }
        }

        stage('Build Backend Image') {
            steps {
                sh '''
                docker build \
                -t java-backend:${GIT_SHA} \
                ./backend
                '''
            }
        }

        stage('Tag Backend Image') {
            steps {
                sh '''
                docker tag java-backend:${GIT_SHA} \
                ${BACKEND_REPO}:${GIT_SHA}

                docker tag java-backend:${GIT_SHA} \
                ${BACKEND_REPO}:latest
                '''
            }
        }

        stage('Push Backend Image') {
            steps {
                sh '''
                docker push ${BACKEND_REPO}:${GIT_SHA}
                docker push ${BACKEND_REPO}:latest
                '''
            }
        }

        stage('Build Frontend Image') {
            steps {
                sh '''
                docker build \
                -t java-frontend:${GIT_SHA} \
                ./frontend
                '''
            }
        }

        stage('Tag Frontend Image') {
            steps {
                sh '''
                docker tag java-frontend:${GIT_SHA} \
                ${FRONTEND_REPO}:${GIT_SHA}

                docker tag java-frontend:${GIT_SHA} \
                ${FRONTEND_REPO}:latest
                '''
            }
        }

        stage('Push Frontend Image') {
            steps {
                sh '''
                docker push ${FRONTEND_REPO}:${GIT_SHA}
                docker push ${FRONTEND_REPO}:latest
                '''
            }
        }
        stage('Clone GitOps Repo') {
            steps {
                dir('gitops') {
                    git(
                        branch: 'main',
                        credentialsId: 'gitops-github',
                        url: 'https://github.com/Zaid2044/multitier-eks-gitops.git'
                    )
                }
            }
        }

        stage('Update GitOps Values') {
            steps {
                dir('gitops') {

                    sh """
                    yq -i '.backend.image.tag = strenv(GIT_SHA)' helm/java-app/values.yaml
                    yq -i '.frontend.image.tag = strenv(GIT_SHA)' helm/java-app/values.yaml
                    """

                    sh '''
                    echo "===== Updated values.yaml ====="
                    cat helm/java-app/values.yaml
                    '''
                }
            }
        }

        stage('Commit GitOps Changes') {
            steps {
                dir('gitops') {

                    sh '''
                    git config user.name "Jenkins"
                    git config user.email "jenkins@local"

                    git add .

                    git commit -m "Deploy Java ${GIT_SHA}" || true
                    '''
                }
            }
        }

        stage('Push GitOps Changes') {
            steps {
                dir('gitops') {

                    withCredentials([
                        usernamePassword(
                            credentialsId: 'gitops-github',
                            usernameVariable: 'GIT_USER',
                            passwordVariable: 'GIT_TOKEN'
                        )
                    ]) {

                        sh '''
                        git remote set-url origin \
                        https://${GIT_USER}:${GIT_TOKEN}@github.com/Zaid2044/multitier-eks-gitops.git

                        git push origin main
                        '''
                    }
                }
            }
        }
    }

    post {
        always {
            sh 'docker image prune -af || true'
        }
    }
    
}