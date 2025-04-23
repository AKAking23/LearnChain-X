import { createBrowserRouter } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import About from './pages/About';
import Courses from './pages/Courses';
import Dashboard from './pages/Dashboard';
import NotFound from './pages/NotFound';
import Wallet from './pages/Wallet';
import Quiz from './pages/Quiz';
import ZkProof from './pages/ZkProof';

const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      {
        index: true,
        element: <Home />
      },
      {
        path: 'about',
        element: <About />
      },
      {
        path: 'courses',
        element: <Courses />
      },
      {
        path: 'dashboard',
        element: <Dashboard />
      },
      {
        path: 'wallet',
        element: <Wallet />
      },
      {
        path: 'quiz',
        element: <Quiz />
      },
      {
        path: 'zkproof',
        element: <ZkProof />
      },
      {
        path: '*',
        element: <NotFound />
      }
    ]
  }
]);

export default router; 