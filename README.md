# Minerr

A web application to easily create and manage minecraft servers.

## 📋 Description

Minerr is a web application designed to simplify the process of creating and managing Minecraft servers. It is particularly aimed at users who want to deploy small servers for playing with friends, requiring minimal configuration effort.

## ✨ Features

- Create Minecraft servers
- Add modpacks
- Manage server configurations (e.g., ram, port etc.)
- Monitor server performance

## 🛠️ Technology Stack

### Frontend
- **Framework**: React with Vite
- **UI Components**: Shadcn UI
- **Icons**: Lucide React
- **Styling**: Tailwind CSS
- **Routing**: Generouted

### Backend
- **Framework**: NestJS
- **Database**: PostgreSQL with Prisma ORM

## 🚀 Installation

The easiest way to run Minerr is using Docker:

```bash
# Pull the Docker image
docker pull imprevisible/minerr

# Run the container
docker run -p 80:80 -e DATABASE_URL=postgres://user:password@host:port/dbname imprevisible/minerr # Replace with your database credentials
```

### Docker Images

Our Dockerfile uses:
- `node:24-slim` for building the backend and frontend
- `nginx:alpine` for serving the application

- `itzg/minecraft-server` is the image used for the created servers

### Required Environment Variables

None

## 🤖 AI-Assisted Development

This project was developed using various artificial intelligence tools to enhance productivity:

- **GPT-4o**: Development assistance, code generation, and debugging
- **Claude 3.5 & 3.7**: Design assistance and optimization
- **Mistral**: Documentation and testing support
- **v0.dev**: UI design and prototyping

The use of these tools significantly accelerated development while maintaining high code quality.

## 🏗️ Project Structure

```
minerr/
├── backend/               # NestJS backend
│   ├── prisma/            # Database ORM
│   └── src/
│       ├── modules/       # Feature modules
│       │   ├── ...        # Feature modules
│       └── prisma/        # Prisma service
│
├── frontend/              # React frontend
│   └── src/
│       ├── components/    # UI components
│       │   └── ui/        # Shadcn UI components
│       ├── hooks/         # Custom React hooks
│       ├── lib/           # Utilities and constants
│       ├── pages/         # Application pages
│       └── types/         # TypeScript type definitions
│
└── docker-compose.yml     # Docker configuration
```

## 📱 Usage

1. Open your web browser and navigate to `http://localhost`.
2. Create a new account or log in with your existing credentials.
3. Follow the on-screen instructions to create and manage your Minecraft servers.
4. Enjoy your Minecraft experience!

## 📝 License

[GNU AGPL 3.0](LICENSE)
