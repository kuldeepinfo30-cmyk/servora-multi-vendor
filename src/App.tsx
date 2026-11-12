import { Suspense, lazy } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { PublicLayout } from '@/components/layout/PublicLayout';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { RouteFallback } from '@/components/layout/RouteFallback';

/*
 * Every page is loaded on demand. The layouts stay in the main bundle so the
 * header, sidebar and footer render instantly, and each page's chunk is fetched
 * the first time someone visits it. That keeps the initial download small
 * instead of shipping all 70-odd screens up front.
 */

/* ---------------------------------- Public --------------------------------- */
const HomePage = lazy(() => import('@/pages/public/Home'));
const CategoriesPage = lazy(() => import('@/pages/public/Categories'));
const CategoryDetailPage = lazy(() => import('@/pages/public/CategoryDetail'));
const ServicesPage = lazy(() => import('@/pages/public/Services'));
const SearchResultsPage = lazy(() => import('@/pages/public/SearchResults'));
const VendorsPage = lazy(() => import('@/pages/public/Vendors'));
const ServiceDetailPage = lazy(() => import('@/pages/public/ServiceDetail'));
const VendorProfilePage = lazy(() => import('@/pages/public/VendorProfile'));
const OffersPage = lazy(() => import('@/pages/public/Offers'));
const HowItWorksPage = lazy(() => import('@/pages/public/HowItWorks'));
const AboutPage = lazy(() => import('@/pages/public/About'));
const ContactPage = lazy(() => import('@/pages/public/Contact'));
const FAQPage = lazy(() => import('@/pages/public/FAQ'));
const HelpPage = lazy(() => import('@/pages/public/Help'));
const PolicyPage = lazy(() => import('@/pages/public/PolicyPage'));

/* ----------------------------------- Auth ---------------------------------- */
const LoginPage = lazy(() => import('@/pages/auth/Login'));
const RegisterPage = lazy(() => import('@/pages/auth/Register'));
const ForgotPasswordPage = lazy(() => import('@/pages/auth/ForgotPassword'));
const VerifyOtpPage = lazy(() => import('@/pages/auth/VerifyOtp'));

/* --------------------------------- Customer -------------------------------- */
const CustomerDashboard = lazy(() => import('@/pages/customer/Dashboard'));
const CustomerBookings = lazy(() => import('@/pages/customer/Bookings'));
const BookingDetailPage = lazy(() => import('@/pages/customer/BookingDetail'));
const BookingFlowPage = lazy(() => import('@/pages/customer/BookingFlow'));
const CustomerFavorites = lazy(() => import('@/pages/customer/Favorites'));
const CustomerAddresses = lazy(() => import('@/pages/customer/Addresses'));
const CustomerPayments = lazy(() => import('@/pages/customer/Payments'));
const CustomerInvoices = lazy(() => import('@/pages/customer/Invoices'));
const CustomerReviews = lazy(() => import('@/pages/customer/Reviews'));
const CustomerMessages = lazy(() => import('@/pages/customer/Messages'));
const CustomerNotifications = lazy(() => import('@/pages/customer/Notifications'));
const CustomerSupport = lazy(() => import('@/pages/customer/Support'));
const CustomerSettings = lazy(() => import('@/pages/customer/Settings'));

/* ---------------------------------- Vendor --------------------------------- */
const VendorDashboard = lazy(() => import('@/pages/vendor/Dashboard'));
const VendorOnboarding = lazy(() => import('@/pages/vendor/Onboarding'));
const VendorProfile = lazy(() => import('@/pages/vendor/Profile'));
const VendorServices = lazy(() => import('@/pages/vendor/Services'));
const VendorServiceForm = lazy(() => import('@/pages/vendor/ServiceForm'));
const VendorBookings = lazy(() => import('@/pages/vendor/Bookings'));
const VendorCalendar = lazy(() => import('@/pages/vendor/Calendar'));
const VendorStaff = lazy(() => import('@/pages/vendor/Staff'));
const VendorCustomers = lazy(() => import('@/pages/vendor/Customers'));
const VendorEarnings = lazy(() => import('@/pages/vendor/Earnings'));
const VendorPayouts = lazy(() => import('@/pages/vendor/Payouts'));
const VendorReviews = lazy(() => import('@/pages/vendor/Reviews'));
const VendorPromotions = lazy(() => import('@/pages/vendor/Promotions'));
const VendorMessages = lazy(() => import('@/pages/vendor/Messages'));
const VendorSettings = lazy(() => import('@/pages/vendor/Settings'));

/* ----------------------------------- Admin --------------------------------- */
const AdminDashboard = lazy(() => import('@/pages/admin/Dashboard'));
const AdminCustomers = lazy(() => import('@/pages/admin/Customers'));
const AdminVendors = lazy(() => import('@/pages/admin/Vendors'));
const AdminApplications = lazy(() => import('@/pages/admin/Applications'));
const AdminServices = lazy(() => import('@/pages/admin/Services'));
const AdminCategories = lazy(() => import('@/pages/admin/Categories'));
const AdminBookings = lazy(() => import('@/pages/admin/Bookings'));
const AdminTransactions = lazy(() => import('@/pages/admin/Transactions'));
const AdminCommissions = lazy(() => import('@/pages/admin/Commissions'));
const AdminPayouts = lazy(() => import('@/pages/admin/Payouts'));
const AdminRefunds = lazy(() => import('@/pages/admin/Refunds'));
const AdminDisputes = lazy(() => import('@/pages/admin/Disputes'));
const AdminReviews = lazy(() => import('@/pages/admin/Reviews'));
const AdminCoupons = lazy(() => import('@/pages/admin/Coupons'));
const AdminReports = lazy(() => import('@/pages/admin/Reports'));
const AdminCms = lazy(() => import('@/pages/admin/CMS'));
const AdminRoles = lazy(() => import('@/pages/admin/Roles'));
const AdminSettings = lazy(() => import('@/pages/admin/Settings'));
const AdminAuditLogs = lazy(() => import('@/pages/admin/AuditLogs'));

