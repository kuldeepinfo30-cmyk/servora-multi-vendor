import { Navigate, Route, Routes } from 'react-router-dom';
import { PublicLayout } from '@/components/layout/PublicLayout';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';

/* ---------------------------------- Public --------------------------------- */
import HomePage from '@/pages/public/Home';
import CategoriesPage from '@/pages/public/Categories';
import CategoryDetailPage from '@/pages/public/CategoryDetail';
import ServicesPage from '@/pages/public/Services';
import SearchResultsPage from '@/pages/public/SearchResults';
import VendorsPage from '@/pages/public/Vendors';
import ServiceDetailPage from '@/pages/public/ServiceDetail';
import VendorProfilePage from '@/pages/public/VendorProfile';
import OffersPage from '@/pages/public/Offers';
import HowItWorksPage from '@/pages/public/HowItWorks';
import AboutPage from '@/pages/public/About';
import ContactPage from '@/pages/public/Contact';
import FAQPage from '@/pages/public/FAQ';
import HelpPage from '@/pages/public/Help';
import { TermsPage, PrivacyPage, RefundsPage, AccessibilityPage } from '@/pages/public/PolicyPage';

/* ----------------------------------- Auth ---------------------------------- */
import LoginPage from '@/pages/auth/Login';
import RegisterPage from '@/pages/auth/Register';
import ForgotPasswordPage from '@/pages/auth/ForgotPassword';
import VerifyOtpPage from '@/pages/auth/VerifyOtp';

/* --------------------------------- Customer -------------------------------- */
import CustomerDashboard from '@/pages/customer/Dashboard';
import CustomerBookings from '@/pages/customer/Bookings';
import BookingDetailPage from '@/pages/customer/BookingDetail';
import BookingFlowPage from '@/pages/customer/BookingFlow';
import CustomerFavorites from '@/pages/customer/Favorites';
import CustomerAddresses from '@/pages/customer/Addresses';
import CustomerPayments from '@/pages/customer/Payments';
import CustomerInvoices from '@/pages/customer/Invoices';
import CustomerReviews from '@/pages/customer/Reviews';
import CustomerMessages from '@/pages/customer/Messages';
import CustomerNotifications from '@/pages/customer/Notifications';
import CustomerSupport from '@/pages/customer/Support';
import CustomerSettings from '@/pages/customer/Settings';

/* ---------------------------------- Vendor --------------------------------- */
import VendorDashboard from '@/pages/vendor/Dashboard';
import VendorOnboarding from '@/pages/vendor/Onboarding';
import VendorProfile from '@/pages/vendor/Profile';
import VendorServices from '@/pages/vendor/Services';
import VendorServiceForm from '@/pages/vendor/ServiceForm';
import VendorBookings from '@/pages/vendor/Bookings';
import VendorCalendar from '@/pages/vendor/Calendar';
import VendorStaff from '@/pages/vendor/Staff';
import VendorCustomers from '@/pages/vendor/Customers';
import VendorEarnings from '@/pages/vendor/Earnings';
import VendorPayouts from '@/pages/vendor/Payouts';
import VendorReviews from '@/pages/vendor/Reviews';
import VendorPromotions from '@/pages/vendor/Promotions';
import VendorMessages from '@/pages/vendor/Messages';
import VendorSettings from '@/pages/vendor/Settings';

/* ----------------------------------- Admin --------------------------------- */
import AdminDashboard from '@/pages/admin/Dashboard';
import AdminCustomers from '@/pages/admin/Customers';
import AdminVendors from '@/pages/admin/Vendors';
import AdminApplications from '@/pages/admin/Applications';
import AdminServices from '@/pages/admin/Services';
import AdminCategories from '@/pages/admin/Categories';
import AdminBookings from '@/pages/admin/Bookings';
import AdminTransactions from '@/pages/admin/Transactions';
import AdminCommissions from '@/pages/admin/Commissions';
import AdminPayouts from '@/pages/admin/Payouts';
import AdminRefunds from '@/pages/admin/Refunds';
import AdminDisputes from '@/pages/admin/Disputes';
import AdminReviews from '@/pages/admin/Reviews';
import AdminCoupons from '@/pages/admin/Coupons';
import AdminReports from '@/pages/admin/Reports';
import AdminCms from '@/pages/admin/CMS';
import AdminRoles from '@/pages/admin/Roles';
import AdminSettings from '@/pages/admin/Settings';
import AdminAuditLogs from '@/pages/admin/AuditLogs';

/* ---------------------------------- Errors --------------------------------- */
import ForbiddenPage from '@/pages/Forbidden';
import NotFoundPage from '@/pages/NotFound';

export default function App() {
  return (
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
        <Route path="/policies/terms" element={<TermsPage />} />
        <Route path="/policies/privacy" element={<PrivacyPage />} />
        <Route path="/policies/refunds" element={<RefundsPage />} />
        <Route path="/policies/accessibility" element={<AccessibilityPage />} />
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
  );
}
