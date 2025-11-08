# Polling Client (FE) for Mata Kuliah DevOps

Welcome to the Polling Client repository. This project is the frontend application that serves as the user interface for the polling system.

---

## 📖 Service Functionality

This application provides the interactive user interface for the Polling System. Its primary functions include:

* **User Interface:** Delivering a responsive and intuitive layout for users to interact with the system.
* **Poll Interaction:** Allowing users to browse active polls, view details, and cast votes.
* **Authentication UI:** Providing the forms and flows for user login and registration.

### 🏗️ Architectural Highlight: Scalable WebSockets

Typically, WebSocket applications bind a client to a specific backend server, making horizontal scaling difficult because users on different servers cannot easily communicate.

Our system overcomes this limitation by using **RabbitMQ** as a message broker.
* We run multiple frontend instances connecting to different backend services.
* RabbitMQ broadcasts messages between these backend services.
* This ensures that a user connected to Service A can still interact in real-time with a user connected to Service B.

**To see the full power of this architecture, you will run two distinct frontend applications simultaneously.**

## 🛠️ Tech Stack
<img width="1367" height="537" alt="image" src="https://github.com/user-attachments/assets/438a7454-eb31-4edf-87d0-1a1132e6d49f" />

This project is built using modern web technologies to ensure a fast and dynamic user experience:

* **[Next.js](https://nextjs.org/)**: A React framework for building full-stack web applications.

---

## 🌐 Live Demo

The application is currently deployed and accessible at:
**[https://polbro-devops.duckdns.org](https://polbro-devops.duckdns.org)**

---

## 🚀 Getting Started Locally

Follow these instructions to get a copy of the project up and running on your local machine for development and testing.

### Prerequisites

Before you begin, ensure you have the following:

1.  **[Docker](https://www.docker.com/get-started)** installed and running.
2.  **Backend Services:** For full functionality, ensure both the [Polling Service](https://github.com/DevonLoen/polling-service) and [Auth Service](https://github.com/Christian-Tiovanto/auth-service-poll.git) are running locally.

### Installation & Run

1.  **Clone the Repository**
    ```bash
    git clone <YOUR_FE_REPO_URL>
    cd <YOUR_REPO_DIRECTORY>
    ```

2.  **Set Up Environment Variables**
    Copy the sample environment file to create your local configuration.
    ```bash
    cp .env.sample .env
    ```

3.  **Start the Application**
    Use Docker Compose to spin up the frontend containers.
    ```bash
    docker compose up -d
    ```

### ✅ Verification & Testing Scalability

To demonstrate the distributed architecture, this project spins up two separate frontend instances. Open both URLs in different browser windows (or one in Incognito mode) to simulate two users on different server nodes:

* **Instance A:** [http://localhost:3000](http://localhost:3000)
* **Instance B:** [http://localhost:3001](http://localhost:3001)

Try casting a vote on Instance A and watch it update in real-time on Instance B! 🎉