/* ---------------------------------- Errors --------------------------------- */
const ForbiddenPage = lazy(() => import('@/pages/Forbidden'));
const NotFoundPage = lazy(() => import('@/pages/NotFound'));

export default function App() {
  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        {/* Public website */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/categories" element={<CategoriesPage />} />
          <Route path="/categories/:slug" element={<CategoryDetailPage />} />
          <Route path="/services" element={<ServicesPage />} />
          <Route path="/services/:slug" element={<ServiceDetailPage />} />
          <Route path="/search" element={<SearchResultsPage />} />
          <Route path="/vendors" element={<VendorsPage />} />
          <Route path="/vendors/:slug" element={<VendorProfilePage />} />
          <Route path="/offers" element={<OffersPage />} />
          <Route path="/how-it-works" element={<HowItWorksPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/faq" element={<FAQPage />} />
          <Route path="/help" element={<HelpPage />} />
          <Route path="/policies/terms" element={<PolicyPage />} />
          <Route path="/policies/privacy" element={<PolicyPage />} />
          <Route path="/policies/refunds" element={<PolicyPage />} />
          <Route path="/policies/accessibility" element={<PolicyPage />} />
          <Route path="/policies" element={<Navigate to="/policies/terms" replace />} />
        </Route>

        {/* Authentication */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/verify-otp" element={<VerifyOtpPage />} />

        {/* Customer portal */}
        <Route path="/customer" element={<ProtectedRoute role="customer" />}>
          <Route element={<DashboardLayout role="customer" />}>
            <Route index element={<Navigate to="/customer/dashboard" replace />} />
            <Route path="dashboard" element={<CustomerDashboard />} />
            <Route path="bookings" element={<CustomerBookings />} />
            <Route path="bookings/:id" element={<BookingDetailPage />} />
            <Route path="favorites" element={<CustomerFavorites />} />
            <Route path="addresses" element={<CustomerAddresses />} />
            <Route path="payments" element={<CustomerPayments />} />
            <Route path="invoices" element={<CustomerInvoices />} />
            <Route path="reviews" element={<CustomerReviews />} />
            <Route path="messages" element={<CustomerMessages />} />
            <Route path="notifications" element={<CustomerNotifications />} />
            <Route path="support" element={<CustomerSupport />} />
            <Route path="settings" element={<CustomerSettings />} />
          </Route>
        </Route>
        <Route path="/customer/book/:serviceId" element={<ProtectedRoute role="customer" />}>
          <Route element={<DashboardLayout role="customer" />}>
            <Route index element={<BookingFlowPage />} />
          </Route>
        </Route>

        {/* Vendor portal */}
        <Route path="/vendor" element={<ProtectedRoute role="vendor" />}>
          <Route element={<DashboardLayout role="vendor" />}>
            <Route index element={<Navigate to="/vendor/dashboard" replace />} />
            <Route path="dashboard" element={<VendorDashboard />} />
            <Route path="onboarding" element={<VendorOnboarding />} />
            <Route path="profile" element={<VendorProfile />} />
            <Route path="services" element={<VendorServices />} />
            <Route path="services/new" element={<VendorServiceForm />} />
            <Route path="services/:id/edit" element={<VendorServiceForm />} />
            <Route path="bookings" element={<VendorBookings />} />
            <Route path="calendar" element={<VendorCalendar />} />
            <Route path="staff" element={<VendorStaff />} />
            <Route path="customers" element={<VendorCustomers />} />
            <Route path="earnings" element={<VendorEarnings />} />
            <Route path="payouts" element={<VendorPayouts />} />
            <Route path="reviews" element={<VendorReviews />} />
            <Route path="promotions" element={<VendorPromotions />} />
            <Route path="messages" element={<VendorMessages />} />
            <Route path="settings" element={<VendorSettings />} />
          </Route>
        </Route>

        {/* Admin console */}
        <Route path="/admin" element={<ProtectedRoute role="admin" />}>
          <Route element={<DashboardLayout role="admin" />}>
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="customers" element={<AdminCustomers />} />
            <Route path="vendors" element={<AdminVendors />} />
            <Route path="applications" element={<AdminApplications />} />
            <Route path="services" element={<AdminServices />} />
            <Route path="categories" element={<AdminCategories />} />
            <Route path="bookings" element={<AdminBookings />} />
            <Route path="transactions" element={<AdminTransactions />} />
            <Route path="commissions" element={<AdminCommissions />} />
            <Route path="payouts" element={<AdminPayouts />} />
            <Route path="refunds" element={<AdminRefunds />} />
            <Route path="disputes" element={<AdminDisputes />} />
            <Route path="reviews" element={<AdminReviews />} />
            <Route path="coupons" element={<AdminCoupons />} />
            <Route path="reports" element={<AdminReports />} />
            <Route path="cms" element={<AdminCms />} />
            <Route path="roles" element={<AdminRoles />} />
            <Route path="settings" element={<AdminSettings />} />
            <Route path="audit-logs" element={<AdminAuditLogs />} />
          </Route>
        </Route>

        {/* Errors */}
        <Route path="/403" element={<ForbiddenPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}
