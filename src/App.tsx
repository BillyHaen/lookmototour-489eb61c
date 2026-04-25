import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/Index";
import Events from "./pages/Events";
import EventDetail from "./pages/EventDetail";
import CalendarPage from "./pages/CalendarPage";
import About from "./pages/About";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Profile from "./pages/Profile";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Shop from "./pages/Shop";
import MemberProfile from "./pages/MemberProfile";
import RiderProfile from "./pages/RiderProfile";
import RiderMeRedirect from "./pages/RiderMeRedirect";
import Blog from "./pages/Blog";
import BlogDetail from "./pages/BlogDetail";
import TripJournals from "./pages/TripJournals";
import TripJournalDetail from "./pages/TripJournalDetail";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminEvents from "./pages/admin/AdminEvents";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminProducts from "./pages/admin/AdminProducts";
import AdminTestimonials from "./pages/admin/AdminTestimonials";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminBlog from "./pages/admin/AdminBlog";
import AdminTripJournals from "./pages/admin/AdminTripJournals";
import AdminMedia from "./pages/admin/AdminMedia";
import TripMatch from "./pages/TripMatch";
import TrackingStart from "./pages/TrackingStart";
import TrackingManage from "./pages/TrackingManage";
import TrackPublic from "./pages/TrackPublic";
import SponsorDetail from "./pages/SponsorDetail";
import SponsorDeals from "./pages/SponsorDeals";
import AdminSponsors from "./pages/admin/AdminSponsors";
import AdminVendors from "./pages/admin/AdminVendors";
import AdminRentals from "./pages/admin/AdminRentals";
import AdminEmails from "./pages/admin/AdminEmails";
import AdminAuditLogs from "./pages/admin/AdminAuditLogs";
import AdminWallet from "./pages/admin/AdminWallet";
import AdminPopups from "./pages/admin/AdminPopups";
import PopupSlider from "./components/PopupSlider";
import VendorProducts from "./pages/vendor/VendorProducts";
import VendorRentals from "./pages/vendor/VendorRentals";
import ShareRedirect from "./pages/ShareRedirect";
import NotFound from "./pages/NotFound";
import RequireAdmin from "./components/RequireAdmin";
import RequireCompleteProfile from "./components/RequireCompleteProfile";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <PopupSlider />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/events" element={<RequireCompleteProfile><Events /></RequireCompleteProfile>} />
            <Route path="/events/:id" element={<RequireCompleteProfile><EventDetail /></RequireCompleteProfile>} />
            <Route path="/calendar" element={<RequireCompleteProfile><CalendarPage /></RequireCompleteProfile>} />
            <Route path="/about" element={<About />} />
            <Route path="/shop" element={<RequireCompleteProfile><Shop /></RequireCompleteProfile>} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/blog/:slug" element={<BlogDetail />} />
            <Route path="/jurnal" element={<TripJournals />} />
            <Route path="/jurnal/:slug" element={<TripJournalDetail />} />
            <Route path="/member/:userId" element={<MemberProfile />} />
            <Route path="/riders/me" element={<RiderMeRedirect />} />
            <Route path="/riders/:username" element={<RiderProfile />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/admin" element={<RequireAdmin><AdminDashboard /></RequireAdmin>} />
            <Route path="/admin/events" element={<RequireAdmin><AdminEvents /></RequireAdmin>} />
            <Route path="/admin/users" element={<RequireAdmin><AdminUsers /></RequireAdmin>} />
            <Route path="/admin/products" element={<RequireAdmin><AdminProducts /></RequireAdmin>} />
            <Route path="/admin/testimonials" element={<RequireAdmin><AdminTestimonials /></RequireAdmin>} />
            <Route path="/admin/settings" element={<RequireAdmin><AdminSettings /></RequireAdmin>} />
            <Route path="/admin/blog" element={<RequireAdmin><AdminBlog /></RequireAdmin>} />
            <Route path="/admin/trip-journals" element={<RequireAdmin><AdminTripJournals /></RequireAdmin>} />
            <Route path="/admin/media" element={<RequireAdmin><AdminMedia /></RequireAdmin>} />
            <Route path="/trip-match" element={<RequireCompleteProfile><TripMatch /></RequireCompleteProfile>} />
            <Route path="/tracking/start/:eventId" element={<RequireCompleteProfile><TrackingStart /></RequireCompleteProfile>} />
            <Route path="/tracking/manage" element={<RequireCompleteProfile><TrackingManage /></RequireCompleteProfile>} />
            <Route path="/track/:token" element={<TrackPublic />} />
            <Route path="/sponsor/:slug" element={<RequireCompleteProfile><SponsorDetail /></RequireCompleteProfile>} />
            <Route path="/dashboard/sponsor-deals" element={<RequireCompleteProfile><SponsorDeals /></RequireCompleteProfile>} />
            <Route path="/admin/sponsors" element={<RequireAdmin><AdminSponsors /></RequireAdmin>} />
            <Route path="/admin/vendors" element={<RequireAdmin><AdminVendors /></RequireAdmin>} />
            <Route path="/admin/rentals" element={<RequireAdmin><AdminRentals /></RequireAdmin>} />
            <Route path="/admin/emails" element={<RequireAdmin><AdminEmails /></RequireAdmin>} />
            <Route path="/admin/audit-logs" element={<RequireAdmin><AdminAuditLogs /></RequireAdmin>} />
            <Route path="/admin/wallet" element={<RequireAdmin><AdminWallet /></RequireAdmin>} />
            <Route path="/admin/popups" element={<RequireAdmin><AdminPopups /></RequireAdmin>} />
            <Route path="/vendor" element={<VendorProducts />} />
            <Route path="/vendor/products" element={<VendorProducts />} />
            <Route path="/vendor/rentals" element={<VendorRentals />} />
            <Route path="/s/rider/:slug" element={<ShareRedirect to={(s) => `/riders/${s}`} />} />
            <Route path="/s/blog_post/:slug" element={<ShareRedirect to={(s) => `/blog/${s}`} />} />
            <Route path="/s/blog/:slug" element={<ShareRedirect to={(s) => `/blog/${s}`} />} />
            <Route path="/s/trip_journal/:slug" element={<ShareRedirect to={(s) => `/jurnal/${s}`} />} />
            <Route path="/s/jurnal/:slug" element={<ShareRedirect to={(s) => `/jurnal/${s}`} />} />
            <Route path="/s/event/:slug" element={<ShareRedirect to={(s) => `/events/${s}`} />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
