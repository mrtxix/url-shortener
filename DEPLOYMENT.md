# Deployment Guide for Render

## Prerequisites

1. MongoDB Atlas account (free tier available)
2. Render account (free tier available)

## Step 1: Set up MongoDB Atlas

1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a free account
3. Create a new cluster
4. Create a database user
5. Get your connection string

## Step 2: Deploy to Render

1. Go to [Render](https://render.com)
2. Sign up/Login
3. Click "New +" → "Web Service"
4. Connect your GitHub repository
5. Configure the service:
   - **Name**: `url-shortener` (or your preferred name)
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free

## Step 3: Environment Variables

Add these environment variables in Render dashboard:

```
NODE_ENV=production
MONGO_URL=mongodb+srv://your-username:your-password@your-cluster.mongodb.net/url-shortener?retryWrites=true&w=majority
PORT=10000
```

Replace `your-username`, `your-password`, and `your-cluster` with your actual MongoDB Atlas credentials.

## Step 4: Deploy

1. Click "Create Web Service"
2. Wait for deployment to complete
3. Your app will be available at: `https://your-app-name.onrender.com`

## Step 5: Update Base URL

After deployment, update the `BASE_URL` environment variable in Render with your actual app URL:

```
BASE_URL=https://your-app-name.onrender.com
```

## Features

- ✅ Dynamic base URL detection
- ✅ Swagger UI at `/api-docs`
- ✅ Environment-aware configuration
- ✅ MongoDB connection with error handling
- ✅ Responsive UI

## Local Development

```bash
npm install
npm run dev
```

## Production

```bash
npm start
```

## API Documentation

- Swagger UI: `https://your-app-name.onrender.com/api-docs`
- Main page: `https://your-app-name.onrender.com`
