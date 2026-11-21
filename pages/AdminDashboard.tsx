import React from 'react';
import OwnerAnalytics from './OwnerAnalytics';

/**
 * Hardened Admin Dashboard:
 * - Removes previous unauthenticated demo-mode bypass and localStorage admin flags.
 * - Enforces server-verified `public.app_admins` membership via `is_current_user_admin()`.
 * - Exposes strictly aggregate, privacy-preserving metrics via `get_owner_usage_summary()`
 *   without raw user emails, bill values, or complaint texts.
 */
const AdminDashboard: React.FC = () => {
  return <OwnerAnalytics />;
};

export default AdminDashboard;
