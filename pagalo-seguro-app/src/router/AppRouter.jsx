import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom'

import ProtectedRoute from '../components/auth/ProtectedRoute'
import AdminRoute from '../components/auth/AdminRoute'
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

import AdminOrders from '../pages/admin/AdminOrders'
import AdminEvents from '../pages/admin/AdminEvents'
import AdminLogs from '../pages/admin/AdminLogs'
import AdminOrderDetail from '../pages/admin/AdminOrderDetail'

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
    element: <AdminRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          {
            path: '/admin/orders',
            element: <AdminOrders />,
          },
          {
            path: '/admin/events',
            element: <AdminEvents />,
          },
          {
            path: '/admin/logs',
            element: <AdminLogs />,
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