# pokestake-backend

![GitHub stars](https://img.shields.io/github/stars/LuftieTheAnonymous/pokestake-backend?style=for-the-badge&logo=github) ![GitHub forks](https://img.shields.io/github/forks/LuftieTheAnonymous/pokestake-backend?style=for-the-badge&logo=github) ![GitHub issues](https://img.shields.io/github/issues/LuftieTheAnonymous/pokestake-backend?style=for-the-badge&logo=github) ![Express.js](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white) ![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white) ![License](https://img.shields.io/badge/license-ISC-green?style=for-the-badge)

## 📑 Table of Contents

- [Description](#description)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Quick Start](#quick-start)
- [Key Dependencies](#key-dependencies)
- [Run Commands](#run-commands)
- [Screenshots](#screenshots)
- [Project Structure](#project-structure)
- [Contributing](#contributing)
- [License](#license)


## 📝 Description

Pokestake-backend is the robust server-side engine powering the Pokestake web3 ecosystem. 
Leveraging the high performance of Express.js and the strict type safety of TypeScript, 
this project provides a scalable and secure infrastructure to handle core application logic and seamless API integrations. 
It is designed to offer a reliable and efficient backend solution for Pokémon-themed web3 project, ensuring a smooth experience for end-users.

## ✨ Features

- 🎮 Pokemon Battle Gameplay Handling
- 📡 Event Driven Blockchain State Mirroring
- 


## 🛠️ Tech Stack

- 🚀 Express.js
- 📜 TypeScript
- 🔃 Socket.io
- 🏎️ Redis
- Ether.js
- Mongoose/MongoDB

## ⚡ Quick Start

```bash
# Clone the repository
git clone https://github.com/LuftieTheAnonymous/pokestake-backend.git

# Install dependencies
npm install

# Start development server
npm run dev
```

## 📦 Key Dependencies

```
@types/express: ^5.0.6
@types/socket.io: ^3.0.2
eiows: ^8.2.0
express: ^5.2.1
redis: ^5.11.0
socket.io: ^4.8.3
tsc: ^2.0.4
tsx: ^4.21.0
typescript: ^5.9.3
```

## 🚀 Run Commands

- **dev**: `npm run dev`

## 📁 Project Structure

```
.
├── configs
│   └── RedisConfig.ts
├── index.js
├── index.ts
├── nodemon.json
├── package.json
├── socket
│   ├── redisHandler.ts
│   ├── socketMiddlewares.ts
│   └── useBattle.ts
└── types
    └── BattleTypes.ts
```

## 👥 Contributing

Contributions are welcome! Here's how you can help:

1. **Fork** the repository
2. **Clone** your fork: `git clone https://github.com/LuftieTheAnonymous/pokestake-backend.git`
3. **Create** a new branch: `git checkout -b feature/your-feature`
4. **Commit** your changes: `git commit -am 'Add some feature'`
5. **Push** to your branch: `git push origin feature/your-feature`
6. **Open** a pull request

Please ensure your code follows the project's style guidelines and includes tests where applicable.

## 📜 License

This project is licensed under the ISC License.
