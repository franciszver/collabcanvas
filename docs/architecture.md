graph TB
    subgraph "Client Browser - User A"
        A1[React App]
        A2[Canvas Component<br/>Konva.js]
        A3[Auth Context]
        A4[Canvas Context]
        A5[Presence Context]
        A6[Auth Service]
        A7[Firestore Service]
        A8[Presence Service]
        
        A1 --> A2
        A1 --> A3
        A1 --> A4
        A1 --> A5
        A3 --> A6
        A4 --> A7
        A5 --> A8
        A2 --> A4
    end
    
    subgraph "Client Browser - User B"
        B1[React App]
        B2[Canvas Component<br/>Konva.js]
        B3[Auth Context]
        B4[Canvas Context]
        B5[Presence Context]
        B6[Auth Service]
        B7[Firestore Service]
        B8[Presence Service]
        
        B1 --> B2
        B1 --> B3
        B1 --> B4
        B1 --> B5
        B3 --> B6
        B4 --> B7
        B5 --> B8
        B2 --> B4
    end
    
    subgraph "Firebase Backend"
        FB1[Firebase Authentication]
        FB2[Firestore Database]
        FB3[Firebase Hosting]
        
        subgraph "Firestore Collections"
            C1[(objects/<br/>rectangleId)]
            C2[(presence/<br/>userId)]
            C3[(users/<br/>userId)]
        end
        
        FB2 --> C1
        FB2 --> C2
        FB2 --> C3
    end
    
    subgraph "Google Services"
        G1[Google OAuth]
        G2[Google Account]
    end
    
    subgraph "Deployment & CI/CD"
        D1[GitHub Repository]
        D2[Vercel/Firebase Hosting]
        D3[Build Pipeline]
        
        D1 --> D3
        D3 --> D2
    end
    
    %% Authentication Flow
    A6 -->|Sign In Request| FB1
    B6 -->|Sign In Request| FB1
    FB1 -->|OAuth Redirect| G1
    G1 -->|User Credentials| G2
    G2 -->|Auth Token| FB1
    FB1 -->|User Data + Token| A6
    FB1 -->|User Data + Token| B6
    
    %% Real-time Rectangle Sync
    A7 -->|Create/Update Rectangle| C1
    B7 -->|Create/Update Rectangle| C1
    C1 -.->|onSnapshot Listener| A7
    C1 -.->|onSnapshot Listener| B7
    
    %% Real-time Cursor Sync
    A8 -->|Update Cursor Position<br/>every 50ms| C2
    B8 -->|Update Cursor Position<br/>every 50ms| C2
    C2 -.->|onSnapshot Listener| A8
    C2 -.->|onSnapshot Listener| B8
    
    %% User Presence
    A8 -->|Set Online Status| C3
    B8 -->|Set Online Status| C3
    C3 -.->|onSnapshot Listener| A8
    C3 -.->|onSnapshot Listener| B8
    
    %% Hosting
    FB3 -->|Serves Static Assets| A1
    FB3 -->|Serves Static Assets| B1
    D2 -->|Deploy to| FB3
    
    %% Data Flow Legend
    classDef clientClass fill:#e1f5ff,stroke:#01579b,stroke-width:2px
    classDef firebaseClass fill:#fff3e0,stroke:#e65100,stroke-width:2px
    classDef googleClass fill:#e8f5e9,stroke:#1b5e20,stroke-width:2px
    classDef deployClass fill:#f3e5f5,stroke:#4a148c,stroke-width:2px
    
    class A1,A2,A3,A4,A5,A6,A7,A8,B1,B2,B3,B4,B5,B6,B7,B8 clientClass
    class FB1,FB2,FB3,C1,C2,C3 firebaseClass
    class G1,G2 googleClass
    class D1,D2,D3 deployClass