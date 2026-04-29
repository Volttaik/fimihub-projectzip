import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import Header from '@/components/Header';
import Discover from '@/pages/Discover';
import Home from '@/pages/Home';
import ListingDetail from '@/pages/ListingDetail';
import PostListing from '@/pages/PostListing';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import Dashboard from '@/pages/Dashboard';

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-background">
        <Header />
        <Routes>
          <Route path="/"           element={<Discover />} />
          <Route path="/home"       element={<Home />} />
          <Route path="/listing/:id" element={<ListingDetail />} />
          <Route path="/post"       element={<PostListing />} />
          <Route path="/login"      element={<Login />} />
          <Route path="/register"   element={<Register />} />
          <Route path="/dashboard"  element={<Dashboard />} />
        </Routes>
        <Toaster />
      </div>
    </BrowserRouter>
  );
}
