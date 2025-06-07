import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Importar helpers para desenvolvimento
import './utils/dev-helpers'
import './utils/migration-helpers'

createRoot(document.getElementById("root")!).render(<App />);
