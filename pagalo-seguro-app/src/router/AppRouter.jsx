import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom'

import ProtectedRoute from '../components/auth/ProtectedRoute'
import AppLayout from '../components/layout/AppLayout'

import Login from '../pages/Login'
import Register from '../pages/Register'
import Dashboard from '../pages/Dashboard'
import Products from '../pages/Products'
import Orders from '../pages/Orders'
import NotFound from '../pages/NotFound'
import OrderDetail from '../pages/OrderDetail'
import PaymentSuccess from '../pages/PaymentSuccess'
import PaymentFailure from '../pages/PaymentFailure'
import PaymentPending from '../pages/PaymentPending'

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
          {
            path: '/orders/:id',
            element: <OrderDetail />,
          },
          {
            path: '/payment/success',
            element: <PaymentSuccess />,
          },
          {
            path: '/payment/failure',
            element: <PaymentFailure />,
          },
          {
            path: '/payment/pending',
            element: <PaymentPending />,
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