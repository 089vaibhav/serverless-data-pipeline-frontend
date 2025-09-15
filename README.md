Serverless Data Processing Pipeline on AWS
This project is a complete, full-stack application demonstrating a serverless data processing pipeline using the AWS Free Tier. Users can upload CSV or JSON files through a web interface. The file is securely uploaded to S3, processed by a Lambda function, and the analysis results are displayed back to the user.

Architecture Overview
The application uses a serverless, event-driven architecture that is scalable, resilient, and cost-effective.

1. Frontend (React) requests secure upload URL from API Gateway.
                            |
                            v
2. API Gateway -> Lambda (generates Pre-signed S3 URL).
   |
   v
3. Frontend uploads file directly to S3 using the Pre-signed URL.
   |
   v
4. S3 object creation triggers -> Processing Lambda.
   |
   v
5. Processing Lambda analyzes the file and saves a JSON result to S3.
   |
   v
6. Frontend polls API Gateway -> Result Lambda for the JSON result.
   |
   v
7. Result is displayed on the Frontend.
Features
Serverless Backend: Built with AWS Lambda, API Gateway, and S3.

Secure File Uploads: Uses S3 Pre-signed URLs to avoid exposing credentials or routing files through the backend.

Asynchronous Processing: S3 event triggers decouple the file upload from the data processing logic.

Infrastructure as Code (IaC): The entire backend is defined and deployed using the AWS Serverless Application Model (SAM).

Modern Frontend: A responsive and user-friendly interface built with React, Vite, and Tailwind CSS.

Free Tier Compliant: All services and usage patterns are designed to fit within the AWS Free Tier.

Tech Stack
Backend: Python 3.12, AWS SAM, AWS Lambda, Amazon API Gateway (HTTP), Amazon S3

Frontend: React, TypeScript, Vite, Tailwind CSS, Axios

Deployment: AWS SAM CLI (Backend), Vercel/Netlify (Frontend)

Prerequisites
Before you begin, ensure you have the following installed and configured:

An AWS Account and an IAM User with programmatic access.

AWS CLI: Installation Guide

Configured with your IAM user credentials (aws configure).

AWS SAM CLI: Installation Guide

Node.js: v18.x or newer

Python: v3.12 or newer

Git

Getting Started: Step-by-Step Instructions
Step 1: Clone the Repository
Bash

git clone <your-repository-url>
cd serverless-data-pipeline
Step 2: Deploy the Backend
The backend infrastructure is managed by AWS SAM.

Navigate to the backend directory:

Bash

cd backend
Update the Bucket Name: S3 bucket names must be globally unique. Open template.yaml and change the default bucket name to something unique to you.

YAML

# In template.yaml
Parameters:
  S3BucketName:
    Type: String
    Default: my-data-pipeline-<your-unique-name-and-date> # <-- CHANGE THIS
Build the SAM application:

Bash

sam build
Deploy to AWS:

Bash

sam deploy --guided
Stack Name: serverless-data-pipeline-stack

AWS Region: us-east-1

Parameter S3BucketName: Accept the unique name you provided.

Confirm changes before deploy: y

Allow SAM CLI IAM role creation: Y (This is required)

Accept the defaults for the remaining prompts.

Save the API Endpoint: After a successful deployment, SAM will output the API Gateway URL. Copy and save this URL. It will look like https://abcdef123.execute-api.us-east-1.amazonaws.com.

Step 3: Configure S3 Bucket CORS
To allow the frontend to upload files directly to S3, you must apply a CORS policy.

Create a configuration file named s3-cors-config.json in the project's root directory with the following content:

JSON

{
  "CORSRules": [
    {
      "AllowedHeaders": ["*"],
      "AllowedMethods": ["PUT", "GET", "HEAD"],
      "AllowedOrigins": ["https://*", "http://localhost:5173"],
      "ExposeHeaders": []
    }
  ]
}
Apply the policy using the AWS CLI. Replace <your-bucket-name> with the unique name you chose.

Bash

aws s3api put-bucket-cors --bucket <your-bucket-name> --cors-configuration file://s3-cors-config.json
Step 4: Deploy the Frontend
Navigate to the frontend directory:

Bash

cd ../frontend
Install dependencies:

Bash

npm install
Set the API URL: Create a file named .env.local in the frontend directory. Add your API Gateway URL from Step 2.

VITE_API_BASE_URL=https://abcdef123.execute-api.us-east-1.amazonaws.com
Push to GitHub: Create a new GitHub repository and push the frontend code to it.

Deploy on Vercel:

Sign up for a Vercel account and connect it to your GitHub.

Import your new repository as a project. Vercel will auto-detect the Vite settings.

Before deploying, go to the project Settings -> Environment Variables.

Add VITE_API_BASE_URL and paste your API Gateway URL as the value.

Deploy the project.

 Usage
Once both deployments are complete, open your public Vercel URL. Drag and drop a CSV or JSON file onto the upload area to see the pipeline in action.

Cleanup
To avoid any future costs, you can remove all the AWS resources created by this project.

Empty the S3 Bucket: (Replace <your-bucket-name>)

Bash

aws s3 rm s3://<your-bucket-name> --recursive
Delete the Backend Stack: Navigate to the backend directory and run:

Bash

sam delete
This will delete all the Lambda functions, the API Gateway, and the IAM roles.



vercel link :
https://serverless-data-pipeline-frontend-wx3o-itaj3fdiv.vercel.app/
