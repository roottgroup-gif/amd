import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { registerServiceWorker } from "./lib/serviceWorker";

// Register service worker for caching and offline functionality
registerServiceWorker({
  onSuccess: (registration) => {
    console.log('✅ App is ready for offline use');
  },
  onUpdate: (registration) => {
    console.log('🔄 New content available, please refresh');
    // Could show a notification to user here
  },
  onError: (error) => {
    console.error('❌ Service worker registration failed:', error);
  }
});

createRoot(document.getElementById("root")!).render(<App />);
