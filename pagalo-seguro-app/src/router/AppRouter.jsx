import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom'

import ProtectedRoute from '../components/auth/ProtectedRoute'
import AppLayout from '../components/layout/AppLayout'

import Login from '../pages/Login'
import Register from '../pages/Register'
import Dashboard from '../pages/Dashboard'
import Products from '../pages/Products'
import Orders from '../pages/Orders'
import NotFound from '../pages/NotFound'

const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/dashboard" replace />,
  },
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/register',
    element: <Register />,
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          {
            path: '/dashboard',
            element: <Dashboard />,
          },
          {
            path: '/products',
            element: <Products />,
          },
          {
            path: '/orders',
            element: <Orders />,
          },
        ],
      },
    ],
  },
  {
    path: '*',
    element: <NotFound />,
  },
])

export default function AppRouter() {
  return <RouterProvider router={router} />
}